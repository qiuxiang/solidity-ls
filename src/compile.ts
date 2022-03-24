import { accessSync, existsSync, readFileSync } from "fs";
import { join } from "path";
// @ts-ignore
import solc from "solc";
import { SourceUnit } from "solidity-ast";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Diagnostic,
  DiagnosticSeverity,
  Range,
} from "vscode-languageserver/node";
import { connection, options, pathMap, rootPath } from ".";

export function compile(document: TextDocument): SourceUnit[] {
  const input = {
    language: "Solidity",
    sources: { [document.uri]: { content: document.getText() } },
    settings: { outputSelection: { "*": { "": ["ast"] } } },
  };
  const { remapping } = options;
  const output = solc.compile(JSON.stringify(input), {
    import(path: string) {
      try {
        let absolutePath = path;
        if (path.startsWith("file://")) {
          absolutePath = decodeURIComponent(path.substring(7));
        } else {
          absolutePath = getAbsolutePath(path);
          if (!existsSync(absolutePath)) {
            for (const key in remapping) {
              if (path.startsWith(key)) {
                absolutePath = getAbsolutePath(
                  path.replace(key, remapping[key])
                );
                break;
              }
            }
          }
        }
        pathMap[path] = absolutePath;
        return { contents: readFileSync(absolutePath).toString() };
      } catch ({ message }) {
        return { error: message };
      }
    },
  });
  const { sources = {}, errors = [] } = JSON.parse(output);
  showErrors(document, errors);
  return Object.values(sources).map((i: any) => {
    const ast = <SourceUnit>i.ast;
    ast.absolutePath = getAbsolutePath(
      pathMap[ast.absolutePath] ?? ast.absolutePath
    );
    return ast;
  });
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
