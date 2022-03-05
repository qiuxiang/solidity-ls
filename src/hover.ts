import { Hover, HoverParams } from "vscode-languageserver/node";
import { documents } from ".";
import { getDefinition } from "./definition";

export function onHover({ textDocument, position }: HoverParams): Hover | null {
  const document = documents.get(textDocument.uri);
  if (!document) return null;
  const node = getDefinition(document, position);
  if (!node) return null;
  const contents: Hover["contents"] = [];
  if (node.nodeType == "VariableDeclaration") {
    contents.push(createContent(getVariableDeclaration(node)));
  } else if (node.nodeType == "StructDefinition") {
    contents.push(createContent(getStructDefinition(node)));
  } else if (node.nodeType == "FunctionDefinition") {
    contents.push(createContent(getFunctionDefinition(node)));
  }
  if (node.parent.nodeType == "StructDefinition") {
    contents.push(createContent(`struct ${node.parent.name}`));
  }
  if (node.documentation) {
    contents.push(createContent(node.documentation.text));
  }
  return { contents };
}

function createContent(value: string) {
  return { language: "solidity", value };
}

function getVariableDeclaration(node: any) {
  let declaration = "";
  const { typeName } = node;
  if (typeName.nodeType == "ElementaryTypeName") {
    declaration = typeName.name;
  } else if (typeName.nodeType == "ArrayTypeName") {
    declaration = `${typeName.baseType.pathNode.name}[]`;
  } else if (typeName.nodeType == "Mapping") {
    declaration = `mapping(${typeName.keyType.name} => ${typeName.valueType.pathNode.name})`;
  } else if (typeName.nodeType == "UserDefinedTypeName") {
    declaration = typeName.pathNode.name;
  }
  if (node.storageLocation != "default") {
    declaration += ` ${node.storageLocation}`;
  }
  if (node.stateVariable) {
    declaration = `(state) ${declaration}`;
    if (node.visibility == "public") {
      declaration += " public";
    }
  }
  if (node.parent.nodeType == "StructDefinition") {
    declaration = `(member) ${declaration}`;
  }
  return `${declaration} ${node.name}`;
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
