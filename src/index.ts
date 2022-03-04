import { join } from "path";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Connection,
  createConnection,
  TextDocuments,
} from "vscode-languageserver/node";
import { URI } from "vscode-uri";
import { format } from "./format";
import { compile } from "./utils";

export let options = { includePath: join(__dirname, "..", "node_modules") };
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

  documents = new TextDocuments(TextDocument);
  documents.onDidChangeContent(async ({ document }) => {
    const sources = await compile(document);
    setTimeout(() => require("prettier"), 0);
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
