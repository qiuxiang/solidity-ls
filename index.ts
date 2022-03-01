import { exec } from "child_process";
import { TextDocument } from "vscode-languageserver-textdocument";
import { createConnection, TextDocuments } from "vscode-languageserver/node";
import { URI } from "vscode-uri";

let options: any;
let basePath: string;

const connection = createConnection();
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

connection.onInitialize(({ workspaceFolders }) => {
  basePath = URI.parse(workspaceFolders![0].uri).path;
  return { capabilities: {} };
});

documents.listen(connection);
connection.listen();
