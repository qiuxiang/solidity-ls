import {
  Location,
  Position,
  Range,
  ReferenceParams,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { documents, solidityMap } from ".";
import { ASTNode, IdentifierNode } from "./parse";

export function onReferences({
  textDocument: { uri },
  position,
}: ReferenceParams): Location[] {
  const document = documents.get(uri);
  if (!document) return [];

  return getReferences(uri, position).map((i) => {
    return Location.create(uri, getIdentifierRange(i, document));
  });
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

export function getIdentifierRange(node: ASTNode, document: TextDocument) {
  const name = Reflect.get(node, "memberName") ?? Reflect.get(node, "name");
  const { srcStart, srcEnd } = node;
  return Range.create(
    document.positionAt(srcStart! + (srcEnd! - srcStart! - name.length)),
    document.positionAt(srcEnd!)
  );
}
