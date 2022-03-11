import {
  Block,
  ContractDefinition,
  EnumDefinition,
  ErrorDefinition,
  Expression,
  FunctionDefinition,
  Identifier,
  IdentifierPath,
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

export interface AstNodeData {
  root?: SourceUnit;
  parent?: AstNode;
  srcStart?: number;
  srcEnd?: number;
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
  | IdentifierPath
) &
  AstNodeData;

export function parse(
  node: AstNode,
  root: AstNode,
  definitions: AstNode[],
  scopes: Map<number, DefinitionNode[]>,
  nodes: AstNode[],
  nodeMap: Map<number, AstNode>
) {
  node.root = <SourceUnit>root;
  const position = node.src.split(":").map((i: string) => parseInt(i));
  node.srcStart = position[0];
  node.srcEnd = position[0] + position[1];
  nodes.push(node);
  nodeMap.set(node.id, node);
  let children: (AstNode | null | undefined)[] = [];
  switch (node.nodeType) {
    case "ContractDefinition":
    case "StructDefinition":
    case "FunctionDefinition":
    case "VariableDeclaration":
    case "EventDefinition":
    case "EnumDefinition":
    case "ErrorDefinition":
      definitions.push(node);
      const scopeId =
        Reflect.get(node, "scope") ?? Reflect.get(node.parent!, "scope");
      const scope = scopes.get(scopeId);
      if (scope) {
        scope.push(node);
      } else {
        scopes.set(scopeId, [node]);
      }
      break;
  }
  switch (node.nodeType) {
    case "SourceUnit":
      children = node.nodes;
      break;
    case "ContractDefinition":
      children = [...node.baseContracts.map((i) => i.baseName), ...node.nodes];
      break;
    case "StructDefinition":
      children = node.members;
      break;
    case "FunctionDefinition":
      children = [
        ...node.parameters.parameters,
        ...node.modifiers.map((i) => i.modifierName),
        ...node.returnParameters.parameters,
        ...getStatements(node.body),
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
    case "EmitStatement":
      children = [node.eventCall];
      break;
    case "Return":
      children = [node.expression];
      break;
    case "UncheckedBlock":
      children = node.statements;
      break;
  }
  for (const child of children) {
    if (!child) continue;
    child.parent = node;
    parse(child, root, definitions, scopes, nodes, nodeMap);
  }
}

function getStatements(
  body: Block | Statement | null | undefined
): Statement[] {
  if (!body) return [];
  if (body.nodeType == "Block") return body.statements ?? [];
  return [body];
}
