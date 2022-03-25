import { ContractDefinition, Identifier } from "solidity-ast";
import { setFlagsFromString } from "v8";
import {
  CompletionItem,
  CompletionItemKind,
  CompletionParams,
  CompletionTriggerKind,
  InsertTextFormat,
  InsertTextMode,
} from "vscode-languageserver";
import { solidityMap } from "..";
import { getDefinitionInfo } from "../hover";
import { DefinitionNode } from "../parse";
import { Solidity } from "../solidity";
import * as completions from "./completions";

let completionitems = <CompletionItem[]>[];

export async function onCompletion({
  textDocument,
  position,
  context,
}: CompletionParams) {
  completionitems = [];
  position.character -= 1;
  const solidity = solidityMap.get(textDocument.uri);
  if (!solidity) return null;
  const nodes = solidity.getCurrentNodes(position);
  const node = nodes[0];
  if (node) {
    if (
      node.nodeType == "FunctionCall" &&
      node.kind == "structConstructorCall"
    ) {
      const nodeId = (<Identifier>node.expression).referencedDeclaration!;
      addCompletionItems(solidity, nodeId);
      return completionitems;
    }
  }

  if (context?.triggerKind == CompletionTriggerKind.TriggerCharacter) {
    const { typeString, typeIdentifier } = (<Identifier>node)?.typeDescriptions;
    if (!typeString || !typeIdentifier) return [];

    completionitems = completionitems.concat(
      completionsMap.get(typeString) ?? []
    );
    if (node.nodeType == "ElementaryTypeNameExpression") {
      completionitems = completionitems.concat(
        completionsMap.get(node.typeName.name) ?? []
      );
    }

    if (typeIdentifier.startsWith("t_array")) {
      completionitems = completionitems.concat(completions.array);
    } else {
      // user defined type completion
      const match = typeIdentifier.match(/\$(\d+)/);
      if (match) {
        const nodeId = parseInt(match[1]);
        if (typeIdentifier.startsWith("t_contract")) {
          const node = <ContractDefinition>solidity.nodeMap.get(nodeId);
          for (const id of node.linearizedBaseContracts) {
            addCompletionItems(solidity, id);
          }
        } else {
          addCompletionItems(solidity, nodeId);
        }
      }
    }
  } else {
    completionitems = [
      ...completions.globalSymbol,
      ...completions.elementaryType,
      ...completions.keyword,
    ];
    for (const node of nodes) {
      switch (node.nodeType) {
        case "ContractDefinition":
          for (const id of node.linearizedBaseContracts) {
            addCompletionItems(solidity, id);
          }
          break;
        case "FunctionDefinition":
          addCompletionItems(solidity, node.id);
          addCompletionItems(solidity, node.body!.id);
          break;
        case "Block":
        case "SourceUnit":
          addCompletionItems(solidity, node.id);
          break;
      }
    }

    // contracts completion
    for (const node of solidity.definitions) {
      if (node.nodeType == "ContractDefinition") {
        completionitems.push(createCompletionItem(node));
      }
    }
  }
  return completionitems;
}

function addCompletionItems(solidity: Solidity, nodeId: number) {
  for (const node of solidity.getAccesableNodes(nodeId)) {
    completionitems.push(createCompletionItem(node));
  }
}

function createCompletionItem(node: DefinitionNode) {
  let { name } = node;
  const item = CompletionItem.create(name);
  item.kind = kindMap.get(node.nodeType);
  item.documentation = Reflect.get(node, "documentation")?.text;
  item.detail = getDefinitionInfo(node);
  if (node.nodeType == "FunctionDefinition") {
    const params = node.parameters.parameters
      .map((i, index) => `\${${index + 1}:${i.name}}`)
      .join(", ");
    item.insertText = `${node.name}(${params})`;
    item.insertTextFormat = InsertTextFormat.Snippet;
  }
  return item;
}

const kindMap = new Map([
  ["VariableDeclaration", CompletionItemKind.Variable],
  ["FunctionDefinition", CompletionItemKind.Function],
  ["EventDefinition", CompletionItemKind.Event],
  ["StructDefinition", CompletionItemKind.Struct],
  ["EnumDefinition", CompletionItemKind.Enum],
  ["EnumValue", CompletionItemKind.EnumMember],
  ["ContractDefinition", CompletionItemKind.Class],
]);

const completionsMap = new Map<string, CompletionItem[]>([
  ["block", completions.block],
  ["msg", completions.msg],
  ["tx", completions.tx],
  ["abi", completions.abi],
  ["bytes", completions.bytes],
  ["string", completions.string],
  ["address", completions.address],
  ["address payable", completions.addressPayable],
]);
