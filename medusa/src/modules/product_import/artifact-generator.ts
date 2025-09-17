/*
  Artifact Generation System

  Creates consistent, well-structured artifacts for import jobs including:
  - Validation reports (JSON)
  - Error rows CSV with detailed information
  - Result summary CSV with product/variant details
  - Annotated XLSX (optional for XLSX inputs)
*/

import { createWriteStream, promises as fs } from 'fs';
import { stringify } from 'csv-parse';
import * as path from 'path';
import { ProductRow } from './schemas';
import { ValidationIssue } from './data-integrity';
import ExcelJS from 'exceljs';

export interface ImportResult {
  row_index: number;
  status: 'created' | 'updated' | 'skipped' | 'failed';
  product_id?: string;
  product_handle?: string;
  variant_skus?: string[];
  message?: string;
  error?: string;
}

export interface ErrorRow {
  original_row_index: number;
  field: string;
  error: string;
  error_code?: string;
  suggestion?: string;
  original_value?: any;
}

export interface ValidationReport {
  job_id: string;
  trace_id: string;
  timestamp: string;
  summary: {
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    warnings_count: number;
    errors_count: number;
    critical_count: number;
  };
  issues_by_severity: {
    warning: ValidationIssue[];
    error: ValidationIssue[];
    critical: ValidationIssue[];
  };
  common_issues: {
    issue_type: string;
    count: number;
    affected_rows: number[];
  }[];
  configuration: {
    dry_run: boolean;
    upsert_by?: string;
    variant_strategy: string;
    force_prune: boolean;
  };
}

export class ArtifactGenerator {
  private artifactsDir: string;
  private jobId: string;

  constructor(jobId: string, artifactsDir: string = '/tmp/medusa-imports') {
    this.jobId = jobId;
    this.artifactsDir = path.join(artifactsDir, jobId);
  }

  public async initialize(): Promise<void> {
    await fs.mkdir(this.artifactsDir, { recursive: true });
  }

