import * as fs from 'fs';
import { Command, Task, Variable, SSALScript } from './utils.js';

/**
 * Parses an SSAL script file into a structured format
 * @param filePath Path to the SSAL script file
 */
export function parseSSAL(filePath: string): SSALScript {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseSSALContent(content);
}

/**
 * Parses SSAL script content into a structured format
 * @param content SSAL script content as a string
 */
export function parseSSALContent(content: string): SSALScript {
  const lines = content.split('\n');
  
  const script: SSALScript = {
    variables: [],
    tasks: []
  };
  
  let currentTask: Task | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    
    // Skip empty lines and comments
    if (line === '' || line.startsWith('#')) {
      continue;
    }

    if (line.startsWith('var ')) { 
      const varMatch = line.match(/var\s+(\w+)\s*=\s*"([^"]*)"$/);
      if (varMatch) { 
        if (currentTask){ 
          // When inside a task, treat as a command instead of a global variable declaration
          currentTask.commands.push({ type: 'var', args: [varMatch[1], varMatch[2]] }); 
        } else { 
          // Global variable declaration outside any task
          script.variables.push({ name: varMatch[1], value: varMatch[2] });
        } 
      } 
      continue; 
    }
    
    // Parse task definition
    if (line.startsWith('task ')) {
      const taskMatch = line.match(/task\s+(\w+):$/);
      if (taskMatch) {
        currentTask = {
          name: taskMatch[1],
          commands: []
        };
        script.tasks.push(currentTask);
      }
      continue;
    }
    
    // Parse commands within a task - check if line starts with whitespace and is in a task
    if (currentTask && rawLine.match(/^\s+\w+/)) {
      // Changed the order of regex checks - most specific to most general

      // Handle two-argument commands
      let commandMatch = rawLine.match(/\s+(\w+)\s+"([^"]*)"\s+"([^"]*)"$/);
      if (commandMatch) {
        currentTask.commands.push({
          type: commandMatch[1],
          args: [commandMatch[2], commandMatch[3]]
        });
        continue;
      }
      
      // Handle single-argument commands with quotes (including variable references)
      commandMatch = rawLine.match(/\s+(\w+)\s+"([^"]*)"$/);
      if (commandMatch) {
        currentTask.commands.push({
          type: commandMatch[1],
          args: [commandMatch[2]]
        });
        continue;
      }

      // Special case for commands with a mix of quotes and variables like run "$COMPILER Building project"
      commandMatch = rawLine.match(/\s+(\w+)\s+"([^"]*)"\s*(.*)$/);
      if (commandMatch) {
        currentTask.commands.push({
          type: commandMatch[1],
          args: [commandMatch[2] + (commandMatch[3] ? " " + commandMatch[3].trim() : '')]
        });
        continue;
      }
      
      // Handle commands without quotes (general case - must be last!)
      commandMatch = rawLine.match(/\s+(\w+)\s+(.+)$/);
      if (commandMatch) {
        currentTask.commands.push({
          type: commandMatch[1],
          args: [commandMatch[2]]
        });
        continue;
      }
    }
  }
  
  //console.log(JSON.stringify(script, null, 2));
  return script;
}