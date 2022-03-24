import { readFileSync } from "fs";
import {
  Location,
  Position,
  Range,
  ReferenceParams,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { documents, solidityMap } from ".";
import { getAbsolutePath } from "./compile";
import { ASTNode, IdentifierNode } from "./parse";

export function onReferences({
  textDocument: { uri },
  position,
}: ReferenceParams) {
  return getReferences(uri, position).map(getIdentifierLocation);
}

export function getReferences(
  uri: string,
  position: Position
): IdentifierNode[] {
  const solidity = solidityMap.get(uri);
  if (!solidity) return [];

  const node = solidity.getCurrentNodes(position)[0];
  const nodeId = Reflect.get(node, "referencedDeclaration") ?? node.id;
  return solidity.identifiers.filter(
    (i) => i.referencedDeclaration == nodeId || i.id == nodeId
  );
}

function getDocument({ root }: ASTNode) {
  const document = documents.get(root!.absolutePath);
  if (document) return document;

  const path = getAbsolutePath(root!.absolutePath);
  const content = readFileSync(path).toString();
  return TextDocument.create("file://" + path, "solidity", 0, content);
}

export function getIdentifierLocation(node: ASTNode) {
  const document = getDocument(node);
  let { srcStart = 0, srcEnd = 0 } = node;
  let name = "";
  switch (node.nodeType) {
    case "Identifier":
    case "VariableDeclaration":
    case "UserDefinedTypeName":
      name = node.name ?? "";
      break;
    case "MemberAccess":
      name = node.memberName;
      break;
  }
  if (name) {
    srcStart += srcEnd - srcStart - name.length;
  } else if (node.nodeType.match(/Definition/)) {
    srcStart += node.nodeType.replace("Definition", "").length + 1;
    srcEnd = srcStart + Reflect.get(node, "name").length;
  }
  const range = Range.create(
    document.positionAt(srcStart),
    document.positionAt(srcEnd)
  );
  return Location.create(document.uri, range);
}
