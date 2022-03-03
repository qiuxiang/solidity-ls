import {
  Diagnostic,
  DiagnosticSeverity,
  Range,
} from "vscode-languageserver/node";
import { spawn } from "child_process";

export function parseAstOutput(stdout: string) {
  let json = false;
  const lines = [];
  const files = [];
  for (const line of stdout.split("\n")) {
    if (line == "{") json = true;
    if (json) lines.push(line);
    if (line == "}") {
      json = false;
      files.push(JSON.parse(lines.join("\n")));
    }
  }
  return files;
}

export function parseCompileOutput(stderr: string) {
  const lines = stderr.split("\n");
  const diagnostics: Diagnostic[] = [];
  for (let i = 0; i < lines.length; i++) {
    const message = lines[i].match(/^(Warning|Error): (.*)/);
    if (message) {
      if (message[0] == "Warning") {
      }
      const source = lines[i + 1].match(/.sol:?(\d+)?:?(\d+)?/);
      const line = parseInt(source[1]) || 1;
      const character = parseInt(source[2]) || 1;
      let severity: DiagnosticSeverity;
      if (message[1] == "Warning") severity = DiagnosticSeverity.Warning;
      if (message[1] == "Error") severity = DiagnosticSeverity.Error;
      const range = Range.create(line - 1, character - 1, line - 1, character);
      const diagnostic: Diagnostic = { severity, range, message: message[2] };
      diagnostics.push(diagnostic);
      i += 1;
    }
  }
  return diagnostics;
}

export function compile(source: string) {
  spawn("solc");
}
