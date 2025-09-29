---
description: Log development activity to /dev.sessions.log/ following standardized format
argument-hint: [agent-name] [activity-description]
allowed-tools: Write, Bash
---

# Session Logging Command

Log this development activity to `/dev.sessions.log/` following the standardized format:

**Agent/Role**: $1
**Activity**: $2

Create or append to today's log file (`/dev.sessions.log/YYYY-MM-DD-session.log`) with this entry:

```
[TIMESTAMP] [SUB_AGENT or HUMAN_DEV] [$1] Activity: $2
Patterns: <technologies/patterns used - infer from context>
Challenges: <any difficulties encountered>
Gaps: <missing capabilities identified>
Effectiveness: <high/medium/low - based on task completion>
Next Actions: <recommended follow-ups>
---
```

Use the current UTC timestamp in ISO 8601 format for [TIMESTAMP].

If the `/dev.sessions.log/` directory doesn't exist, create it first.