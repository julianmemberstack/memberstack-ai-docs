#!/usr/bin/env node

const { program } = require('commander');
const installer = require('../src/installer');
const chalk = require('chalk');
const readline = require('readline');
const packageJson = require('../package.json');

// Create readline interface for interactive prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

program
  .name('memberstack-ai-docs')
  .description('Install Memberstack AI documentation for your project')
  .version(packageJson.version);

program
  .option('--update', 'Update existing Memberstack documentation')
  .option('--remove', 'Remove Memberstack documentation from your project')
  .option('--validate', 'Validate current installation')
  .option('--dry-run', 'Preview changes without modifying files')
  .option('--force', 'Force installation even if files exist')
  .option('--verbose', 'Show detailed output')
  .option('--ai <tool>', 'Specify AI tool: claude, cursor, codex, or all (default: asks interactively)')
  .parse(process.argv);

const options = program.opts();

async function selectAITools() {
  console.log(chalk.cyan('Which AI assistant are you using?\n'));
  console.log('  1) Claude Code');
  console.log('  2) Cursor');
  console.log('  3) Codex');
  console.log('  4) All three\n');
  
  const choice = await askQuestion(chalk.yellow('Select (1-4): '));
  
  switch(choice.trim()) {
    case '1':
      return ['claude'];
    case '2':
      return ['cursor'];
    case '3':
      return ['codex'];
    case '4':
      return ['claude', 'cursor', 'codex'];
    default:
      console.log(chalk.yellow('\nInvalid choice. Installing for all supported tools.'));
      return ['claude', 'cursor', 'codex'];
  }
}

async function main() {
  try {
    console.log(chalk.blue.bold('\n🚀 Memberstack AI Documentation Installer\n'));

    // Handle special operations first
    if (options.remove) {
      await installer.remove(options);
      rl.close();
      return;
    } else if (options.validate) {
      await installer.validate(options);
      rl.close();
      return;
    } else if (options.update) {
      await installer.update(options);
      rl.close();
      return;
    }

    // For installation, determine which AI tools to support
    let aiTools;
    
    if (options.ai) {
      // Use command line option
      const aiOption = options.ai.toLowerCase();
      if (aiOption === 'both' || aiOption === 'all') {
        aiTools = ['claude', 'cursor', 'codex'];
      } else if (aiOption === 'claude') {
        aiTools = ['claude'];
      } else if (aiOption === 'cursor') {
        aiTools = ['cursor'];
      } else if (aiOption === 'codex') {
        aiTools = ['codex'];
      } else {
        console.log(chalk.yellow(`Unknown AI tool '${options.ai}'. Installing for all.`));
        aiTools = ['claude', 'cursor', 'codex'];
      }
    } else if (process.stdout.isTTY && !process.env.CI) {
      // Interactive mode (default if running in terminal and not CI)
      aiTools = await selectAITools();
    } else {
      // Non-interactive (e.g., CI environment) - install all supported tools
      aiTools = ['claude', 'cursor', 'codex'];
    }

    console.log(chalk.green(`\n✓ Installing for: ${aiTools.map(t => t === 'claude' ? 'Claude Code' : t === 'cursor' ? 'Cursor' : 'Codex').join(' and ')}\n`));

    // Pass the selected tools to the installer
    await installer.install({ ...options, aiTools });
    
    rl.close();
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    rl.close();
    process.exit(1);
  }
}

main();
