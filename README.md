# Memberstack AI Documentation

AI-optimized documentation installer for the Memberstack DOM package. Makes Memberstack's complete API instantly accessible to AI coding assistants like Claude Code, Cursor, GitHub Copilot, and others.

## 🚀 Quick Start

Install the Memberstack AI documentation in your project with one command:

```bash
npx memberstack-ai-docs
```

That's it! Your AI assistant now has complete access to all Memberstack methods and documentation.

## 📦 What Gets Installed

The installer creates:

1. **`.memberstack/` directory** containing:
   - `complete.md` - Full documentation for all 49 methods
   - `index.json` - Searchable method index for AI discovery
   - `quickref.md` - Quick reference with 30 most common methods

2. **Updates to AI config files**:
   - `CLAUDE.md` - Adds Memberstack section for Claude Code
   - `.cursorrules` - Adds Memberstack section for Cursor

The installer is **non-destructive** - it preserves your existing content and only adds clearly marked Memberstack sections.

## 🎯 Features

- **Complete API Coverage**: All 49 Memberstack methods documented with signatures, parameters, and examples
- **AI-Optimized**: Structured for efficient parsing and searching by AI agents
- **Smart Search**: JSON index enables AI to quickly find relevant methods
- **Progressive Discovery**: Quick reference → Index search → Full documentation
- **Safe Installation**: Never overwrites existing content, only appends marked sections
- **Easy Updates**: Keep documentation current with `--update` flag
- **Clean Removal**: Uninstall cleanly with `--remove` flag

## 📋 Commands

```bash
# Install documentation
npx memberstack-ai-docs

# Update to latest version
npx memberstack-ai-docs --update

# Remove documentation
npx memberstack-ai-docs --remove

# Validate installation
npx memberstack-ai-docs --validate

# Preview changes without modifying files
npx memberstack-ai-docs --dry-run

# Show detailed output
npx memberstack-ai-docs --verbose
```

## 🤖 How AI Assistants Use This

Once installed, AI assistants can:

1. **Immediate Access**: View most common methods directly in CLAUDE.md/.cursorrules
2. **Search Methods**: Query the JSON index to find specific functionality
3. **Deep Dive**: Access complete documentation for detailed implementation

Example AI queries that now work:
- "How do I implement passwordless login with Memberstack?"
- "Show me all Memberstack methods for managing subscriptions"
- "Create a React component with Memberstack authentication"

## 📚 Documentation Structure

### Method Categories

- **Initialization** (2 methods): SDK setup and connection testing
- **Authentication** (11 methods): Login, signup, logout, passwordless, social auth, verification
- **Member Management** (7 methods): Profile updates, custom fields, metadata, JSON data
- **Billing** (6 methods): Plans, subscriptions, Stripe checkout, billing portal
- **UI Components** (6 methods): Pre-built modals, loaders, messages
- **Content** (9 methods): Secure content, posts, comments, threads, voting
- **Teams** (4 methods): Team management, invitations
- **Internal** (1 method): Event tracking

### Method Example

Every method is documented with:
- Complete signature with TypeScript types
- All parameters (required and optional)
- Return type
- Multiple code examples
- Error handling patterns
- Common use cases

## 🔧 For Developers

### Manual Installation

If you prefer to set up manually:

1. Download the documentation files from GitHub
2. Create `.memberstack/` directory in your project
3. Copy documentation files to `.memberstack/`
4. Add Memberstack section to your CLAUDE.md/.cursorrules

### Building From Source

```bash
# Clone repository
git clone https://github.com/julianmemberstack/memberstack-ai-docs
cd memberstack-ai-docs

# Install dependencies
npm install

# Build index from documentation
npm run build-index

# Test locally
npm test
```

### Publishing Updates

```bash
# Update version
npm version patch

# Publish to NPM
npm publish
```

## 🛟 Support

- **Issues**: [GitHub Issues](https://github.com/julianmemberstack/memberstack-ai-docs/issues)
- **Documentation**: [Memberstack Docs](https://docs.memberstack.com)
- **Community**: [Memberstack Slack](https://memberstack.com/slack)

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 🙏 Credits

Created by Julian Galluzzo for [Memberstack](https://memberstack.com)

---

**Making AI coding assistants smarter about Memberstack, one method at a time.**