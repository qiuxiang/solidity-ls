import { SourceUnit } from "solidity-ast";
import { Position, TextDocument } from "vscode-languageserver-textdocument";
import { ASTNode, DefinitionNode, ImportNode, parse } from "./parse";

export class Solidity {
  document: TextDocument;
  definitions: DefinitionNode[] = [];
  nodes = new Map<string, ASTNode[]>();
  scopes = new Map<number, DefinitionNode[]>();
  astMap = new Map<string, SourceUnit>();
  nodeMap = new Map<number, ASTNode>();

  constructor(document: TextDocument, sources: SourceUnit[]) {
    this.document = document;
    for (const root of sources) {
      const uri = root.absolutePath;
      this.astMap.set(uri, root);
      if (!this.nodes.has(uri)) {
        this.nodes.set(uri, []);
      }
      parse(
        root,
        root,
        this.definitions,
        this.scopes,
        this.nodes.get(uri)!,
        this.nodeMap
      );
    }
  }

  getDefinitionNode(position: Position): DefinitionNode | ImportNode | null {
    const node = this.getCurrentNodes(position)[0];
    if (!node) return null;
    if (node.nodeType == "ImportDirective") {
      return node;
    } else {
      const ref = Reflect.get(node, "referencedDeclaration");
      if (ref) return <DefinitionNode>this.nodeMap.get(ref);
    }
    return null;
  }

  getCurrentNodes(position: Position): ASTNode[] {
    const offset = this.document.offsetAt(position);
    const nodes = this.nodes.get(this.document.uri);
    if (!nodes) return [];
    const selected: ASTNode[] = [];
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (node.srcStart! <= offset && offset <= node.srcEnd!) {
        selected.push(node);
      }
    }
    return selected;
  }

  getAccesableNodes(nodeId: number) {
    return (this.scopes.get(nodeId) ?? []).filter((node) => {
      if (
        node.nodeType == "VariableDeclaration" &&
        node.visibility == "private"
      ) {
        return false;
      }
      if (node.nodeType == "FunctionDefinition" && node.kind == "constructor") {
        return false;
      }
      if (node.nodeType == "ContractDefinition") {
        return false;
      }
      return true;
    });
  }
}
