import {
  DefinitionParams,
  Location,
  Position,
  Range,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { documents, identifierMap, nodeMap } from ".";
import { DefinitionNode, IdentifierNode } from "./parse";

export function onDefinition({ textDocument, position }: DefinitionParams) {
  const document = documents.get(textDocument.uri);
  if (!document) return null;
  const node = getDefinition(document, position);
  if (!node) return [];
  const path = node.root!.absolutePath;
  if (!path.startsWith("file://")) {
  }
  return Location.create(
    node.root!.absolutePath,
    Range.create(
      document.positionAt(node.srcStart!),
      document.positionAt(node.srcEnd!)
    )
  );
}

export function getDefinition(
  document: TextDocument,
  position: Position
): DefinitionNode | null {
  const identifier = getIdentifier(document, position);
  const ref = identifier?.referencedDeclaration;
  if (ref) return <DefinitionNode>nodeMap.get(ref);
  return null;
}

export function getIdentifier(
  document: TextDocument,
  position: Position
): IdentifierNode | null {
  const offset = document.offsetAt(position);
  const identifiers = identifierMap.get(decodeURIComponent(document.uri));
  if (!identifiers) return null;
  for (let i = identifiers.length - 1; i >= 0; i--) {
    const identifier = identifiers[i];
    const { srcStart: start, srcEnd: end } = identifier;
    if (start! <= offset && offset <= end!) {
      return identifier;
    }
  }
  return null;
}
