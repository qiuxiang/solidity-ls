import { spawn } from "child_process";
import { accessSync } from "fs";
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
import { connection, options, rootPath } from ".";

export function compile(document: TextDocument): Promise<any> {
  return new Promise((resolve) => {
    const child = spawn("solc", [
      "--standard-json",
      "--base-path",
      rootPath,
      "--include-path",
      options.includePath,
    ]);

    let stdout = "";
    child.stdout.on("data", (buffer) => (stdout += buffer.toString()));
    child.stdout.on("end", () => {
      try {
        const { sources = {}, errors = [] } = JSON.parse(stdout);
        showErrors(document, errors);
        resolve(
          Object.values(sources).map((i: any) => {
            const ast = <SourceUnit>i.ast;
            ast.absolutePath = getAbsolutePath(ast.absolutePath);
            return ast;
          })
        );
      } catch (_) {
        resolve([]);
      }
    });

    child.on("error", ({ message }) => {
      connection?.sendRequest(ShowMessageRequest.type, {
        type: MessageType.Error,
        message,
      });
    });

    const filename = getFilename(document);
    const remappings = Object.keys(options.remapping).map(
      (key) => `${key}=${options.remapping[key]}`
    );
    child.stdin.write(
      JSON.stringify({
        language: "Solidity",
        sources: { [filename]: { content: document.getText() } },
        settings: { remappings, outputSelection: { "*": { "": ["ast"] } } },
      })
    );
    child.stdin.end();
  });
}

function getFilename(document: TextDocument): string {
  const uri = decodeURIComponent(document.uri);
  if (uri.indexOf(rootPath) == -1) {
    return uri.replace(new RegExp(`.*${options.includePath}/`), "");
  } else {
    return uri.replace(`file://${rootPath}/`, "");
  }
}

export function getAbsolutePath(path: string) {
  if (path.startsWith("/")) return path;
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
  errors = errors.filter(
    (i) => document.uri.indexOf(i.sourceLocation.file) != -1
  );
  const diagnostics: Diagnostic[] = [];
  for (const error of errors) {
    const { start = 0, end = 0 } = error.sourceLocation ?? {};
    const diagnostic: Diagnostic = {
      severity:
        error.severity == "error"
          ? DiagnosticSeverity.Error
          : DiagnosticSeverity.Warning,
      range: Range.create(document.positionAt(start), document.positionAt(end)),
      message: error.formattedMessage
        .replace(/\s+-->.*/g, "")
        .replace("\n\n", ""),
      code: error.errorCode,
    };
    diagnostics.push(diagnostic);
  }
  connection?.sendDiagnostics({ uri: document.uri, diagnostics });
}
