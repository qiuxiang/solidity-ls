import { exec } from "child_process";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Connection,
  createConnection,
  MessageType,
  ShowMessageRequest,
  TextDocuments,
} from "vscode-languageserver/node";
import { URI } from "vscode-uri";
import { parseAstOutput, parseCompileOutput } from "./utils";

export function createServer(
  input?: NodeJS.ReadableStream,
  output?: NodeJS.WritableStream
) {
  let options: any;
  let basePath: string;
  let connection: Connection;

  if (input && output) {
    connection = createConnection(input, output);
  } else {
    connection = createConnection();
  }

  function compile(document: TextDocument) {
    const { path } = URI.parse(document.uri);
    return new Promise<any[]>((resolve) => {
      exec(
        `solc ${path} --base-path ${basePath} --include-path ${options.includePath} --ast-compact-json`,
        (_, stdout, stderr) => {
          if (stderr) {
            const diagnostics = parseCompileOutput(stderr);
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

  const documents = new TextDocuments(TextDocument);
  documents.onDidChangeContent(async ({ document }) => {
    const files = await compile(document);
    if (files.length) {
    }
  });

  connection.onDidChangeConfiguration(({ settings: { solidity } }) => {
    options = solidity;
  });

  connection.onHover(() => {
    return { contents: [{ language: "solidity", value: "Hello World" }] };
  });

  connection.onInitialize(({ workspaceFolders }) => {
    basePath = URI.parse(workspaceFolders![0].uri).path;
    return {
      capabilities: {
        hoverProvider: true,
      },
    };
  });

  documents.listen(connection);
  connection.listen();
  return connection;
}

if (require.main == module) {
  createServer();
}
