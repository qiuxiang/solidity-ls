import { identifierMap, nodeMap, symbolMap } from ".";

// @TODO: add types to this
export type AstNode = any;

export function parseAst(files: any[]) {
  for (const ast of files) {
    const uri = ast.absolutePath;
    if (!identifierMap.has(uri)) identifierMap.set(uri, []);
    if (!symbolMap.has(uri)) symbolMap.set(uri, []);
    parseAstItem(ast, ast, identifierMap.get(uri)!, symbolMap.get(uri)!);
  }
}

export function parseAstItem(
  node: AstNode,
  root: AstNode,
  identifiers: AstNode[],
  symbols: AstNode[]
) {
  node.root = root;
  const position = node.src.split(":").map((i: string) => parseInt(i));
  node.start = position[0];
  node.end = position[0] + position[1];
  nodeMap.set(node.id, node);
  let children = [];
  switch (node.nodeType) {
    case "ContractDefinition":
    case "StructDefinition":
    case "FunctionDefinition":
    case "VariableDeclaration":
      identifiers.push(node);
      break;
    case "Identifier":
    case "MemberAccess":
      symbols.push(node);
      break;
    case "UserDefinedTypeName":
      symbols.push(node);
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
        ...node.body.statements,
      ];
      break;
    case "WhileStatement":
      children = [node.condition, ...node.body.statements];
      break;
    case "IfStatement":
      children = [
        node.condition,
        ...node.trueBody.statements,
        ...(node.falseBody?.statements ?? []),
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
      children = [node.typeName];
      break;
  }
  for (const child of children) {
    if (!child) {
      debugger;
    }
    child.parent = node;
    parseAstItem(child, root, identifiers, symbols);
  }
}
