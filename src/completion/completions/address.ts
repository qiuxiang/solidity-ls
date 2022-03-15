import { CompletionItemKind } from "vscode-languageserver";

export default [
  {
    label: "balance",
    detail: "(member) uint256",
    documentation: "balance of the Address in Wei",
    kind: CompletionItemKind.Property,
  },
  {
    label: "code",
    detail: "(member) bytes memory",
    documentation: "code at the Address (can be empty)",
    kind: CompletionItemKind.Property,
  },
  {
    label: "codehash",
    detail: "(member) bytes32",
    documentation: "the codehash of the Address",
    kind: CompletionItemKind.Property,
  },
];
