#!/usr/bin/env node

const { program } = require('commander');
const installer = require('../src/installer');
const chalk = require('chalk');
const packageJson = require('../package.json');

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
  .parse(process.argv);

const options = program.opts();

async function main() {
  try {
    console.log(chalk.blue.bold('\n🚀 Memberstack AI Documentation Installer\n'));

    if (options.remove) {
      await installer.remove(options);
    } else if (options.validate) {
      await installer.validate(options);
    } else if (options.update) {
      await installer.update(options);
    } else {
      await installer.install(options);
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();