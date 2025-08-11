const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const chalk = require('chalk');

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/julianmemberstack/memberstack-ai-docs/main';
const MEMBERSTACK_DIR = '.memberstack';
const CLAUDE_MARKER_START = '<!-- MEMBERSTACK-AI-DOCS-START -->';
const CLAUDE_MARKER_END = '<!-- MEMBERSTACK-AI-DOCS-END -->';
const CURSOR_MARKER_START = '# MEMBERSTACK-AI-DOCS-START';
const CURSOR_MARKER_END = '# MEMBERSTACK-AI-DOCS-END';

class MemberstackInstaller {
  constructor(options = {}) {
    this.options = options;
    this.projectRoot = process.cwd();
    this.memberstackDir = path.join(this.projectRoot, MEMBERSTACK_DIR);
  }

  async install(options = {}) {
    try {
      console.log(chalk.blue('📦 Installing Memberstack AI Documentation...'));
      
      if (options.dryRun) {
        console.log(chalk.yellow('🔍 DRY RUN MODE - No files will be modified'));
      }

      // Step 1: Create .memberstack directory
      await this.createMemberstackDirectory(options);

      // Step 2: Download documentation files
      await this.downloadDocumentation(options);

      // Step 3: Update CLAUDE.md
      await this.updateClaudeFile(options);

      // Step 4: Update .cursorrules
      await this.updateCursorRules(options);

      // Step 5: Validate installation
      if (!options.dryRun) {
        await this.validate(options);
      }

      console.log(chalk.green.bold('\n✅ Memberstack AI Documentation installed successfully!'));
      console.log(chalk.cyan('\n📚 AI agents now have access to:'));
      console.log(chalk.white('   • 30 common methods (immediate access in CLAUDE.md)'));
      console.log(chalk.white('   • 47 total methods (searchable via index)'));
      console.log(chalk.white('   • Complete documentation with examples'));
      
      console.log(chalk.gray('\n💡 Commands:'));
      console.log(chalk.white('   npx memberstack-ai-docs --update    # Update to latest'));
      console.log(chalk.white('   npx memberstack-ai-docs --remove    # Uninstall cleanly'));
      console.log(chalk.white('   npx memberstack-ai-docs --validate  # Check installation'));

    } catch (error) {
      console.error(chalk.red('❌ Installation failed:'), error.message);
      throw error;
    }
  }

  async createMemberstackDirectory(options) {
    if (options.dryRun) {
      console.log(chalk.gray('  Would create .memberstack/ directory'));
      return;
    }

    if (!fs.existsSync(this.memberstackDir)) {
      fs.mkdirSync(this.memberstackDir, { recursive: true });
      console.log(chalk.green('✓ Created .memberstack/ directory'));
    } else {
      console.log(chalk.blue('✓ .memberstack/ directory already exists'));
    }
  }

