import {
  Block,
  ContractDefinition,
  EnumDefinition,
  ErrorDefinition,
  Expression,
  FunctionDefinition,
  Identifier,
  MemberAccess,
  SourceUnit,
  Statement,
  StructDefinition,
  TypeName,
  UserDefinedTypeName,
  UserDefinedValueTypeDefinition,
  UsingForDirective,
  VariableDeclaration,
} from "solidity-ast";
import { definitionMap, nodeMap } from ".";

interface AstNodeData {
  root?: SourceUnit;
  parent?: AstNode;
  start?: number;
  end?: number;
}

export type DefinitionNode = (
  | ContractDefinition
  | EnumDefinition
  | ErrorDefinition
  | FunctionDefinition
  | StructDefinition
  | UserDefinedValueTypeDefinition
  | VariableDeclaration
  | Exclude<ContractDefinition["nodes"][0], UsingForDirective>
) &
  AstNodeData;

export type IdentifierNode = (Identifier | MemberAccess | UserDefinedTypeName) &
  AstNodeData;

export type AstNode = (
  | Expression
  | Statement
  | SourceUnit
  | DefinitionNode
  | TypeName
  | SourceUnit["nodes"][0]
  | ContractDefinition["nodes"][0]
) &
  AstNodeData;

export function parseAst(files: SourceUnit[]) {
  for (const ast of files) {
    const uri = ast.absolutePath;
    if (!definitionMap.has(uri)) definitionMap.set(uri, []);
    if (!definitionMap.has(uri)) definitionMap.set(uri, []);
    parseAstNode(ast, ast, definitionMap.get(uri)!, definitionMap.get(uri)!);
  }
}

export function parseAstNode(
  node: AstNode,
  root: AstNode,
  definitions: AstNode[],
  identifiers: AstNode[]
) {
  node.root = <SourceUnit>root;
  const position = node.src.split(":").map((i: string) => parseInt(i));
  node.start = position[0];
  node.end = position[0] + position[1];
  nodeMap.set(node.id, node);
  let children: (AstNode | null | undefined)[] = [];
  switch (node.nodeType) {
    case "ContractDefinition":
    case "StructDefinition":
    case "FunctionDefinition":
    case "VariableDeclaration":
      definitions.push(node);
      break;
    case "Identifier":
    case "MemberAccess":
    case "UserDefinedTypeName":
      identifiers.push(node);
      break;
  }
  switch (node.nodeType) {
    case "SourceUnit":
    case "ContractDefinition":
      children = node.nodes;
      break;
    case "StructDefinition":
      children = node.members;
      break;
    case "FunctionDefinition":
      children = [
        ...node.parameters.parameters,
        ...node.returnParameters.parameters,
        ...(node.body?.statements ?? []),
      ];
      break;
    case "ExpressionStatement":
      children = [node.expression];
      break;
    case "Assignment":
      children = [node.leftHandSide, node.rightHandSide];
      break;
    case "MemberAccess":
      children = [node.expression];
      break;
    case "IndexAccess":
      children = [node.baseExpression, node.indexExpression];
      break;
    case "ForStatement":
      children = [
        node.initializationExpression,
        node.condition,
        node.loopExpression,
        ...getStatements(node.body),
      ];
      break;
    case "WhileStatement":
      children = [node.condition, ...getStatements(node.body)];
      break;
    case "IfStatement":
      children = [
        node.condition,
        ...getStatements(node.trueBody),
        ...getStatements(node.falseBody),
      ];
      break;
    case "VariableDeclarationStatement":
      children = node.declarations;
      if (node.initialValue) {
        children.push(node.initialValue);
      }
      break;
    case "BinaryOperation":
      children = [node.leftExpression, node.rightExpression];
      break;
    case "FunctionCall":
      children = [node.expression, ...node.arguments];
      break;
    case "UnaryOperation":
      children = [node.subExpression];
      break;
    case "VariableDeclaration":
      if (node.typeName) {
        children = [node.typeName];
      }
      break;
    case "ArrayTypeName":
      children = [node.baseType];
      break;
  }
  for (const child of children) {
    if (!child) continue;
    child.parent = node;
    parseAstNode(child, root, definitions, identifiers);
  }
}

function getStatements(
  body: Block | Statement | null | undefined
): Statement[] {
  if (!body) return [];
  if (body.nodeType == "Block") return body.statements ?? [];
  return [body];
}
