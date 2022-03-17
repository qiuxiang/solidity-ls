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
import { Solidity } from "../solidity";
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
    const { typeString, typeIdentifier } = (<Identifier>node)?.typeDescriptions;
    if (!typeString || !typeIdentifier) return [];

    items = items.concat(completionsMap.get(typeString) ?? []);
    if (typeString.startsWith("contract ")) {
      let nodeId = (<Identifier>node).referencedDeclaration;
      if (nodeId) {
        const { typeName } = <VariableDeclaration>solidity.nodeMap.get(nodeId);
        nodeId = (<UserDefinedTypeName>typeName).referencedDeclaration;
      } else if (node.nodeType == "FunctionCall") {
        nodeId = (<Identifier>node.expression).referencedDeclaration;
      }
      addCompletionItems(items, solidity, nodeId!);
    }
    if (typeIdentifier.startsWith("t_array")) {
      const definitions =
        solidity.scopes.get(solidity.astMap.get("global")!.id) ?? [];
      const nodeId = definitions.find((i) => i.name == "__Array")!.id;
      addCompletionItems(items, solidity, nodeId);
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
            addCompletionItems(items, solidity, id);
          }
          break;
        case "FunctionDefinition":
          addCompletionItems(items, solidity, node.id);
          addCompletionItems(items, solidity, node.body!.id);
          break;
        case "Block":
        case "SourceUnit":
          addCompletionItems(items, solidity, node.id);
          break;
      }
    }
  }
  return items;
}

function addCompletionItems(
  items: CompletionItem[],
  solidity: Solidity,
  nodeId: number
) {
  for (const node of solidity.getAccesableNodes(nodeId)) {
    items.push(createCompletionItem(node));
  }
}

function createCompletionItem(node: DefinitionNode) {
  let { name } = node;
  if (node.nodeType == "FunctionDefinition") {
    if (!node.parameters.parameters.length) name = name += "()";
    else name = name += "(";
  }
  const item = CompletionItem.create(name);
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
  ["string", completions.bytes],
  ["address", completions.address],
  ["address payable", completions.addressPayable],
]);
