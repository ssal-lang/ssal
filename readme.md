# SSAL (Super Simple Automating Language)

[Docs](ssal-lang.github.io/ssal-docs/)

SSAL (pronounced "sal" like the Portuguese word for salt) is a lightweight, cross-platform automation language designed to simplify project tasks such as building, running, and cleaning up files. It serves as an easy alternative to batch files, shell scripts, and Makefiles.

## Features

- Simple and readable syntax.
- Works on any project, regardless of language.
- Cross-platform support (Windows, macOS, Linux).
- Available as both a global CLI and an npm package.

## Installation

### Global Installation

Install SSAL globally so you can use it in any project:

```sh
npm install -g ssal
```

### Project-Specific Installation

Install SSAL as a development dependency in your project:

```sh
npm install --save-dev ssal
```

## Usage

### Writing an SSAL Script

Create a `tasks.ssal` file in your project:

```ssal
# SSAL script to build and run a C++ project

var COMPILER = "g++"

task build:
    run "$COMPILER main.cpp -o main"

task run:
    run "./main"

task clean:
    del "main"
```

### Running Tasks

Execute a task from your SSAL file:

```sh
ssal build
```

Run multiple tasks sequentially:

```sh
ssal build run
```

List all available tasks:

```sh
ssal --list
```

## Syntax

### Comments

Comments are defined with `#`, only single line comments are supported

```ssal
# this is a comment
```

### Variables

Variables are declared using the `var` keyword.

```ssal
var VERSION = "1.2.3"
```

You can get the value off a variable with `$VARNAME`

```ssal
ech $VERSION
```

### Tasks

Tasks are defined using the `task` keyword, followed by the task name.

```ssal
task test:
    task commands run in order
```
