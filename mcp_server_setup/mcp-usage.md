# MCP Servers Quick Reference

## Available MCP Servers

### Context7
- **Purpose**: Up-to-date documentation for frameworks/libraries
- **Example**: `claude "Using Context7, explain React Server Components"`

### Memory
- **Purpose**: Persistent knowledge across sessions
- **Example**: `claude "Remember this project uses Next.js 14 with TypeScript"`

### GitHub
- **Purpose**: Search code examples across GitHub
- **Example**: `claude "Search GitHub for authentication examples in Next.js"`

## Ripgrep Usage
- **Local code search**: `claude "Use ripgrep to find all TODO comments"`
- **Pattern search**: `claude "Use ripgrep to find all useState hooks"`

## Combined Usage Example
```bash
claude "I need to implement user authentication. 
1. Use GitHub MCP to find examples
2. Use Context7 for latest documentation  
3. Remember our approach with Memory MCP"
