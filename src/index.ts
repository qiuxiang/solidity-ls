import { join } from "path";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Connection,
  createConnection,
  TextDocuments,
} from "vscode-languageserver/node";
import { URI } from "vscode-uri";
import { onDefinition } from "./definition";
import { onFormatting } from "./formatting";
import { onHover } from "./hover";
import { compile, parseAst } from "./utils";

// @TODO: add types to this
export type AstNode = any;

export let options = { includePath: join(__dirname, "..", "node_modules") };
export let rootPath = ".";
export let extensionPath: string;
export let connection: Connection;
export let documents: TextDocuments<TextDocument>;

export const symbolMap = new Map<string, AstNode[]>();
export const identifierMap = new Map<string, AstNode[]>();
export const nodeMap = new Map<number, AstNode>();

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
    parseAst(await compile(document));
    setTimeout(() => require("prettier"), 0);
  });

  connection.onDocumentFormatting(onFormatting);
  connection.onDefinition(onDefinition);
  connection.onHover(onHover);

  connection.onDidChangeConfiguration(({ settings: { solidity } }) => {
    options = solidity;
  });

  connection.onInitialize(({ workspaceFolders, initializationOptions }) => {
    rootPath = URI.parse(workspaceFolders![0].uri).path;
    extensionPath = initializationOptions.extensionPath;
    return {
      capabilities: {
        hoverProvider: true,
        documentFormattingProvider: true,
        definitionProvider: true,
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
