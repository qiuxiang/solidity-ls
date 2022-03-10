import { join } from "path";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Connection,
  createConnection,
  TextDocuments,
} from "vscode-languageserver/node";
import { URI } from "vscode-uri";
import { onCompletion } from "./completion";
import { onDefinition } from "./definition";
import { onFormatting } from "./formatting";
import { onHover } from "./hover";
import { Solidity } from "./solidity";

export let options = { includePath: "node_modules" };
export let rootPath = join(__dirname, "..");
export let extensionPath: string;
export let connection: Connection;
export let documents: TextDocuments<TextDocument>;
export const solidityMap = new Map<string, Solidity>();

export function createServer(
  input?: NodeJS.ReadableStream,
  output?: NodeJS.WritableStream
) {
  if (input && output) {
    connection = createConnection(input, output);
  } else {
    connection = createConnection();
  }

  connection.onDocumentFormatting(onFormatting);
  connection.onDefinition(onDefinition);
  connection.onHover(onHover);
  connection.onCompletion(onCompletion);

  connection.onDidChangeConfiguration(({ settings }) => {
    options = settings.solidity;
  });

  connection.onInitialize(({ workspaceFolders, initializationOptions }) => {
    rootPath = URI.parse(workspaceFolders![0].uri).path;
    extensionPath = initializationOptions.extensionPath;
    return {
      capabilities: {
        hoverProvider: true,
        documentFormattingProvider: true,
        definitionProvider: true,
        completionProvider: {
          triggerCharacters: ["."],
        },
      },
    };
  });

  documents = new TextDocuments(TextDocument);
  documents.listen(connection);

  documents.onDidOpen(({ document }) => {
    solidityMap.set(document.uri, new Solidity(document));
    setTimeout(() => require("prettier"), 0);
  });

  documents.onDidSave(({ document }) => {
    solidityMap.set(document.uri, new Solidity(document));
  });

  connection.listen();
  return connection;
}

if (require.main == module) {
  createServer();
}
