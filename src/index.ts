import { join } from "path";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Connection,
  createConnection,
  DidOpenTextDocumentNotification,
  TextDocumentItem,
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
import { onSignatureHelp } from "./signature-help";
import { Solidity } from "./solidity";

export let options = {
  includePath: "node_modules",
  remapping: <Record<string, string>>{},
};
export let rootPath = join(__dirname, "..");
export let extensionPath: string;
export let connection: Connection;
export let documents: TextDocuments<TextDocument>;
export const solidityMap = new Map<string, Solidity>();
export const pathMap: Record<string, string> = {};

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
  connection.onSignatureHelp(onSignatureHelp);

  connection.onDidChangeConfiguration(({ settings }) => {
    options = settings.solidity;
  });

  connection.onInitialize(({ workspaceFolders, initializationOptions }) => {
    const uri = workspaceFolders?.[0]?.uri;
    if (uri) {
      rootPath = URI.parse(uri).path;
    }
    extensionPath = initializationOptions.extensionPath;
    return {
      capabilities: {
        hoverProvider: true,
        documentFormattingProvider: true,
        definitionProvider: true,
        completionProvider: { triggerCharacters: ["."] },
        renameProvider: true,
        referencesProvider: true,
        signatureHelpProvider: { triggerCharacters: ["("] },
      },
    };
  });

  documents = new TextDocuments(TextDocument);
  documents.listen(connection);

  documents.onDidChangeContent(async ({ document }) => {
    const result = await compile(document);
    if (result.length) {
      solidityMap.set(document.uri, new Solidity(document, result));
      connection.sendNotification(DidOpenTextDocumentNotification.type, {
        textDocument: TextDocumentItem.create(document.uri, "", 0, ""),
      });
    }
    require("prettier");
  });

  connection.listen();
  return connection;
}

if (require.main == module) {
  createServer();
}
