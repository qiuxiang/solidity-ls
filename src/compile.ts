import { spawn } from "child_process";
import { dirname, join } from "path";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Diagnostic,
  DiagnosticSeverity,
  MessageType,
  Range,
  ShowMessageRequest,
} from "vscode-languageserver/node";
import { URI } from "vscode-uri";
import { connection, options } from ".";

export function compile(document: TextDocument) {
  return new Promise<any[]>((resolve) => {
    const path = URI.parse(document.uri).path;
    const child = spawn("solc", [
      "-",
      "--base-path",
      ".",
      "--include-path",
      options.includePath,
      "--ast-compact-json",
    ]);

    let stdout = "";
    child.stdout.on("data", (buffer) => (stdout += buffer.toString()));
    child.stdout.on("end", () => {
      resolve(parseAstOutput(stdout, path));
    });

    let stderr = "";
    child.stderr.on("data", (buffer) => (stderr += buffer.toString()));
    child.stdout.on("end", () => {
      if (!stderr) return;

      const diagnostics = parseError(stderr);
      if (diagnostics.length) {
        connection?.sendDiagnostics({ uri: document.uri, diagnostics });
      } else {
        connection?.sendRequest(ShowMessageRequest.type, {
          type: MessageType.Error,
          message: stderr,
        });
      }
      resolve([]);
    });

    child.stdin.write(document.getText());
    child.stdin.end();
  });
}

export function parseAstOutput(stdout: string, path: string) {
  const dir = dirname(path);
  let isJson = false;
  let lines = [];
  const files = [];
  for (const line of stdout.split("\n")) {
    if (line == "{") isJson = true;
    if (isJson) lines.push(line);
    if (line == "}") {
      isJson = false;
      const json = JSON.parse(lines.join("\n"));
      if (json.absolutePath == "<stdin>") {
        json.absolutePath = path;
      } else if (
        json.absolutePath.startsWith("./") ||
        json.absolutePath.startsWith("../")
      ) {
        json.absolutePath = join(dir, json.absolutePath);
      } else {
        json.absolutePath = join(options.includePath, json.absolutePath);
      }
      json.absolutePath = "file://" + json.absolutePath;
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
