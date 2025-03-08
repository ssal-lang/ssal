import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { SSALScript, Task, Command, ExecutionResult } from './utils.js';

export class Executor {
  private script: SSALScript;
  private workingDir: string;
  
  constructor(script: SSALScript, workingDir: string = process.cwd()) {
    this.script = script;
    this.workingDir = workingDir;
  }
  
  /**
   * Executes a task by name
   * @param taskName Name of the task to execute
   */
  async executeTask(taskName: string): Promise<ExecutionResult> {
    const task = this.script.tasks.find(t => t.name === taskName);
    
    if (!task) {
      return {
        success: false,
        message: `Task "${taskName}" not found`
      };
    }
    
    try {
      for (const command of task.commands) {
        const result = await this.executeCommand(command);
        if (!result.success) {
          return result;
        }
      }
      
      return {
        success: true,
        message: `Task "${taskName}" completed successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error in task "${taskName}": ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Executes a command
   * @param command The command to execute
   */
  private async executeCommand(command: Command): Promise<ExecutionResult> {
    // Replace variables in command arguments
    const args = command.args.map(arg => this.replaceVariables(arg));
    
    try {
      switch (command.type) {
        case 'run':
          return await this.runCommand(args[0]);
        case 'del':
          return this.deleteFile(args[0]);
        case 'ech':
          return this.echo(args[0]);
        case 'tsk':
          return await this.runTask(args[0]);
        default:
          return {
            success: false,
            message: `Unknown command: ${command.type}`
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error executing command "${command.type}": ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Replaces variable references in a string with their values
   * @param input String with variable references
   */
  private replaceVariables(input: string): string {
    let result = input;
    
    for (const variable of this.script.variables) {
      result = result.replace(new RegExp(`\\$${variable.name}`, 'g'), variable.value);
    }
    
    // Also replace environment variables
    const envVarMatches = result.match(/\$env\("([^"]+)"\)/g);
    if (envVarMatches) {
      for (const match of envVarMatches) {
        const varName = match.match(/\$env\("([^"]+)"\)/)?.[1];
        if (varName && process.env[varName] !== undefined) {
          result = result.replace(match, process.env[varName] || '');
        }
      }
    }
    
    return result;
  }
  
  /**
   * Executes a shell command
   * @param command Shell command to execute
   */
  private runCommand(command: string): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      console.log(`Running: ${command}`);
      
      exec(command, { cwd: this.workingDir }, (error, stdout, stderr) => {
        if (stdout) {
          process.stdout.write(stdout);
        }
        
        if (stderr) {
          process.stderr.write(stderr);
        }
        
        if (error) {
          resolve({
            success: false,
            message: `Command failed: ${error.message}`
          });
        } else {
          resolve({
            success: true,
            message: `Command executed successfully`
          });
        }
      });
    });
  }
  
  /**
   * Deletes a file
   * @param filePath Path to the file to delete
   */
  private deleteFile(filePath: string): ExecutionResult {
    const fullPath = path.resolve(this.workingDir, filePath);
    
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Deleted: ${filePath}`);
        return { success: true };
      } else {
        console.warn(`Warning: File ${filePath} does not exist`);
        return { success: true }; // Not finding the file is not considered an error
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Prints a message to the console
   * @param message Message to print
   */
  private echo(message: string): ExecutionResult {
    console.log(message);
    return { success: true };
  }

  /**
 * Runs another task
 * @param taskName Name of the task to run
 */
  private async runTask(taskName: string): Promise<ExecutionResult> {
    console.log(`Running task: ${taskName}`);
    
    const result = await this.executeTask(taskName);
    
    if (!result.success) {
      return result;
    }
    
    return {
      success: true,
      message: `Task "${taskName}" completed successfully`
    };
  }
  
  // Additional command methods can be added here
}
