import { exec } from "child_process";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Connection,
  createConnection,
  InitializeRequest,
  TextDocuments,
} from "vscode-languageserver/node";
import { URI } from "vscode-uri";

export function createServerConnection(
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

  const documents = new TextDocuments(TextDocument);
  documents.onDidOpen(({ document }) => {
    const { path } = URI.parse(document.uri);
    exec(
      `solc ${path} --base-path ${basePath} --include-path ${options.includePath} --ast-compact-json`,
      (_, stdout) => {
        console.log(stdout);
      }
    );
  });

  connection.onDidChangeConfiguration(({ settings: { solidity } }) => {
    options = solidity;
  });

  connection.onRequest(InitializeRequest.type, ({ workspaceFolders }) => {
    basePath = URI.parse(workspaceFolders![0].uri).path;
    return { capabilities: {} };
  });

  documents.listen(connection);
  connection.listen();
  return connection;
}

if (require.main == module) {
  createServerConnection();
}
