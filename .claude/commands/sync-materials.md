---
description: Sync materials from external sources to Medusa materials module
argument-hint: [--dry-run]
allowed-tools: Bash, Read, Grep
---

# Materials Synchronization

Synchronize fabric materials from external sources into the Medusa materials module.

**Mode**: ${1:---dry-run for test mode, omit for actual sync}

## Steps:

1. **Check current sync status**:
   ```bash
   cd medusa && npm run test:materials
   ```

2. **Run materials sync**:
   - Dry run (test mode): `cd medusa && npm run sync:materials:dry`
   - Actual sync: `cd medusa && npm run sync:materials`

3. **Verify sync results**:
   - Check for duplicate handling
   - Verify material counts
   - Review any errors or conflicts

4. **Update variant-material links** if needed:
   - Review affected product variants
   - Update relationships via admin API

## Post-Sync Validation:
- Run integration tests: `cd medusa && npm run test:integration:modules`
- Check material availability in admin dashboard
- Verify inventory levels are correct

Use `/log-session materials-inventory-expert "Synced materials from [source]"` after completion.