import { exec } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { SourceUnit } from "solidity-ast";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Diagnostic,
  DiagnosticSeverity,
  MessageType,
  Range,
  ShowMessageRequest,
} from "vscode-languageserver/node";
import { URI } from "vscode-uri";
import { connection, options, rootPath } from ".";

export function compile(document: TextDocument) {
  const path = URI.parse(document.uri).path;
  return new Promise<SourceUnit[]>((resolve) => {
    exec(
      `solc ${path} --base-path . --include-path ${options.includePath} --ast-compact-json`,
      (_, stdout, stderr) => {
        if (stderr) {
          const diagnostics = parseError(stderr);
          if (diagnostics.length) {
            connection.sendDiagnostics({ uri: document.uri, diagnostics });
          } else {
            connection.sendRequest(ShowMessageRequest.type, {
              type: MessageType.Error,
              message: stderr,
            });
          }
          resolve([]);
        } else {
          resolve(parseAstOutput(stdout));
        }
      }
    );
  });
}

export function parseAstOutput(stdout: string) {
  let isJson = false;
  let lines = [];
  const files = [];
  for (const line of stdout.split("\n")) {
    if (line == "{") isJson = true;
    if (isJson) lines.push(line);
    if (line == "}") {
      isJson = false;
      const json = JSON.parse(lines.join("\n"));
      const includePath = join(rootPath, options.includePath);
      let path: string;
      if (existsSync((path = join(rootPath, json.absolutePath)))) {
        json.absolutePath = path;
      } else if (existsSync((path = join(includePath, json.absolutePath)))) {
        json.absolutePath = path;
      }
      json.absolutePath = "file://" + path;
      files.push(json);
      lines = [];
    }
  }
  return files;
}

export function parseError(stderr: string) {
  const lines = stderr.split("\n");
  const diagnostics: Diagnostic[] = [];
  for (let i = 0; i < lines.length; i++) {
    const message = lines[i].match(/^(Warning|Error): (.*)/);
    if (message) {
      const source = lines[i + 1].match(/:(\d+)?:?(\d+)?/)!;
      const line = parseInt(source?.[1]) || 1;
      const character = parseInt(source?.[2]) || 1;
      let severity: DiagnosticSeverity;
      if (message[1] == "Error") severity = DiagnosticSeverity.Error;
      else severity = DiagnosticSeverity.Warning;
      const range = Range.create(line - 1, character - 1, line - 1, character);
      const diagnostic: Diagnostic = { severity, range, message: message[2] };
      diagnostics.push(diagnostic);
      i += 1;
    }
  }
  return diagnostics;
}
