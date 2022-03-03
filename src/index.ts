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
import { format } from "./format";
import { parseAstOutput, parseCompileOutput } from "./utils";

export let options = { includePath: "." };
export let rootPath = ".";
export let extensionPath: string;
export let connection: Connection;
export let documents: TextDocuments<TextDocument>;

export function createServer(
  input?: NodeJS.ReadableStream,
  output?: NodeJS.WritableStream
) {
  if (input && output) {
    connection = createConnection(input, output);
  } else {
    connection = createConnection();
  }

  function compile(document: TextDocument) {
    const { path } = URI.parse(document.uri);
    return new Promise<any[]>((resolve) => {
      exec(
        `solc ${path} --base-path ${rootPath} --include-path ${options.includePath} --ast-compact-json`,
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

  documents = new TextDocuments(TextDocument);
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

  connection.onDocumentFormatting(format);

  connection.onInitialize(({ workspaceFolders, initializationOptions }) => {
    rootPath = URI.parse(workspaceFolders![0].uri).path;
    extensionPath = initializationOptions.extensionPath;
    return {
      capabilities: {
        hoverProvider: true,
        documentFormattingProvider: true,
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
