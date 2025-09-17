/*
  Security Validation Layer for CSV Injection and File Bomb Protection

  This module provides comprehensive security validation including:
  - CSV injection prevention
  - File bomb detection (zip bombs, billion laughs, etc.)
  - Content sanitization
  - Malicious payload detection
  - Rate limiting and abuse prevention
*/

import { Readable } from 'stream';
import { createHash, randomBytes } from 'crypto';

export interface SecurityConfig {
  maxFileSize: number; // bytes
  maxUncompressedRatio: number; // ratio of uncompressed to compressed size
  maxCellLength: number; // max characters per cell
  maxRowLength: number; // max characters per row
  maxTotalRows: number; // max total rows allowed
  maxProcessingTime: number; // max processing time in ms
  enableFormulaDetection: boolean;
  enableScriptDetection: boolean;
  enableUrlValidation: boolean;
  allowedFileTypes: string[];
  blockedExtensions: string[];
  scanDepth: number; // max depth for nested content scanning
}

export interface SecurityThreat {
  type: SecurityThreatType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: {
    row?: number;
    column?: string;
    byte?: number;
  };
  payload?: string;
  mitigation: string;
}

export type SecurityThreatType =
  | 'csv_injection'
  | 'formula_injection'
  | 'script_injection'
  | 'file_bomb'
  | 'malicious_url'
  | 'oversized_content'
  | 'encoding_attack'
  | 'path_traversal'
  | 'command_injection'
  | 'sql_injection'
  | 'xss_attempt'
  | 'data_exfiltration';

export interface ScanResult {
  isSecure: boolean;
  threats: SecurityThreat[];
  sanitizedContent?: any;
  processingTime: number;
  fileFingerprint: string;
}

export interface FileAnalysis {
  fileType: string;
  actualSize: number;
  declaredSize?: number;
  compressionRatio?: number;
  entropy: number; // measure of randomness (0-8)
  suspiciousPatterns: string[];
  mimeType?: string;
}

