# Raw Materials Implementation - Session Execution Workflow

## Overview
Implement the Raw Materials system using session-based development with TDD, quality gates, and clear handoffs between sessions.

## Workflow Protocol

### Before Each Session
1. **Load Context**
   - Read `dev-sessions/logs/session_<N-1>.log` (if exists)
   - Review relevant files from previous session
   - Check current test coverage and quality metrics
   - Verify Docker environment is running

2. **Session Setup**
   - Select session N from `dev-sessions/ai_coding_prompts.md`
   - Open `dev-sessions/tasks.md` to see current progress
   - Ensure all dependencies are installed
   - Clear any test database state

### During Each Session
1. **TDD Approach**
   - Write failing tests FIRST
   - Implement minimal code to pass tests
   - Refactor while keeping tests green
   - Maintain ≥80% coverage for new code

2. **Quality Checks**
   - Run linting: `npm run lint`
   - Type checking: `npm run type-check`
   - Tests: `npm run test:unit` or `npm run test:integration`
   - Security scan for vulnerabilities

3. **Scope Management**
   - Keep changes focused on current session only
   - Do NOT implement future session tasks
   - Document any discovered blockers

### After Each Session
1. **Update Progress**
   - Mark completed items in `dev-sessions/tasks.md`
   - Update overall progress percentage
   - Note any deferred items

2. **Create Session Log**
   - Write `dev-sessions/logs/session_<N>.log` using template
   - Include test results and coverage metrics
   - Document any security/performance considerations
   - List follow-up items for next session

3. **Quality Gate Verification**
   - Check against `dev-sessions/QUALITY_GATE.md`
   - Ensure all non-negotiables are met
   - Document any exceptions with justification

4. **Commit & Handoff**
   - Create atomic git commit for session work
   - Push to feature branch
   - Update PR description if applicable

## Session Structure

### Session Duration
- Target: 2-4 hours of focused work
- Maximum: 6 hours including breaks
- Break after each major milestone

### Session Types
1. **Foundation Sessions** (1-5): Infrastructure and setup
2. **Core Sessions** (6-15): Main implementation
3. **Integration Sessions** (16-20): Component integration
4. **Testing Sessions** (21-23): E2E and performance
5. **Polish Sessions** (24-25): Documentation and deployment

## Testing Protocol

### Medusa Backend Tests
```bash
cd medusa
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
npm run test:coverage        # Coverage report
```

### Frontend Tests
```bash
npm run test                 # All tests via Turbo
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

### Docker Environment Tests
```bash
docker-compose exec medusa npm test
docker-compose exec admin npm test
```

## Log Format Requirements

Each session log MUST include:
- Timestamp (UTC)
- Session objective
- Files changed (with line counts)
- Tests added/modified
- Coverage metrics
- Performance metrics (if applicable)
- Security considerations
- Migration steps (if any)
- Follow-up items
- Blockers encountered

## Communication Protocol

### Async Handoffs
- Session logs serve as primary communication
- Use comments in code for complex logic
- Document assumptions in logs
- Flag urgent items with 🚨 emoji

### Synchronous Reviews
- After every 5 sessions
- When switching session types
- Before production deployment
- When blockers arise

## Rollback Protocol

If a session needs rollback:
1. Document reason in rollback log
2. Git revert the session commit
3. Update tasks.md to reflect rollback
4. Plan recovery in next session

## Success Metrics

### Per Session
- [ ] All tests passing
- [ ] Coverage ≥80% for new code
- [ ] No new TypeScript errors
- [ ] Quality gates met
- [ ] Session log created

### Per Milestone (5 sessions)
- [ ] Integration tests passing
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Stakeholder demo ready

## Emergency Protocol

If critical issues arise:
1. Stop current session immediately
2. Document issue in emergency log
3. Rollback if necessary
4. Escalate to team lead
5. Plan fix in dedicated session

## Notes

- Prefer smaller, complete sessions over large, partial ones
- Always leave the codebase in a working state
- Test database migrations in dry-run mode first
- Use feature flags for gradual rollout
- Keep security and performance as first-class concerns