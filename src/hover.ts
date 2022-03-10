import { TypeName, VariableDeclaration } from "solidity-ast";
import { Hover, HoverParams } from "vscode-languageserver/node";
import { documents, solidityMap } from ".";
import { AstNodeData } from "./parse";

export function onHover({ textDocument, position }: HoverParams): Hover | null {
  const document = documents.get(textDocument.uri);
  if (!document) return null;
  const solidity = solidityMap.get(document.uri);
  if (!solidity) return null;
  const node = solidity?.getDefinition(document, position);
  if (!node) return null;
  const contents: Hover["contents"] = [];
  if (node.nodeType == "VariableDeclaration") {
    contents.push(createContent(getVariableDeclaration(node)));
  } else if (node.nodeType == "StructDefinition") {
    contents.push(createContent(getStructDefinition(node)));
  } else if (node.nodeType == "FunctionDefinition") {
    contents.push(createContent(getFunctionDefinition(node)));
  }

  const parent = node.parent!;
  if (parent.nodeType == "StructDefinition") {
    contents.push(createContent(`struct ${parent.name}`));
  }

  const documentation = Reflect.get(node, "documentation");
  if (documentation) {
    contents.push(createContent(documentation.text));
  }
  return { contents };
}

function createContent(value: string) {
  return { language: "solidity", value };
}

function getVariableDeclaration(node: VariableDeclaration & AstNodeData) {
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
  if (node.parent!.nodeType == "StructDefinition") {
    declaration = `(member) ${declaration}`;
  }
  return `${declaration} ${node.name}`;
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
    value += `  ${getVariableDeclaration(member)};\n`;
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
