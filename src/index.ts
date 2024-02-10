import { readFile, realpathSync } from "fs";
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

export let rootPath = realpathSync(".");

export const options = {
  includePath: "node_modules",
  remapping: <Record<string, string>>{},
  allowPaths: [rootPath],
};

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
  connection.onSignatureHelp(onSignatureHelp);

  connection.onDidChangeConfiguration(({ settings: { solidity } }) => {
    const { includePath, remapping, allowPaths } = solidity ?? {};
    if (includePath) {
      options.includePath = includePath;
    }
    if (remapping) {
      options.remapping = Object.assign(options.remapping, remapping);
    }
    if (allowPaths && Array.isArray(allowPaths)) {
      options.allowPaths = options.allowPaths.concat(allowPaths);
    }
  });

  connection.onInitialize(({ workspaceFolders }) => {
    const uri = workspaceFolders?.[0]?.uri;
    if (uri) {
      rootPath = URI.parse(uri).path;
      loadingRemappingsFile();
    }
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
    // lazy load
    require("prettier");
  });

  connection.listen();
  return connection;
}

function loadingRemappingsFile() {
  const remappingsFile = join(rootPath, "remappings.txt");
  readFile(remappingsFile, null, (err, data) => {
    if (!err) {
      data
        .toString()
        .split("\n")
        .forEach((line) => {
          const [key, value] = line.split("=");
          if (key && value) {
            options.remapping[key] = value;
          }
        });
    }
  });
}

if (require.main == module) {
  createServer();
}
