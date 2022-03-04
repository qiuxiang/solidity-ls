import { spawn } from "child_process";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Diagnostic,
  DiagnosticSeverity,
  Range,
} from "vscode-languageserver/node";
import { connection, options, rootPath } from ".";

function toDiagnostics(errors: any[], document: TextDocument) {
  return errors.map((error) => {
    const { start, end } = error.sourceLocation;
    return Diagnostic.create(
      Range.create(document.positionAt(start), document.positionAt(end)),
      error.formattedMessage.replace(/.*-->.*\n/, "").replace(/\n\n/, ""),
      error.severity == "error"
        ? DiagnosticSeverity.Error
        : DiagnosticSeverity.Warning,
      error.errorCode
    );
  });
}

export function compile(document: TextDocument) {
  return new Promise((resolve) => {
    const child = spawn("solc", [
      "-",
      "--standard-json",
      "--base-path",
      rootPath,
      "--include-path",
      options.includePath,
    ]);
    let data = "";
    child.stdout.on("data", (buffer: Buffer) => (data += buffer.toString()));
    child.stdout.on("end", () => {
      const { sources, errors } = JSON.parse(data.toString());
      resolve(sources);
      if (errors) {
        connection?.sendDiagnostics({
          uri: document.uri,
          diagnostics: toDiagnostics(errors, document),
        });
      } else {
        connection?.sendDiagnostics({ uri: document.uri, diagnostics: [] });
      }
    });
    child.stdin.write(
      JSON.stringify({
        language: "Solidity",
        sources: { [document.uri]: { content: document.getText() } },
        settings: { outputSelection: { "*": { "": ["ast"] } } },
      })
    );
    child.stdin.end();
  });
}

export function parseAst(ast: any) {}
