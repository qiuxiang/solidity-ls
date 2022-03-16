import {
  Identifier,
  UserDefinedTypeName,
  VariableDeclaration,
} from "solidity-ast";
import {
  CompletionItem,
  CompletionItemKind,
  CompletionParams,
  CompletionTriggerKind,
} from "vscode-languageserver";
import { solidityMap } from "..";
import { getDefinitionInfo } from "../hover";
import { DefinitionNode } from "../parse";
import * as completions from "./completions";

export async function onCompletion({
  textDocument,
  position,
  context,
}: CompletionParams) {
  position.character -= 1;
  const solidity = solidityMap.get(textDocument.uri);
  if (!solidity) return null;
  const nodes = solidity.getCurrentNodes(position);
  let items = <CompletionItem[]>[];
  if (context?.triggerKind == CompletionTriggerKind.TriggerCharacter) {
    const node = nodes[0];
    const type = <string>(<any>node)?.typeDescriptions?.typeString;
    items = items.concat(completionsMap.get(type) ?? []);
    if (type.startsWith("contract ")) {
      let ref = (<Identifier>node).referencedDeclaration;
      if (ref) {
        const { typeName } = <VariableDeclaration>solidity.nodeMap.get(ref);
        ref = (<UserDefinedTypeName>typeName).referencedDeclaration;
      } else if (node.nodeType == "FunctionCall") {
        ref = (<Identifier>node.expression).referencedDeclaration;
      }
      for (const node of solidity.getAccesableNodes(ref!)) {
        items.push(createCompletionItem(node));
      }
    }
  } else {
    items = [
      ...completions.globalSymbol,
      ...completions.elementaryType,
      ...completions.keyword,
    ];
    for (const node of nodes) {
      switch (node.nodeType) {
        case "ContractDefinition":
          for (const id of node.linearizedBaseContracts) {
            for (const node of solidity.getAccesableNodes(id)) {
              items.push(createCompletionItem(node));
            }
          }
          break;
        case "FunctionDefinition":
          for (const item of solidity.getAccesableNodes(node.id)) {
            items.push(createCompletionItem(item));
          }
          for (const item of solidity.getAccesableNodes(node.body!.id)) {
            items.push(createCompletionItem(item));
          }
          break;
        case "Block":
          for (const item of solidity.getAccesableNodes(node.id)) {
            items.push(createCompletionItem(item));
          }
          break;
      }
    }
  }
  return items;
}

function createCompletionItem(node: DefinitionNode) {
  const item = CompletionItem.create(node.name);
  item.kind = kindMap.get(node.nodeType);
  item.documentation = Reflect.get(node, "documentation")?.text;
  item.detail = getDefinitionInfo(node);
  return item;
}

const kindMap = new Map([
  ["VariableDeclaration", CompletionItemKind.Variable],
  ["FunctionDefinition", CompletionItemKind.Function],
  ["EventDefinition", CompletionItemKind.Event],
  ["StructDefinition", CompletionItemKind.Struct],
  ["EnumDefinition", CompletionItemKind.Enum],
  ["EnumValue", CompletionItemKind.EnumMember],
]);

const completionsMap = new Map<string, CompletionItem[]>([
  ["block", completions.block],
  ["msg", completions.msg],
  ["tx", completions.tx],
  ["abi", completions.abi],
  ["bytes", completions.bytes],
  ["address", completions.address],
  ["address payable", completions.addressPayable],
]);
