import {
  CompletionItem,
  CompletionItemKind,
  CompletionParams,
} from "vscode-languageserver";
import { documents, solidityMap } from "..";
import { getDefinitionInfo } from "../hover";
import keywords from "./keywords";
import types from "./types";

export async function onCompletion({
  textDocument,
  position,
}: CompletionParams) {
  let document = documents.get(textDocument.uri);
  if (!document) return null;
  const solidity = solidityMap.get(document.uri);
  if (!solidity) return null;
  const nodes = solidity.getSelectedNodes(document, position);
  let completions = <CompletionItem[]>[...types, ...keywords];
  for (const node of nodes) {
    if (node.nodeType == "ContractDefinition") {
      for (const id of node.linearizedBaseContracts) {
        for (const node of solidity.scopes.get(id) ?? []) {
          const item = CompletionItem.create(node.name);
          item.kind = kindMap.get(node.nodeType);
          item.documentation = Reflect.get(node, "documentation")?.text;
          item.detail = getDefinitionInfo(node);
          completions.push(item);
        }
      }
      break;
    }
  }
  return completions;
}

const kindMap = new Map([
  ["VariableDeclaration", CompletionItemKind.Variable],
  ["FunctionDefinition", CompletionItemKind.Function],
  ["EventDefinition", CompletionItemKind.Event],
  ["StructDefinition", CompletionItemKind.Struct],
  ["EnumDefinition", CompletionItemKind.Enum],
  ["EnumValue", CompletionItemKind.EnumMember],
]);