  async downloadDocumentation(options) {
    const files = [
      { name: 'complete.md', url: `${GITHUB_BASE_URL}/docs/memberstack-complete.md` },
      { name: 'index.json', url: `${GITHUB_BASE_URL}/docs/memberstack-index.json` },
      { name: 'quickref.md', url: `${GITHUB_BASE_URL}/docs/memberstack-quickref.md` }
    ];

    for (const file of files) {
      const filePath = path.join(this.memberstackDir, file.name);
      
      if (options.dryRun) {
        console.log(chalk.gray(`  Would download ${file.name}`));
        continue;
      }

      try {
        if (this.options.verbose) {
          console.log(chalk.gray(`  Fetching ${file.url}...`));
        }
        
        const response = await fetch(file.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${file.name}: ${response.statusText}`);
        }
        
        const content = await response.text();
        fs.writeFileSync(filePath, content);
        console.log(chalk.green(`✓ Downloaded ${file.name}`));
      } catch (error) {
        // If download fails, use local files if available
        const localPath = path.join(__dirname, '..', 'docs', file.name);
        if (fs.existsSync(localPath)) {
          fs.copyFileSync(localPath, filePath);
          console.log(chalk.yellow(`✓ Used local ${file.name}`));
        } else {
          throw new Error(`Failed to download ${file.name}: ${error.message}`);
        }
      }
    }
  }

  async updateClaudeFile(options) {
    const claudePath = path.join(this.projectRoot, 'CLAUDE.md');
    const templatePath = path.join(__dirname, '..', 'templates', 'claude-template.md');
    
    if (options.dryRun) {
      if (fs.existsSync(claudePath)) {
        console.log(chalk.gray('  Would update existing CLAUDE.md'));
      } else {
        console.log(chalk.gray('  Would create new CLAUDE.md'));
      }
      return;
    }

    // Read template
    let template;
    if (fs.existsSync(templatePath)) {
      template = fs.readFileSync(templatePath, 'utf-8');
    } else {
      // Use embedded template
      template = this.getClaudeTemplate();
    }

    if (fs.existsSync(claudePath)) {
      // Update existing file
      await this.appendToFile(claudePath, template, CLAUDE_MARKER_START, CLAUDE_MARKER_END, 'CLAUDE.md');
    } else {
      // Create new file
      fs.writeFileSync(claudePath, template);
      console.log(chalk.green('✓ Created CLAUDE.md'));
    }
  }

  async updateCursorRules(options) {
    const cursorPath = path.join(this.projectRoot, '.cursorrules');
    const templatePath = path.join(__dirname, '..', 'templates', 'cursor-template.md');
    
    if (options.dryRun) {
      if (fs.existsSync(cursorPath)) {
        console.log(chalk.gray('  Would update existing .cursorrules'));
      } else {
        console.log(chalk.gray('  Would create new .cursorrules'));
      }
      return;
    }

    // Read template
    let template;
    if (fs.existsSync(templatePath)) {
      template = fs.readFileSync(templatePath, 'utf-8');
    } else {
      // Use embedded template (same as Claude but with different markers)
      template = this.getCursorTemplate();
    }

    if (fs.existsSync(cursorPath)) {
      // Update existing file
      await this.appendToFile(cursorPath, template, CURSOR_MARKER_START, CURSOR_MARKER_END, '.cursorrules');
    } else {
      // Create new file
      fs.writeFileSync(cursorPath, template);
      console.log(chalk.green('✓ Created .cursorrules'));
    }
  }

  async appendToFile(filePath, content, markerStart, markerEnd, fileName) {
    const existingContent = fs.readFileSync(filePath, 'utf-8');
    
    // Check if markers already exist
    if (existingContent.includes(markerStart)) {
      // Replace existing section
      const startIndex = existingContent.indexOf(markerStart);
      const endIndex = existingContent.indexOf(markerEnd) + markerEnd.length;
      
      if (endIndex > startIndex) {
        const newContent = 
          existingContent.substring(0, startIndex) +
          content +
          existingContent.substring(endIndex);
        
        fs.writeFileSync(filePath, newContent);
        console.log(chalk.green(`✓ Updated ${fileName} (replaced existing Memberstack section)`));
      } else {
        // Markers corrupted, append new section
        fs.appendFileSync(filePath, '\n\n' + content);
        console.log(chalk.yellow(`✓ Updated ${fileName} (appended new section, markers were corrupted)`));
      }
    } else {
      // Append new section
      fs.appendFileSync(filePath, '\n\n' + content);
      console.log(chalk.green(`✓ Updated ${fileName} (added Memberstack section)`));
    }
  }

  async remove(options) {
    console.log(chalk.blue('🗑️  Removing Memberstack AI Documentation...'));
    
    if (options.dryRun) {
      console.log(chalk.yellow('🔍 DRY RUN MODE - No files will be modified'));
    }

    // Remove .memberstack directory
    if (fs.existsSync(this.memberstackDir)) {
      if (!options.dryRun) {
        fs.rmSync(this.memberstackDir, { recursive: true, force: true });
      }
      console.log(chalk.green('✓ Removed .memberstack/ directory'));
    }

    // Remove from CLAUDE.md
    await this.removeFromFile('CLAUDE.md', CLAUDE_MARKER_START, CLAUDE_MARKER_END, options);

    // Remove from .cursorrules
    await this.removeFromFile('.cursorrules', CURSOR_MARKER_START, CURSOR_MARKER_END, options);

    console.log(chalk.green.bold('\n✅ Memberstack AI Documentation removed successfully!'));
  }

  async removeFromFile(fileName, markerStart, markerEnd, options) {
    const filePath = path.join(this.projectRoot, fileName);
    
    if (!fs.existsSync(filePath)) {
      return;
    }

    if (options.dryRun) {
      console.log(chalk.gray(`  Would remove Memberstack section from ${fileName}`));
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (content.includes(markerStart)) {
      const startIndex = content.indexOf(markerStart);
      const endIndex = content.indexOf(markerEnd) + markerEnd.length;
      
      if (endIndex > startIndex) {
        const newContent = 
          content.substring(0, startIndex).trimEnd() +
          content.substring(endIndex);
        
        fs.writeFileSync(filePath, newContent);
        console.log(chalk.green(`✓ Removed Memberstack section from ${fileName}`));
      }
    }
  }

  async update(options) {
    console.log(chalk.blue('🔄 Updating Memberstack AI Documentation...'));
    
    // Simply re-run install with force flag
    await this.install({ ...options, force: true });
  }

  async validate(options) {
    console.log(chalk.blue('\n🔍 Validating Memberstack AI Documentation installation...'));
    
    let isValid = true;
    const checks = [];

    // Check .memberstack directory
    if (fs.existsSync(this.memberstackDir)) {
      checks.push({ status: '✓', message: '.memberstack/ directory exists' });
      
      // Check files
      const requiredFiles = ['complete.md', 'index.json', 'quickref.md'];
      for (const file of requiredFiles) {
        const filePath = path.join(this.memberstackDir, file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          checks.push({ 
            status: '✓', 
            message: `${file} (${(stats.size / 1024).toFixed(1)} KB)` 
          });
        } else {
          checks.push({ status: '✗', message: `${file} missing` });
          isValid = false;
        }
      }
    } else {
      checks.push({ status: '✗', message: '.memberstack/ directory missing' });
      isValid = false;
    }

    // Check CLAUDE.md
    const claudePath = path.join(this.projectRoot, 'CLAUDE.md');
    if (fs.existsSync(claudePath)) {
      const content = fs.readFileSync(claudePath, 'utf-8');
      if (content.includes(CLAUDE_MARKER_START)) {
        checks.push({ status: '✓', message: 'CLAUDE.md contains Memberstack section' });
      } else {
        checks.push({ status: '⚠', message: 'CLAUDE.md exists but missing Memberstack section' });
      }
    } else {
      checks.push({ status: '⚠', message: 'CLAUDE.md not found' });
    }

    // Check .cursorrules
    const cursorPath = path.join(this.projectRoot, '.cursorrules');
    if (fs.existsSync(cursorPath)) {
      const content = fs.readFileSync(cursorPath, 'utf-8');
      if (content.includes(CURSOR_MARKER_START)) {
        checks.push({ status: '✓', message: '.cursorrules contains Memberstack section' });
      } else {
        checks.push({ status: '⚠', message: '.cursorrules exists but missing Memberstack section' });
      }
    } else {
      checks.push({ status: '⚠', message: '.cursorrules not found' });
    }

    // Display results
    console.log('');
    checks.forEach(check => {
      const color = check.status === '✓' ? 'green' : check.status === '✗' ? 'red' : 'yellow';
      console.log(chalk[color](`  ${check.status} ${check.message}`));
    });

    if (isValid) {
      console.log(chalk.green.bold('\n✅ Installation is valid!'));
    } else {
      console.log(chalk.red.bold('\n❌ Installation has issues. Run with --update to fix.'));
    }

    return isValid;
  }

  getClaudeTemplate() {
    return `${CLAUDE_MARKER_START}
# Memberstack DOM Package - AI Documentation

## Quick Start
\`\`\`javascript
import memberstack from '@memberstack/dom';
const ms = memberstack.init({ publicKey: 'pk_...' });
\`\`\`

## Most Common Methods

For complete implementation examples, see \`.memberstack/quickref.md\`

### Authentication
- \`loginMemberEmailPassword({ email, password })\` - Email/password login
- \`signupMemberEmailPassword({ email, password, customFields?, metaData?, plans? })\` - Create account
- \`logout()\` - Sign out current member
- \`getCurrentMember()\` - Get logged-in member data
- \`onAuthChange(callback)\` - Listen for auth state changes
- \`sendMemberResetPasswordEmail({ email })\` - Send password reset
- \`loginWithProvider({ provider })\` - Social login (google/facebook)
- \`sendMemberLoginPasswordlessEmail({ email })\` - Passwordless login

### Member Management
- \`updateMember({ customFields?, metaData? })\` - Update member data
- \`updateMemberAuth({ email?, oldPassword?, newPassword? })\` - Update credentials
- \`getMemberJSON()\` - Get member data as JSON
- \`updateMemberJSON(json)\` - Update member JSON data
- \`updateMemberProfileImage({ image })\` - Update profile picture
- \`deleteMember()\` - Delete member account
- \`sendMemberVerificationEmail()\` - Send email verification

### Plans & Billing
- \`getPlans()\` - Get all available plans
- \`getPlan({ planId })\` - Get specific plan details
- \`purchasePlansWithCheckout({ priceIds, successUrl?, cancelUrl? })\` - Stripe checkout
- \`launchStripeCustomerPortal({ returnUrl? })\` - Open billing portal
- \`addPlan({ planId })\` - Add free plan to member
- \`removePlan({ planId })\` - Remove plan from member

### UI Components
- \`openModal({ type: 'LOGIN' | 'SIGNUP' | 'PROFILE' })\` - Open pre-built modal
- \`hideModal()\` - Close current modal

## Finding All Methods (47 total)

1. **Search index**: \`.memberstack/index.json\` - Searchable method index
2. **Quick reference**: \`.memberstack/quickref.md\` - 30 common methods with examples
3. **Full reference**: \`.memberstack/complete.md\` - Complete documentation

### Search Examples
\`\`\`bash
# Find login methods
grep "login" .memberstack/index.json

# Find method signature
grep -A 5 "loginMemberEmailPassword" .memberstack/complete.md

# Find all authentication methods
grep '"category": "authentication"' .memberstack/index.json
\`\`\`

## AI Instructions

When implementing Memberstack features:
1. ALWAYS check \`.memberstack/index.json\` for available methods
2. Use exact method signatures from documentation
3. Include error handling in all examples using try/catch blocks
4. Reference \`.memberstack/complete.md\` for detailed parameters and return types
5. Check error codes and types in the documentation

## Error Handling Pattern

\`\`\`javascript
try {
  const { data: member } = await memberstack.getCurrentMember();
  // Handle success
} catch (error) {
  if (error.code === 'INVALID_CREDENTIALS') {
    // Handle invalid login
  } else if (error.code === 'NETWORK_ERROR') {
    // Handle network issues
  } else {
    // Handle other errors
    console.error('Memberstack error:', error.message);
  }
}
\`\`\`

## Common Patterns

### Check if logged in
\`\`\`javascript
const { data: member } = await memberstack.getCurrentMember();
if (member) {
  // User is logged in
  console.log('Welcome', member.auth.email);
} else {
  // User is not logged in
  await memberstack.openModal({ type: 'LOGIN' });
}
\`\`\`

### React/Vue auth listener
\`\`\`javascript
useEffect(() => {
  const unsubscribe = memberstack.onAuthChange((member) => {
    setCurrentMember(member);
  });
  return unsubscribe;
}, []);
\`\`\`

## Documentation Version: 2.0.0
Last Updated: 2025-01-11
Total Methods: 47
${CLAUDE_MARKER_END}`;
  }

  getCursorTemplate() {
    return `${CURSOR_MARKER_START}

# Memberstack DOM Package - AI Documentation

## Quick Start
\`\`\`javascript
import memberstack from '@memberstack/dom';
const ms = memberstack.init({ publicKey: 'pk_...' });
\`\`\`

## Most Common Methods

For complete implementation examples, see \`.memberstack/quickref.md\`

### Authentication
- \`loginMemberEmailPassword({ email, password })\` - Email/password login
- \`signupMemberEmailPassword({ email, password, customFields?, metaData?, plans? })\` - Create account
- \`logout()\` - Sign out current member
- \`getCurrentMember()\` - Get logged-in member data
- \`onAuthChange(callback)\` - Listen for auth state changes
- \`sendMemberResetPasswordEmail({ email })\` - Send password reset
- \`loginWithProvider({ provider })\` - Social login (google/facebook)
- \`sendMemberLoginPasswordlessEmail({ email })\` - Passwordless login

### Member Management
- \`updateMember({ customFields?, metaData? })\` - Update member data
- \`updateMemberAuth({ email?, oldPassword?, newPassword? })\` - Update credentials
- \`getMemberJSON()\` - Get member data as JSON
- \`updateMemberJSON(json)\` - Update member JSON data
- \`updateMemberProfileImage({ image })\` - Update profile picture
- \`deleteMember()\` - Delete member account
- \`sendMemberVerificationEmail()\` - Send email verification

### Plans & Billing
- \`getPlans()\` - Get all available plans
- \`getPlan({ planId })\` - Get specific plan details
- \`purchasePlansWithCheckout({ priceIds, successUrl?, cancelUrl? })\` - Stripe checkout
- \`launchStripeCustomerPortal({ returnUrl? })\` - Open billing portal
- \`addPlan({ planId })\` - Add free plan to member
- \`removePlan({ planId })\` - Remove plan from member

### UI Components
- \`openModal({ type: 'LOGIN' | 'SIGNUP' | 'PROFILE' })\` - Open pre-built modal
- \`hideModal()\` - Close current modal

## Finding All Methods (47 total)

1. **Search index**: \`.memberstack/index.json\` - Searchable method index
2. **Quick reference**: \`.memberstack/quickref.md\` - 30 common methods with examples
3. **Full reference**: \`.memberstack/complete.md\` - Complete documentation

## AI Instructions

When implementing Memberstack features:
1. ALWAYS check \`.memberstack/index.json\` for available methods
2. Use exact method signatures from documentation
3. Include error handling in all examples using try/catch blocks
4. Reference \`.memberstack/complete.md\` for detailed parameters and return types

## Documentation Version: 2.0.0
Last Updated: 2025-01-11
Total Methods: 47

${CURSOR_MARKER_END}`;
  }
}

module.exports = new MemberstackInstaller();