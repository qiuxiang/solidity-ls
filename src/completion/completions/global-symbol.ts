import { CompletionItemKind } from "vscode-languageserver";

export default [
  {
    label: "msg",
    documentation: "message",
    kind: CompletionItemKind.Module,
  },
  {
    label: "block",
    documentation: "current block",
    kind: CompletionItemKind.Module,
  },
  {
    label: "tx",
    documentation: "current transaction",
    kind: CompletionItemKind.Module,
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
  {
    label: "abi",
    documentation: "ABI encoding and decoding",
    kind: CompletionItemKind.Module,
  },
];
