import { spawn } from "child_process";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  Diagnostic,
  DiagnosticSeverity,
  Range,
} from "vscode-languageserver/node";
import {
  AstNode,
  connection,
  identifierMap,
  nodeMap,
  options,
  symbolMap,
} from ".";

function toDiagnostics(errors: any[], document: TextDocument) {
  return errors.map((error) => {
    const { start, end } = error.sourceLocation;
    return Diagnostic.create(
      Range.create(document.positionAt(start), document.positionAt(end)),
      error.formattedMessage.replace(/.*-->.*\n/, "").replace(/\n\n/, ""),
      error.severity == "error"
        ? DiagnosticSeverity.Error
        : DiagnosticSeverity.Warning,
      error.errorCode
    );
  });
}

export function compile(document: TextDocument) {
  return new Promise((resolve) => {
    const child = spawn("solc", [
      "-",
      "--standard-json",
      "--base-path",
      ".",
      "--include-path",
      options.includePath,
    ]);
    let data = "";
    child.stdout.on("data", (buffer: Buffer) => (data += buffer.toString()));
    child.stdout.on("end", () => {
      const { sources, errors } = JSON.parse(data.toString());
      resolve(sources);
      if (errors) {
        connection?.sendDiagnostics({
          uri: document.uri,
          diagnostics: toDiagnostics(errors, document),
        });
      } else {
        connection?.sendDiagnostics({ uri: document.uri, diagnostics: [] });
      }
    });
    child.stdin.write(
      JSON.stringify({
        language: "Solidity",
        sources: { [document.uri]: { content: document.getText() } },
        settings: { outputSelection: { "*": { "": ["ast"] } } },
      })
    );
    child.stdin.end();
  });
}

export function parseAst(ast: any) {
  for (const item of Object.values<any>(ast)) {
    const root = item.ast;
    const uri = root.absolutePath;
    if (!identifierMap.has(uri)) identifierMap.set(uri, []);
    if (!symbolMap.has(uri)) symbolMap.set(uri, []);
    parseAstItem(root, root, identifierMap.get(uri)!, symbolMap.get(uri)!);
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
        ...node.body.statements,
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
    child.parent = node;
    parseAstItem(child, root, identifiers, symbols);
  }
}
