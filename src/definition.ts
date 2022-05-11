import { DefinitionParams, Location, Range } from "vscode-languageserver";
import { pathMap, solidityMap } from ".";
import { getAbsoluteUri } from "./compile";
import { ASTNode } from "./parse";
import { getIdentifierLocation } from "./references";

export async function onDefinition({
  textDocument: { uri },
  position,
}: DefinitionParams) {
  const solidity = solidityMap.get(uri);
  if (!solidity) return null;

  let node: ASTNode | undefined;
  node = solidity.getCurrentNodes(position)[0];
  if (!node) return null;

  if (node.nodeType == "ImportDirective") {
    const uri = getAbsoluteUri(pathMap[node.absolutePath] ?? node.absolutePath);
    return Location.create(uri, Range.create(0, 0, 0, 0));
  } else {
    const ref = Reflect.get(node, "referencedDeclaration");
    if (ref) node = solidity.nodeMap.get(ref);
    if (!node) return null;
  }
  return getIdentifierLocation(node);
}
