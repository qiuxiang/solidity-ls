import { ImportDirective } from "solidity-ast";
import { Position, TextDocument } from "vscode-languageserver-textdocument";
import { compile } from "./compile";
import {
  AstNode,
  AstNodeData,
  DefinitionNode,
  IdentifierNode,
  parse,
} from "./parse";

export class Solidity {
  document: TextDocument;
  definitions = new Map<string, DefinitionNode[]>();
  identifiers = new Map<string, IdentifierNode[]>();
  nodes = new Map<string, AstNode[]>();
  nodeMap = new Map<number, AstNode>();

  constructor(document: TextDocument) {
    this.document = document;
    this.compile();
  }

  async compile() {
    for (const root of compile(this.document)) {
      let uri = root.absolutePath;
      if (!this.definitions.has(uri)) this.definitions.set(uri, []);
      if (!this.identifiers.has(uri)) this.identifiers.set(uri, []);
      if (!this.nodes.has(uri)) this.nodes.set(uri, []);
      parse(
        root,
        root,
        this.definitions.get(uri)!,
        this.identifiers.get(uri)!,
        this.nodes.get(uri)!,
        this.nodeMap
      );
    }
  }

  getDefinition(
    document: TextDocument,
    position: Position
  ): DefinitionNode | (ImportDirective & AstNodeData) | null {
    const node = this.getSelectedNodes(document, position)[0];
    if (!node) return null;
    if (node.nodeType == "ImportDirective") {
      return node;
    } else {
      const ref = Reflect.get(node, "referencedDeclaration");
      if (ref) return <DefinitionNode>this.nodeMap.get(ref);
    }
    return null;
  }

  getIdentifier(
    document: TextDocument,
    position: Position
  ): IdentifierNode | null {
    return <IdentifierNode>this.getSelectedNodes(document, position)[0];
  }

  getSelectedNodes(document: TextDocument, position: Position): AstNode[] {
    const offset = document.offsetAt(position);
    const nodes = this.nodes.get(document.uri);
    if (!nodes) return [];
    const selected: AstNode[] = [];
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (node.srcStart! <= offset && offset <= node.srcEnd!) {
        selected.push(node);
      }
    }
    return selected;
  }
}
