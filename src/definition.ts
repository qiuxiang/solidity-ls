import { readFile } from "fs/promises";
import { DefinitionParams, Location, Range } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { documents, solidityMap } from ".";
import { getAbsolutePath, getAbsoluteUri } from "./compile";
import { ASTNode } from "./parse";
import { getIdentifierRange } from "./references";

export async function onDefinition({
  textDocument: { uri },
  position,
}: DefinitionParams) {
  let document = documents.get(uri);
  if (!document) return null;

  const solidity = solidityMap.get(uri);
  if (!solidity) return null;

  let node: ASTNode | undefined;
  node = solidity.getCurrentNodes(position)[0];
  if (!node) return null;

  if (node.nodeType == "ImportDirective") {
    const uri = getAbsoluteUri(node.absolutePath);
    return Location.create(uri, Range.create(0, 0, 0, 0));
  } else {
    const ref = Reflect.get(node, "referencedDeclaration");
    if (ref) node = solidity.nodeMap.get(ref);
    if (!node) return null;
  }

  const targetUri = node.root!.absolutePath;
  if (targetUri != uri) {
    const path = getAbsolutePath(decodeURIComponent(targetUri));
    const content = (await readFile(path)).toString();
    document = TextDocument.create("file://" + path, "solidity", 0, content);
  }
  return Location.create(uri, getIdentifierRange(node, document));
}
