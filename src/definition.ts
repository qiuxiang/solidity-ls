import {
  DefinitionParams,
  Location,
  Position,
  Range,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { definitionMap, documents, nodeMap } from ".";
import { DefinitionNode } from "./parse";

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
  const offset = document.offsetAt(position);
  const symbols = definitionMap.get(document.uri);
  if (!symbols) return null;
  for (let i = symbols.length - 1; i >= 0; i--) {
    const symbol = symbols[i];
    const { srcStart: start, srcEnd: end } = symbol;
    if (start! <= offset && offset <= end!) {
      return <DefinitionNode>(
        nodeMap.get(Reflect.get(symbol, "referencedDeclaration"))
      );
    }
  }
  return null;
}
