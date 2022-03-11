import { readFileSync, accessSync } from "fs";
import { join } from "path";
// @ts-ignore
import solc from "solc";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Diagnostic,
  DiagnosticSeverity,
  Range,
} from "vscode-languageserver/node";
import { connection, options, rootPath } from ".";

export function compile(document: TextDocument) {
  const input = {
    language: "Solidity",
    sources: { [document.uri]: { content: document.getText() } },
    settings: {
      outputSelection: { "*": { "": ["ast"] } },
      parserErrorRecovery: true,
    },
  };
  const output = solc.compile(JSON.stringify(input), {
    import(path: string) {
      try {
        if (path.startsWith("file://")) {
          path = decodeURIComponent(path.substring(7));
        } else {
          path = getAbsolutePath(path);
        }
        return { contents: readFileSync(path).toString() };
      } catch ({ message }) {
        return { error: message };
      }
    },
  });
  const { sources, errors = [] } = JSON.parse(output);
  showErrors(document, errors);
  return Object.values(sources).map((i: any) => i.ast);
}

export function getAbsolutePath(path: string) {
  if (path.startsWith("file://")) {
    return decodeURIComponent(path.substring(7));
  }
  const includePath = join(rootPath, options.includePath);
  let absolutePath = join(rootPath, path);
  try {
    accessSync(absolutePath);
  } catch (_) {
    absolutePath = join(includePath, path);
  }
  return absolutePath;
}

export function getAbsoluteUri(path: string) {
  if (path.startsWith("file://")) return path;
  return "file://" + getAbsolutePath(path);
}

export function showErrors(document: TextDocument, errors: any[]) {
  const diagnostics: Diagnostic[] = [];
  for (const error of errors) {
    const { start, end } = error.sourceLocation;
    const diagnostic: Diagnostic = {
      severity:
        error.severity == "error"
          ? DiagnosticSeverity.Error
          : DiagnosticSeverity.Warning,
      range: Range.create(document.positionAt(start), document.positionAt(end)),
      message: error.formattedMessage.replace(/ -->.*\n/, ""),
      code: error.errorCode,
    };
    diagnostics.push(diagnostic);
  }
  connection?.sendDiagnostics({ uri: document.uri, diagnostics });
}
