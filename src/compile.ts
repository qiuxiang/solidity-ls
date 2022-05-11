import { getStandardJsonInput } from "antlr4-solidity";
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
import { connection, options, pathMap, rootPath } from ".";

export function compile(document: TextDocument): Promise<any> {
  return new Promise((resolve) => {
    const child = spawn("solc", ["--standard-json"]);

    let stdout = "";
    child.stdout.on("data", (buffer) => (stdout += buffer.toString()));
    child.stdout.on("end", () => {
      const { sources = {}, errors = [] } = JSON.parse(stdout);
      showErrors(document, errors);
      resolve(
        Object.values(sources).map((i: any) => {
          const ast = <SourceUnit>i.ast;
          ast.absolutePath = getAbsolutePath(
            pathMap[ast.absolutePath] ?? ast.absolutePath
          );
          return ast;
        })
      );
    });

    child.on("error", ({ message }) => {
      connection?.sendRequest(ShowMessageRequest.type, {
        type: MessageType.Error,
        message,
      });
    });

    const filename = getFilename(document);
    const input = getStandardJsonInput(filename, document.getText(), {
      ...options,
      basePath: rootPath,
    });
    child.stdin.write(
      JSON.stringify({
        language: "Solidity",
        sources: input.sources,
        settings: { outputSelection: { "*": { "": ["ast"] } } },
      })
    );
    child.stdin.end();
  });
}

function getFilename(document: TextDocument): string {
  const uri = decodeURIComponent(document.uri);
  if (uri.indexOf(rootPath)) {
    return uri.replace(`file://${rootPath}/`, "");
  } else {
    return uri.replace(new RegExp(`.*${options.includePath}/`), "");
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
