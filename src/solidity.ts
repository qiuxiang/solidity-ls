import { ImportDirective, SourceUnit } from "solidity-ast";
import { Position, TextDocument } from "vscode-languageserver-textdocument";
import { ASTNode, ASTNodeData, DefinitionNode, parse } from "./parse";

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
      let uri = root.absolutePath;
      this.astMap.set(uri, root);
      if (!this.nodes.has(uri)) this.nodes.set(uri, []);
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

  getDefinition(
    document: TextDocument,
    position: Position
  ): DefinitionNode | (ImportDirective & ASTNodeData) | null {
    const node = this.getCurrentNodes(document, position)[0];
    if (!node) return null;
    if (node.nodeType == "ImportDirective") {
      return node;
    } else {
      const ref = Reflect.get(node, "referencedDeclaration");
      if (ref) return <DefinitionNode>this.nodeMap.get(ref);
    }
    return null;
  }

  getCurrentNodes(document: TextDocument, position: Position): ASTNode[] {
    const offset = document.offsetAt(position);
    const nodes = this.nodes.get(document.uri);
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
}
