# Project: tara-hub
*Type: nextjs*
*Migrated: 2025-08-11 20:05*

## 🎯 Project Context
This is the isolated context for **tara-hub** project.
All patterns, memories, and decisions are scoped to THIS project only.

## 🔒 Isolation Rules
- ✅ **CAN access**: Files within C:\Users\varak\repos\tara-hub
- ❌ **CANNOT access**: Other projects or system files
- 📝 **Memory scope**: project:tara-hub
- 🧠 **Context scope**: Project-specific only


## ▲ Next.js Project Standards
- **Router**: App Router (Next.js 14+)
- **Rendering**: Server Components by default
- **API**: Route handlers in app/api/
- **Styling**: Tailwind CSS + CSS Modules
- **Database**: Prisma / Drizzle ORM

## 📂 Standard Structure
```
app/
├── (routes)/      # Route groups
├── api/          # API routes
├── components/   # Shared components
└── lib/          # Utilities
```

## 📁 Project Structure
```
tara-hub/
├── .claude-project/     # Claude configuration
│   ├── CLAUDE.md       # This file
│   ├── config.json     # Project settings
│   ├── specs/          # Feature specifications
│   ├── memory/         # Project memory DB
│   └── cache/          # Project cache
└── [your project files]
```

## 📝 Project-Specific Notes
[Add your project documentation here]

## 🚀 Quick Commands
- Create spec: `claude-code spec-create "feature-name"`
- Run workflow: `python -m claude.workflow execute`
- Check status: `cwf status`
