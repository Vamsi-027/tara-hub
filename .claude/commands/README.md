# Claude Code Custom Commands

This directory contains custom slash commands for Tara Hub development workflows. These commands streamline common tasks and reduce token consumption by encapsulating repetitive operations.

## Quick Reference

### Development & Logging
- `/log-session [agent-name] [activity]` - Log development activity to /dev.sessions.log/

### Materials & Inventory
- `/sync-materials [--dry-run]` - Sync materials from external sources

### Testing & Quality
- `/test-e2e [app-name] [--headed]` - Run end-to-end tests
- `/review-security [path]` - Comprehensive security review

### Database Operations
- `/migrate-db [migration-name] [--rollback]` - Execute database migration
- `/optimize-query [query-or-file]` - Analyze and optimize queries

### Deployment & Infrastructure
- `/deploy-check [environment]` - Pre-deployment validation
- `/fix-build [app-name]` - Diagnose and fix build errors

### Performance & Monitoring
- `/perf-check [component]` - Performance analysis and bottleneck detection

### Compliance & Business
- `/compliance-check [regulation]` - Legal/regulatory compliance validation
- `/analyze-business-metrics [metric-type]` - Business intelligence analysis

## Command Usage

All commands support:
- **Arguments**: Position-based (`$1`, `$2`) or all arguments (`$ARGUMENTS`)
- **Bash execution**: Commands prefixed with `!` run before Claude processes
- **Tool restrictions**: Each command has specific allowed tools via frontmatter

## Examples

```bash
# Log agent activity
/log-session medusa-commerce-specialist "Implemented Stripe webhook handler"

# Run materials sync in test mode
/sync-materials --dry-run

# Security review of specific directory
/review-security medusa/src/api/admin

# Check deployment readiness for production
/deploy-check production

# Run E2E tests with browser UI
/test-e2e fabric-store --headed

# Analyze database query performance
/optimize-query "SELECT * FROM product_variants WHERE..."

# Check GDPR compliance
/compliance-check GDPR

# Analyze revenue metrics
/analyze-business-metrics revenue
```

## Creating New Commands

1. Create a new `.md` file in `.claude/commands/`
2. Add YAML frontmatter with metadata:
   ```yaml
   ---
   description: Brief description of what the command does
   argument-hint: [arg1] [arg2]
   allowed-tools: Tool1, Tool2, Tool3
   ---
   ```
3. Write the command prompt body with argument placeholders (`$1`, `$2`, `$ARGUMENTS`)

## Best Practices

- **Keep commands focused**: One command should do one thing well
- **Use clear descriptions**: Help Claude understand when to use the command
- **Restrict tools**: Only grant necessary tools via `allowed-tools`
- **Document arguments**: Use `argument-hint` to show expected parameters
- **Reference sub-agents**: Commands can suggest which agent to use for complex tasks

## Integration with Sub-Agents

Sub-agents now reference these commands in their "Quick Commands" sections, reducing their context size and token consumption while maintaining full functionality.