  public async generateValidationReport(
    issues: Map<number, ValidationIssue[]>,
    totalRows: number,
    configuration: any
  ): Promise<string> {
    const report: ValidationReport = {
      job_id: this.jobId,
      trace_id: this.jobId, // Could be different if you have tracing
      timestamp: new Date().toISOString(),
      summary: {
        total_rows: totalRows,
        valid_rows: 0,
        invalid_rows: 0,
        warnings_count: 0,
        errors_count: 0,
        critical_count: 0
      },
      issues_by_severity: {
        warning: [],
        error: [],
        critical: []
      },
      common_issues: [],
      configuration
    };

    // Aggregate issues
    const issueTypeCount = new Map<string, { count: number; rows: number[] }>();

    issues.forEach((rowIssues, rowIndex) => {
      let hasError = false;
      rowIssues.forEach(issue => {
        report.issues_by_severity[issue.severity].push({
          ...issue,
          relatedData: { row_index: rowIndex }
        });

        // Count by severity
        switch (issue.severity) {
          case 'warning':
            report.summary.warnings_count++;
            break;
          case 'error':
            report.summary.errors_count++;
            hasError = true;
            break;
          case 'critical':
            report.summary.critical_count++;
            hasError = true;
            break;
        }

        // Track common issues
        const key = `${issue.ruleName}:${issue.severity}`;
        if (!issueTypeCount.has(key)) {
          issueTypeCount.set(key, { count: 0, rows: [] });
        }
        const tracker = issueTypeCount.get(key)!;
        tracker.count++;
        tracker.rows.push(rowIndex);
      });

      if (hasError) {
        report.summary.invalid_rows++;
      } else {
        report.summary.valid_rows++;
      }
    });

    // Add rows without issues as valid
    const rowsWithIssues = issues.size;
    report.summary.valid_rows = totalRows - report.summary.invalid_rows;

    // Format common issues
    report.common_issues = Array.from(issueTypeCount.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10) // Top 10 common issues
      .map(([type, data]) => ({
        issue_type: type,
        count: data.count,
        affected_rows: data.rows.slice(0, 10) // First 10 affected rows
      }));

    const reportPath = path.join(this.artifactsDir, 'validation_report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    return reportPath;
  }

  public async generateErrorRowsCsv(
    errors: ErrorRow[]
  ): Promise<string> {
    const csvPath = path.join(this.artifactsDir, 'error_rows.csv');

    const headers = [
      'original_row_index',
      'field',
      'error',
      'error_code',
      'suggestion',
      'original_value'
    ];

    const stringifier = stringify({
      header: true,
      columns: headers
    });

    const writeStream = createWriteStream(csvPath);
    stringifier.pipe(writeStream);

    // Write header row
    stringifier.write(headers);

    // Write error rows
    for (const error of errors) {
      stringifier.write([
        error.original_row_index,
        error.field,
        error.error,
        error.error_code || '',
        error.suggestion || '',
        error.original_value ? JSON.stringify(error.original_value) : ''
      ]);
    }

    stringifier.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(csvPath));
      writeStream.on('error', reject);
    });
  }

  public async generateResultSummaryCsv(
    results: ImportResult[]
  ): Promise<string> {
    const csvPath = path.join(this.artifactsDir, 'result_summary.csv');

    const headers = [
      'row_index',
      'status',
      'product_id',
      'product_handle',
      'variant_skus',
      'message'
    ];

    const stringifier = stringify({
      header: true,
      columns: headers
    });

    const writeStream = createWriteStream(csvPath);
    stringifier.pipe(writeStream);

    // Write header row
    stringifier.write(headers);

    // Write result rows
    for (const result of results) {
      stringifier.write([
        result.row_index,
        result.status,
        result.product_id || '',
        result.product_handle || '',
        result.variant_skus ? result.variant_skus.join(';') : '',
        result.message || result.error || ''
      ]);
    }

    stringifier.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(csvPath));
      writeStream.on('error', reject);
    });
  }

  public async generateAnnotatedXlsx(
    originalPath: string,
    issues: Map<number, ValidationIssue[]>,
    results: ImportResult[],
    skipLargeFiles: boolean = true
  ): Promise<string | null> {
    // Check file size
    const stats = await fs.stat(originalPath);
    const maxSizeMB = 50;
    if (skipLargeFiles && stats.size > maxSizeMB * 1024 * 1024) {
      return null; // Skip for large files
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(originalPath);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) return null;

    // Add status columns
    const headerRow = worksheet.getRow(1);
    const lastCol = headerRow.cellCount + 1;

    worksheet.getCell(1, lastCol).value = 'Import Status';
    worksheet.getCell(1, lastCol + 1).value = 'Validation Issues';
    worksheet.getCell(1, lastCol + 2).value = 'Product ID';
    worksheet.getCell(1, lastCol + 3).value = 'Notes';

    // Color coding
    const statusColors = {
      created: { argb: 'FF90EE90' }, // Light green
      updated: { argb: 'FF87CEEB' }, // Sky blue
      failed: { argb: 'FFFFCCCB' }, // Light red
      skipped: { argb: 'FFFFFFE0' }  // Light yellow
    };

    // Annotate data rows
    results.forEach(result => {
      const row = worksheet.getRow(result.row_index + 1); // +1 for header
      const rowIssues = issues.get(result.row_index) || [];

      // Status
      const statusCell = row.getCell(lastCol);
      statusCell.value = result.status;
      if (statusColors[result.status]) {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: statusColors[result.status]
        };
      }

      // Issues
      if (rowIssues.length > 0) {
        const issueText = rowIssues
          .map(i => `[${i.severity.toUpperCase()}] ${i.message}`)
          .join('\n');
        row.getCell(lastCol + 1).value = issueText;
      }

      // Product ID
      if (result.product_id) {
        row.getCell(lastCol + 2).value = result.product_id;
      }

      // Notes
      if (result.message || result.error) {
        row.getCell(lastCol + 3).value = result.message || result.error;
      }
    });

    const annotatedPath = path.join(this.artifactsDir, 'annotated_input.xlsx');
    await workbook.xlsx.writeFile(annotatedPath);
    return annotatedPath;
  }

  public async saveCheckpoint(
    checkpoint: any
  ): Promise<string> {
    const checkpointPath = path.join(this.artifactsDir, 'checkpoint.json');
    await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
    return checkpointPath;
  }

  public async saveDLQEntries(
    dlqEntries: any[]
  ): Promise<string> {
    const dlqPath = path.join(this.artifactsDir, 'dlq_entries.json');
    await fs.writeFile(dlqPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      count: dlqEntries.length,
      entries: dlqEntries
    }, null, 2));
    return dlqPath;
  }

  public async getArtifactUrls(baseUrl: string): Promise<Record<string, string>> {
    const files = await fs.readdir(this.artifactsDir);
    const urls: Record<string, string> = {};

    for (const file of files) {
      const key = file.replace(/\.(json|csv|xlsx)$/, '').replace(/_/g, '_');
      urls[`${key}_url`] = `${baseUrl}/admin/products/import/jobs/${this.jobId}/artifacts/${file}`;
    }

    return urls;
  }
}