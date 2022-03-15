import { CompletionItemKind } from "vscode-languageserver";

export default [
  {
    label: "gasprice",
    detail: "(member) uint",
    documentation: "gas price of the transaction",
    kind: CompletionItemKind.Property,
  },
  {
    label: "origin",
    detail: "(member) address",
    documentation: "sender of the transaction (full call chain)",
    kind: CompletionItemKind.Property,
  },
];
