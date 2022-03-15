import { CompletionItemKind } from "vscode-languageserver";

export default [
  {
    label: "basefee",
    detail: "(member) uint",
    documentation: "current block’s base fee (EIP-3198 and EIP-1559)",
    kind: CompletionItemKind.Property,
  },
  {
    label: "chainid",
    detail: "(member) uint",
    documentation: "current chain id",
    kind: CompletionItemKind.Property,
  },
  {
    label: "coinbase",
    detail: "(member) address payable",
    documentation: "current block miner’s address",
    kind: CompletionItemKind.Property,
  },
  {
    label: "difficulty",
    detail: "(member) uint",
    documentation: "current block difficulty",
    kind: CompletionItemKind.Property,
  },
  {
    label: "gaslimit",
    detail: "(member) uint",
    documentation: "current block gaslimit",
    kind: CompletionItemKind.Property,
  },
  {
    label: "number",
    detail: "(member) uint",
    documentation: "current block number",
    kind: CompletionItemKind.Property,
  },
  {
    label: "timestamp",
    detail: "(member) uint",
    documentation: "current block timestamp as seconds since unix epoch",
    kind: CompletionItemKind.Property,
  },
];
