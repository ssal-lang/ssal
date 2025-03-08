/**
 * Represents a command in an SSAL task
 */
export interface Command {
  type: string;
  args: string[];
}

/**
 * Represents a conditional command in an SSAL task
 */
export interface ConditionalCommand extends Command {
  condition: string;
  trueCommands: Command[];
  falseCommands?: Command[];
}

/**
 * Represents a task in an SSAL script
 */
export interface Task {
  name: string;
  commands: (Command | ConditionalCommand)[];
}

/**
 * Represents a variable declaration in an SSAL script
 */
export interface Variable {
  name: string;
  value: string;
}

/**
 * Represents a parsed SSAL script
 */
export interface SSALScript {
  variables: Variable[];
  tasks: Task[];
}

/**
 * Represents the result of executing a command
 */
export interface ExecutionResult {
  success: boolean;
  message?: string;
}
