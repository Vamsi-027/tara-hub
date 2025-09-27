#!/bin/bash

# MCP Setup Script for Claude Code
# This script sets up Context7, Memory, and GitHub MCP servers for a project

echo "🚀 Claude Code MCP Setup Script"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in WSL
if grep -q Microsoft /proc/version; then
    print_warning "WSL detected - filesystem MCP may not work with /mnt/c paths"
fi

# Get current directory
CURRENT_DIR=$(pwd)
echo "📁 Setting up MCP for: $CURRENT_DIR"
echo ""

# Step 1: Install global npm packages
echo "📦 Installing MCP server packages..."
echo "This may take a few minutes..."

# Install MCP packages (globally for reuse across projects)
npm install -g @modelcontextprotocol/server-memory 2>/dev/null
if [ $? -eq 0 ]; then
    print_status "Memory MCP package installed"
else
    print_warning "Memory MCP package may already be installed"
fi

npm install -g @modelcontextprotocol/server-github 2>/dev/null
if [ $? -eq 0 ]; then
    print_status "GitHub MCP package installed"
else
    print_warning "GitHub MCP package may already be installed"
fi

# Note: Context7 doesn't need npm install as it's HTTP-based

# Step 2: Install ripgrep if not present
echo ""
echo "🔍 Checking for ripgrep..."
if ! command -v rg &> /dev/null; then
    echo "Installing ripgrep..."
    sudo apt-get update && sudo apt-get install -y ripgrep
    print_status "Ripgrep installed"
else
    print_status "Ripgrep already installed"
fi

# Step 3: Add MCP servers to Claude Code
echo ""
echo "🔧 Configuring MCP servers for this project..."

# Remove any existing MCP servers (clean slate)
claude mcp remove context7 2>/dev/null
claude mcp remove memory 2>/dev/null
claude mcp remove github 2>/dev/null

# Add Context7 (HTTP transport)
echo "Adding Context7 MCP..."
read -p "Enter your Context7 API key (or press Enter to skip): " CONTEXT7_KEY
if [ ! -z "$CONTEXT7_KEY" ]; then
    claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: $CONTEXT7_KEY"
    if [ $? -eq 0 ]; then
        print_status "Context7 MCP added"
    else
        print_error "Failed to add Context7 MCP"
    fi
else
    print_warning "Skipped Context7 (no API key provided)"
fi

# Add Memory MCP
echo "Adding Memory MCP..."
claude mcp add --transport stdio memory npx @modelcontextprotocol/server-memory
if [ $? -eq 0 ]; then
    print_status "Memory MCP added"
else
    print_error "Failed to add Memory MCP"
fi

# Add GitHub MCP  
echo "Adding GitHub MCP..."
claude mcp add --transport stdio github npx @modelcontextprotocol/server-github
if [ $? -eq 0 ]; then
    print_status "GitHub MCP added"
else
    print_error "Failed to add GitHub MCP"
fi

# Step 4: Test connections
echo ""
echo "🧪 Testing MCP connections..."
claude mcp list

# Step 5: Create quick reference file
echo ""
echo "📝 Creating MCP quick reference..."

cat > mcp-usage.md << 'EOF'
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