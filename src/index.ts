import { join } from "path";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Connection,
  createConnection,
  TextDocuments,
} from "vscode-languageserver/node";
import { URI } from "vscode-uri";
import { compile } from "./compile";
import { onCompletion } from "./completion";
import { onDefinition } from "./definition";
import { onFormatting } from "./formatting";
import { onHover } from "./hover";
import { onReferences } from "./references";
import { onRename } from "./rename";
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
  connection.onRenameRequest(onRename);
  connection.onReferences(onReferences);

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
        completionProvider: { triggerCharacters: ["."] },
        renameProvider: true,
        referencesProvider: true,
      },
    };
  });

  documents = new TextDocuments(TextDocument);
  documents.listen(connection);

  documents.onDidChangeContent(({ document }) => {
    const result = compile(document);
    if (result.length) {
      solidityMap.set(document.uri, new Solidity(document, result));
    }
    setTimeout(() => require("prettier"), 0);
  });

  connection.listen();
  return connection;
}

if (require.main == module) {
  createServer();
}
