import { CompletionItemKind } from "vscode-languageserver";

export default [
  {
    label: "msg",
    documentation: "message",
    kind: CompletionItemKind.Variable,
  },
  {
    label: "block",
    documentation: "current block",
    kind: CompletionItemKind.Variable,
  },
  {
    label: "tx",
    documentation: "current transaction",
    kind: CompletionItemKind.Variable,
  },
  {
    label: "blockhash",
    detail: "blockhash(uint blockNumber) returns (bytes32)",
    documentation:
      "hash of the given block when `blocknumber` is one of the 256 most recent blocks; otherwise returns zero",
    kind: CompletionItemKind.Function,
  },
  {
    label: "gasleft",
    detail: "gasleft() returns (uint256)",
    documentation: "remaining gas",
    kind: CompletionItemKind.Function,
  },
];
