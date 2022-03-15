import { CompletionItemKind } from "vscode-languageserver";

export default [
  {
    label: "data",
    detail: "(member) bytes calldata",
    documentation: "complete calldata",
    kind: CompletionItemKind.Property,
  },
  {
    label: "sender",
    detail: "(member) address",
    documentation: "sender of the message (current call)",
    kind: CompletionItemKind.Property,
  },
  {
    label: "sig",
    detail: "(member) bytes4",
    documentation: "first four bytes the calldata (i.e. function identifier)",
    kind: CompletionItemKind.Property,
  },
];
