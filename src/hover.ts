import { ImportDirective, TypeName, VariableDeclaration } from "solidity-ast";
import { Hover, HoverParams } from "vscode-languageserver/node";
import { documents, solidityMap } from ".";
import { ASTNodeData, DefinitionNode } from "./parse";

export function onHover({ textDocument, position }: HoverParams): Hover | null {
  const document = documents.get(textDocument.uri);
  if (!document) return null;
  const solidity = solidityMap.get(document.uri);
  if (!solidity) return null;
  const node = solidity?.getDefinition(document, position);
  if (!node) return null;
  const contents: Hover["contents"] = [];
  const definitionInfo = getDefinitionInfo(node);
  if (definitionInfo) {
    contents.push(createContent(definitionInfo));
  }

  const parent = node.parent!;
  if (parent.nodeType == "StructDefinition") {
    contents.push(createContent(`struct ${parent.name}`));
  }

  const documentation = Reflect.get(node, "documentation");
  if (documentation) {
    contents.push(createContent(documentation.text.replace(/\n /g, "\n")));
  }
  return { contents };
}

function createContent(value: string) {
  return { language: "solidity", value };
}

export function getDefinitionInfo(
  node: DefinitionNode | (ImportDirective & ASTNodeData)
) {
  if (node.nodeType == "VariableDeclaration") {
    return getVariableDeclaration(node);
  } else if (node.nodeType == "StructDefinition") {
    return getStructDefinition(node);
  } else if (node.nodeType == "FunctionDefinition") {
    return getFunctionDefinition(node);
  }
}

function getVariableDeclaration(
  node: VariableDeclaration & ASTNodeData,
  struct = false
) {
  const { typeName } = node;
  if (!typeName) return "";
  let declaration = getTypeName(typeName);
  if (node.storageLocation != "default") {
    declaration += ` ${node.storageLocation}`;
  }
  if (node.stateVariable) {
    declaration = `(state) ${declaration}`;
    if (node.visibility == "public") {
      declaration += " public";
    }
  }
  if (node.parent!.nodeType == "StructDefinition" && !struct) {
    declaration = `(member) ${declaration}`;
  }
  return `${declaration}${node.name ? " " + node.name : ""}`;
}

function getTypeName(type: TypeName): string {
  switch (type.nodeType) {
    case "ElementaryTypeName":
      return `${type.name}`;
    case "ArrayTypeName":
      return `${getTypeName(type.baseType)}[]`;
    case "Mapping":
      const keyType = getTypeName(type.keyType);
      return `mapping(${keyType} => ${getTypeName(type.valueType)})`;
    case "UserDefinedTypeName":
      return `${type.pathNode?.name}`;
    default:
      return "unknown";
  }
}

function getStructDefinition(node: any) {
  let value = `struct ${node.name} {\n`;
  for (const member of node.members) {
    value += `  ${getVariableDeclaration(member, true)};\n`;
  }
  value += "}";
  return value;
}

function getFunctionDefinition(node: any) {
  let value = `function ${node.name}(`;
  value += node.parameters.parameters
    .map((param: any) => getVariableDeclaration(param))
    .join(", ");
  value += `) ${node.visibility}`;
  if (node.stateMutability != "nonpayable") {
    value += ` ${node.stateMutability}`;
  }
  if (node.returnParameters.parameters.length) {
    value += ` returns (`;
    value += node.returnParameters.parameters
      .map((param: any) => getVariableDeclaration(param))
      .join(", ");
    value += `)`;
  }
  return value;
}