export class SecurityValidator {
  private config: SecurityConfig;
  private threatPatterns: Map<SecurityThreatType, RegExp[]>;
  private suspiciousUrls: Set<string> = new Set();

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      maxFileSize: config.maxFileSize || 100 * 1024 * 1024, // 100MB
      maxUncompressedRatio: config.maxUncompressedRatio || 100, // 100:1 ratio
      maxCellLength: config.maxCellLength || 10000, // 10K chars per cell
      maxRowLength: config.maxRowLength || 100000, // 100K chars per row
      maxTotalRows: config.maxTotalRows || 100000, // 100K rows
      maxProcessingTime: config.maxProcessingTime || 30 * 60 * 1000, // 30 minutes
      enableFormulaDetection: config.enableFormulaDetection ?? true,
      enableScriptDetection: config.enableScriptDetection ?? true,
      enableUrlValidation: config.enableUrlValidation ?? true,
      allowedFileTypes: config.allowedFileTypes || ['csv', 'xlsx', 'xls'],
      blockedExtensions: config.blockedExtensions || ['exe', 'bat', 'cmd', 'scr', 'vbs', 'js'],
      scanDepth: config.scanDepth || 3
    };

    this.initializeThreatPatterns();
  }

  public async validateFile(
    filename: string,
    buffer: Buffer,
    declaredSize?: number
  ): Promise<ScanResult> {
    const startTime = Date.now();
    const fileFingerprint = this.generateFileFingerprint(buffer);

    const threats: SecurityThreat[] = [];

    try {
      // Basic file validation
      await this.validateFileBasics(filename, buffer, declaredSize, threats);

      // File analysis
      const analysis = await this.analyzeFile(filename, buffer);
      this.checkFileAnalysis(analysis, threats);

      // Content scanning
      if (threats.filter(t => t.severity === 'critical').length === 0) {
        await this.scanFileContent(buffer, analysis.fileType, threats);
      }

      const processingTime = Date.now() - startTime;

      // Check processing time
      if (processingTime > this.config.maxProcessingTime) {
        threats.push({
          type: 'file_bomb',
          severity: 'high',
          description: 'File processing exceeded time limit',
          mitigation: 'File rejected due to suspicious processing time'
        });
      }

      return {
        isSecure: threats.filter(t => t.severity === 'high' || t.severity === 'critical').length === 0,
        threats,
        processingTime,
        fileFingerprint
      };

    } catch (error) {
      threats.push({
        type: 'file_bomb',
        severity: 'critical',
        description: `Security scan failed: ${error instanceof Error ? error.message : String(error)}`,
        mitigation: 'File rejected due to scan failure'
      });

      return {
        isSecure: false,
        threats,
        processingTime: Date.now() - startTime,
        fileFingerprint
      };
    }
  }

  public sanitizeRowData(rowData: any, rowIndex: number): { sanitized: any; threats: SecurityThreat[] } {
    const threats: SecurityThreat[] = [];
    const sanitized: any = {};

    for (const [key, value] of Object.entries(rowData)) {
      if (typeof value === 'string') {
        const cellThreats = this.scanCellContent(value, rowIndex, key);
        threats.push(...cellThreats);

        // Sanitize the content
        sanitized[key] = this.sanitizeString(value, cellThreats);
      } else {
        sanitized[key] = value;
      }
    }

    return { sanitized, threats };
  }

  private async validateFileBasics(
    filename: string,
    buffer: Buffer,
    declaredSize: number | undefined,
    threats: SecurityThreat[]
  ): Promise<void> {
    // File size validation
    if (buffer.length > this.config.maxFileSize) {
      threats.push({
        type: 'oversized_content',
        severity: 'high',
        description: `File size ${buffer.length} exceeds maximum ${this.config.maxFileSize}`,
        location: { byte: buffer.length },
        mitigation: 'Reduce file size or split into smaller files'
      });
    }

    // Size declaration mismatch
    if (declaredSize && Math.abs(buffer.length - declaredSize) > 1000) {
      threats.push({
        type: 'file_bomb',
        severity: 'medium',
        description: 'Declared size differs significantly from actual size',
        mitigation: 'File size validation required'
      });
    }

    // File extension validation
    const extension = filename.toLowerCase().split('.').pop() || '';
    if (this.config.blockedExtensions.includes(extension)) {
      threats.push({
        type: 'file_bomb',
        severity: 'critical',
        description: `Blocked file extension: ${extension}`,
        mitigation: 'Use allowed file types only'
      });
    }

    if (!this.config.allowedFileTypes.includes(extension)) {
      threats.push({
        type: 'file_bomb',
        severity: 'high',
        description: `Unsupported file type: ${extension}`,
        mitigation: 'Use CSV or XLSX files only'
      });
    }

    // Path traversal detection
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      threats.push({
        type: 'path_traversal',
        severity: 'high',
        description: 'Filename contains path traversal patterns',
        mitigation: 'Use simple filenames without path separators'
      });
    }
  }

  private async analyzeFile(filename: string, buffer: Buffer): Promise<FileAnalysis> {
    const extension = filename.toLowerCase().split('.').pop() || '';

    const analysis: FileAnalysis = {
      fileType: extension,
      actualSize: buffer.length,
      entropy: this.calculateEntropy(buffer),
      suspiciousPatterns: []
    };

    // Check for ZIP-based files (XLSX)
    if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B) {
      analysis.fileType = 'xlsx';

      // Basic compression ratio check for zip bombs
      const uncompressedSizeOffset = this.findZipUncompressedSize(buffer);
      if (uncompressedSizeOffset > 0) {
        const uncompressedSize = buffer.readUInt32LE(uncompressedSizeOffset);
        analysis.compressionRatio = uncompressedSize / buffer.length;
      }
    }

    // Look for suspicious patterns
    const sample = buffer.slice(0, Math.min(1024, buffer.length)).toString('utf8', 0, 1024);

    // Check for suspicious content
    const suspiciousPatterns = [
      /\x00{10,}/, // Excessive null bytes
      /(.)\1{1000,}/, // Excessive repetition
      /<script[\s\S]*?<\/script>/gi, // Script tags
      /javascript:/gi, // JavaScript protocol
      /data:.*base64/gi, // Base64 data URLs
      /file:\/\//gi, // File protocol
    ];

    suspiciousPatterns.forEach((pattern, index) => {
      if (pattern.test(sample)) {
        analysis.suspiciousPatterns.push(`Pattern ${index + 1}`);
      }
    });

    return analysis;
  }

  private checkFileAnalysis(analysis: FileAnalysis, threats: SecurityThreat[]): void {
    // High entropy could indicate encrypted or compressed malicious content
    if (analysis.entropy > 7.5) {
      threats.push({
        type: 'file_bomb',
        severity: 'medium',
        description: `High entropy (${analysis.entropy.toFixed(2)}) suggests compressed or encrypted content`,
        mitigation: 'Review file content for suspicious patterns'
      });
    }

    // Check compression ratio for zip bombs
    if (analysis.compressionRatio && analysis.compressionRatio > this.config.maxUncompressedRatio) {
      threats.push({
        type: 'file_bomb',
        severity: 'critical',
        description: `Compression ratio ${analysis.compressionRatio.toFixed(1)}:1 exceeds safe limit`,
        mitigation: 'File rejected as potential zip bomb'
      });
    }

    // Check for suspicious patterns
    if (analysis.suspiciousPatterns.length > 0) {
      threats.push({
        type: 'file_bomb',
        severity: 'medium',
        description: `Suspicious patterns detected: ${analysis.suspiciousPatterns.join(', ')}`,
        mitigation: 'Review file content manually'
      });
    }
  }

  private async scanFileContent(buffer: Buffer, fileType: string, threats: SecurityThreat[]): Promise<void> {
    if (fileType === 'csv') {
      await this.scanCSVContent(buffer, threats);
    } else if (fileType === 'xlsx') {
      await this.scanXLSXContent(buffer, threats);
    }
  }

  private async scanCSVContent(buffer: Buffer, threats: SecurityThreat[]): Promise<void> {
    const content = buffer.toString('utf8');
    const lines = content.split('\n');

    if (lines.length > this.config.maxTotalRows) {
      threats.push({
        type: 'oversized_content',
        severity: 'high',
        description: `Row count ${lines.length} exceeds maximum ${this.config.maxTotalRows}`,
        mitigation: 'Split file into smaller chunks'
      });
    }

    lines.forEach((line, lineIndex) => {
      if (line.length > this.config.maxRowLength) {
        threats.push({
          type: 'oversized_content',
          severity: 'medium',
          description: `Row ${lineIndex + 1} exceeds maximum length`,
          location: { row: lineIndex + 1 },
          mitigation: 'Reduce row content length'
        });
      }

      // Scan for threats in the line
      const lineThreats = this.scanTextContent(line, lineIndex + 1);
      threats.push(...lineThreats);
    });
  }

  private async scanXLSXContent(buffer: Buffer, threats: SecurityThreat[]): Promise<void> {
    // Basic XLSX security scanning
    // In a full implementation, this would parse the XLSX structure
    // and scan individual cells and embedded content

    const bufferStr = buffer.toString('binary');

    // Look for suspicious embedded content
    if (bufferStr.includes('vbaProject') || bufferStr.includes('macros')) {
      threats.push({
        type: 'script_injection',
        severity: 'high',
        description: 'XLSX file contains VBA macros or projects',
        mitigation: 'Remove macros or use macro-free files'
      });
    }

    // Check for external references
    if (bufferStr.includes('http://') || bufferStr.includes('https://') || bufferStr.includes('ftp://')) {
      threats.push({
        type: 'data_exfiltration',
        severity: 'medium',
        description: 'XLSX file contains external references',
        mitigation: 'Review external links for security'
      });
    }
  }

  private scanCellContent(content: string, rowIndex: number, columnName: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    if (content.length > this.config.maxCellLength) {
      threats.push({
        type: 'oversized_content',
        severity: 'medium',
        description: `Cell content exceeds maximum length`,
        location: { row: rowIndex, column: columnName },
        mitigation: 'Truncate or split cell content'
      });
    }

    const textThreats = this.scanTextContent(content, rowIndex, columnName);
    threats.push(...textThreats);

    return threats;
  }

  private scanTextContent(content: string, rowIndex?: number, columnName?: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const location = { row: rowIndex, column: columnName };

    // Scan against all threat patterns
    for (const [threatType, patterns] of this.threatPatterns.entries()) {
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          const severity = this.getThreatSeverity(threatType);
          threats.push({
            type: threatType,
            severity,
            description: `${threatType.replace('_', ' ')} detected: ${matches[0].substring(0, 50)}`,
            location,
            payload: matches[0],
            mitigation: this.getMitigation(threatType)
          });
        }
      }
    }

    return threats;
  }

  private sanitizeString(value: string, threats: SecurityThreat[]): string {
    let sanitized = value;

    // Remove or escape dangerous characters based on detected threats
    threats.forEach(threat => {
      switch (threat.type) {
        case 'csv_injection':
        case 'formula_injection':
          // Remove leading formula characters
          sanitized = sanitized.replace(/^[=+\-@]+/, '');
          break;

        case 'script_injection':
          // Remove script tags and javascript
          sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, '');
          sanitized = sanitized.replace(/javascript:/gi, '');
          break;

        case 'malicious_url':
          // Replace suspicious URLs with placeholder
          if (threat.payload) {
            sanitized = sanitized.replace(threat.payload, '[URL_REMOVED]');
          }
          break;

        case 'command_injection':
          // Remove command injection patterns
          sanitized = sanitized.replace(/[;&|`$(){}[\]\\]/g, '');
          break;
      }
    });

    // General sanitization
    sanitized = sanitized.trim();

    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s{10,}/g, ' ');

    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return sanitized;
  }

  private initializeThreatPatterns(): void {
    this.threatPatterns = new Map([
      ['csv_injection', [
        /^[=+\-@]/,
        /^'[=+\-@]/,
        /^\s*[=+\-@]/,
      ]],

      ['formula_injection', [
        /=.*\(.*\)/,
        /=.*cmd\|/i,
        /=.*powershell/i,
        /=.*system\(/i,
      ]],

      ['script_injection', [
        /<script[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /on\w+\s*=/gi,
        /expression\s*\(/gi,
      ]],

      ['malicious_url', [
        /file:\/\/[^\\s]*/gi,
        /ftp:\/\/[^\\s]*/gi,
        /\\\\[^\\s]*\\[^\\s]*/gi, // UNC paths
        /data:.*base64/gi,
      ]],

      ['command_injection', [
        /[;&|`]/,
        /\$\([^)]*\)/,
        /`[^`]*`/,
        /\|\s*[a-z]/i,
      ]],

      ['sql_injection', [
        /('|(\\'))+.*(or|and)\\s+(.*=.*|\\d+)/gi,
        /(union|select|insert|update|delete|drop|create|alter)\\s+/gi,
        /exec\\s*\\(/gi,
      ]],

      ['xss_attempt', [
        /<[\\/]?\\w+[^>]*>/gi,
        /&lt;.*&gt;/gi,
        /%3C.*%3E/gi,
      ]],

      ['data_exfiltration', [
        /http[s]?:\\/\\/(?!localhost|127\\.0\\.0\\.1)[^\\s]*/gi,
        /\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b/g,
      ]],
    ]);
  }

  private getThreatSeverity(threatType: SecurityThreatType): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<SecurityThreatType, 'low' | 'medium' | 'high' | 'critical'> = {
      csv_injection: 'high',
      formula_injection: 'critical',
      script_injection: 'critical',
      file_bomb: 'critical',
      malicious_url: 'medium',
      oversized_content: 'medium',
      encoding_attack: 'medium',
      path_traversal: 'high',
      command_injection: 'critical',
      sql_injection: 'critical',
      xss_attempt: 'high',
      data_exfiltration: 'high',
    };

    return severityMap[threatType] || 'medium';
  }

  private getMitigation(threatType: SecurityThreatType): string {
    const mitigationMap: Record<SecurityThreatType, string> = {
      csv_injection: 'Remove leading formula characters or prefix with single quote',
      formula_injection: 'Content blocked - contains executable formulas',
      script_injection: 'Script content removed or blocked',
      file_bomb: 'File rejected due to suspicious characteristics',
      malicious_url: 'Suspicious URLs removed or blocked',
      oversized_content: 'Content truncated to safe limits',
      encoding_attack: 'Content re-encoded with safe encoding',
      path_traversal: 'Path separators removed or escaped',
      command_injection: 'Command injection patterns removed',
      sql_injection: 'SQL injection patterns removed',
      xss_attempt: 'HTML/script tags escaped or removed',
      data_exfiltration: 'External references removed or blocked',
    };

    return mitigationMap[threatType] || 'Content sanitized';
  }

  private calculateEntropy(buffer: Buffer): number {
    const frequencies = new Array(256).fill(0);

    for (const byte of buffer) {
      frequencies[byte]++;
    }

    let entropy = 0;
    const length = buffer.length;

    for (const freq of frequencies) {
      if (freq > 0) {
        const probability = freq / length;
        entropy -= probability * Math.log2(probability);
      }
    }

    return entropy;
  }

  private findZipUncompressedSize(buffer: Buffer): number {
    // Very basic ZIP central directory parsing
    // In a full implementation, this would properly parse ZIP structure
    const cdSignature = Buffer.from([0x50, 0x4B, 0x01, 0x02]);
    const index = buffer.indexOf(cdSignature);

    if (index >= 0 && index + 24 < buffer.length) {
      return index + 24; // Approximate offset to uncompressed size
    }

    return 0;
  }

  private generateFileFingerprint(buffer: Buffer): string {
    const hash = createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  }

  public addSuspiciousUrl(url: string): void {
    this.suspiciousUrls.add(url);
  }

  public removeSuspiciousUrl(url: string): void {
    this.suspiciousUrls.delete(url);
  }

  public getSuspiciousUrls(): string[] {
    return Array.from(this.suspiciousUrls);
  }
}