#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parseSSAL } from './parser.js';
import { Executor } from './executor.js';
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';

const DEFAULT_FILENAME = 'tasks.ssal';

// Get package version from package.json
function getPackageVersion(): string {
  try {
    // For ESM, we need to build the path differently
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version || 'unknown';
  } catch (error) {
    console.error(`Error reading package version: ${error}`);
    return 'unknown';
  }
}

function displayBanner() {
  console.log(
    boxen(chalk.cyanBright(' 🧂 Super Simple Automating Language 🧂 '), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan'
    })
  );
}

function createSpinner(text: string) {
  return ora({
    text,
    color: 'blue'
  });
}

function printVersion() {
  const version = getPackageVersion();
  console.log(chalk.cyanBright(`  SSAL version ${version}`));
}

function printHelp() {
  console.log(`
  ${chalk.cyanBright('Usage:')} ${chalk.whiteBright('ssal')} ${chalk.magentaBright('[options]')} ${chalk.magentaBright('[tasks...]')}

  ${chalk.cyanBright('Options:')}
  ${chalk.magentaBright('--file, -f')} ${chalk.yellowBright('<file>')}               Specify the SSAL file (default: tasks.ssal)
  ${chalk.magentaBright('--list, -l')}                      List all available tasks
  ${chalk.magentaBright('--help, -h')}                      Show this help message

  ${chalk.cyanBright('Arguments:')}
  ${chalk.magentaBright('?value')}                          Positional argument
  ${chalk.magentaBright('--name')} ${chalk.yellowBright('value')}                    Named argument

  ${chalk.cyanBright('Examples:')}
  ${chalk.whiteBright('ssal')} ${chalk.magentaBright('build ?src/main.cpp')}        Run "build" with an argument
  ${chalk.whiteBright('ssal')} ${chalk.magentaBright('build run')}                  Run "build" then "run" tasks
  ${chalk.whiteBright('ssal')} ${chalk.magentaBright('compile --file main.cpp')}    Run "compile" with named arguments
  ${chalk.whiteBright('ssal')} ${chalk.magentaBright('-l')}                         List all available tasks
  `);
}

async function main() {
  const args = process.argv.slice(2);
  console.log('\n');

  // If no tasks specified, show help
  if (args.length === 0) {
    displayBanner();
    printVersion();
    printHelp();
    return;
  }

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    displayBanner();
    printVersion();
    printHelp();
    return;
  }

  // Check for version flag first
  if (args.includes('--version') || args.includes('-v')) {
    printVersion();
    console.log('\n');
    return;
  }

  // Find SSAL file
  let ssalFile = DEFAULT_FILENAME;
  const fileArgIndex = args.findIndex(arg => arg === '--file' || arg === '-f');
  if (fileArgIndex >= 0 && args.length > fileArgIndex + 1) {
    ssalFile = args[fileArgIndex + 1];
    args.splice(fileArgIndex, 2); // Remove file args
  }

  const filePath = path.resolve(process.cwd(), ssalFile);
  if (!fs.existsSync(filePath)) {
    console.error(chalk.redBright(`❌ Error: SSAL file "${ssalFile}" not found`));
    console.log('\n');
    process.exit(1);
  }

  try {
    // Parse SSAL file
    const spinner = createSpinner(chalk.cyanBright(`📝 Parsing "${ssalFile}"...`));
    spinner.start();

    const script = parseSSAL(filePath);
    spinner.succeed(chalk.greenBright(`📝 Parsed "${ssalFile}" successfully \n`));

    // Check for list flag
    if (args.includes('--list') || args.includes('-l')) {
      console.log(chalk.cyanBright('📋 Available tasks:'));
      if (script.tasks.length === 0) {
        console.log(chalk.yellowBright('  No tasks defined'));
      } else {
        script.tasks.forEach(task => {
          console.log(`  ${chalk.greenBright('✓')} ${chalk.whiteBright(task.name)}`);
        });
      }
      console.log(chalk.grey('\n❕Use "ssal [task1] [task2] ..." to run tasks'));
      console.log('\n');
      return;
    }

    // Execute specified tasks
    const executor = new Executor(script);

    let currentTask = '';
    let currentArgs: string[] = [];
    const namedArgs: { [key: string]: string } = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const value = args[i + 1];
        namedArgs[key] = value;
        i++; // Skip the next argument as it is the value
      } else if (arg.startsWith('?')) {
        currentArgs.push(arg.slice(1));
      } else {
        if (currentTask) {
          executor.setTaskArgs(currentTask, currentArgs);
          executor.setNamedArgs(namedArgs);
          console.log(chalk.cyanBright(`🔄 Executing task: ${currentTask}`));
          console.log(chalk.grey(`📢 Task output:\n`));

          const result = await executor.executeTask(currentTask);

          if (!result.success) {
            console.log(chalk.redBright(`\n❌ ${result.message}`));
            console.log('\n');
            process.exit(1);
          }

          currentArgs = [];
        }
        currentTask = arg;
      }
    }

    if (currentTask) {
      executor.setTaskArgs(currentTask, currentArgs);
      executor.setNamedArgs(namedArgs);
      console.log(chalk.cyanBright(`🔄 Executing task: ${currentTask}`));
      console.log(chalk.grey(`📢 Task output:\n`));

      const result = await executor.executeTask(currentTask);

      if (!result.success) {
        console.log(chalk.redBright(`\n❌ ${result.message}`));
        console.log('\n');
        process.exit(1);
      }
    }

    console.log(chalk.greenBright('\n🎉 All tasks completed successfully! 🎉'));
    console.log('\n');
  } catch (error) {
    console.error(chalk.redBright(`❌ Error: ${error instanceof Error ? error.message : String(error)}`));
    console.log('\n');
    process.exit(1);
  }
}

// Run the CLI
main().catch(error => {
  console.error(chalk.redBright(`❌ Unexpected error: ${error}`));
  console.log('\n');
  process.exit(1);
});