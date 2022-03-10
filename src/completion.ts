import { CompletionParams } from "vscode-languageserver";
import { documents, solidityMap } from ".";

export function onCompletion({ textDocument, position }: CompletionParams) {
  let document = documents.get(textDocument.uri);
  if (!document) return null;
  const solidity = solidityMap.get(document.uri);
  if (!solidity) return null;
  const nodes = solidity.getSelectedNodes(document, position);
  return [];
}
