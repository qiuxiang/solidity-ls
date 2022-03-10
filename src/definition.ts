import { readFileSync } from "fs";
import { DefinitionParams, Location, Range } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import { documents, solidityMap } from ".";
import { getAbsoluteUri } from "./compile";

export function onDefinition({ textDocument, position }: DefinitionParams) {
  let document = documents.get(textDocument.uri);
  if (!document) return null;
  const solidity = solidityMap.get(document.uri);
  if (!solidity) return null;
  const node = solidity?.getDefinition(document, position);
  if (!node) return null;
  if (node.nodeType == "ImportDirective") {
    return Location.create(
      getAbsoluteUri(node.absolutePath),
      Range.create(0, 0, 0, 0)
    );
  }
  const targetUri = node.root!.absolutePath;
  if (targetUri != document.uri) {
    const content = readFileSync(URI.parse(targetUri).path).toString();
    document = TextDocument.create(targetUri, "solidity", 0, content);
  }
  return Location.create(
    document.uri,
    Range.create(
      document.positionAt(node.srcStart!),
      document.positionAt(node.srcEnd!)
    )
  );
}
