import { CompletionItemKind } from "vscode-languageserver";

export default [
  {
    label: "balance",
    detail: "<address>.balance (uint256)",
    documentation: "balance of the Address in Wei",
    kind: CompletionItemKind.Property,
  },
  {
    label: "code",
    detail: "<address>.code (bytes memory)",
    documentation: "code at the Address (can be empty)",
    kind: CompletionItemKind.Property,
  },
  {
    label: "codehash",
    detail: "<address>.codehash (bytes32)",
    documentation: "the codehash of the Address",
    kind: CompletionItemKind.Property,
  },
  {
    label: "call",
    detail: "<address>.call(bytes memory) returns (bool, bytes memory)",
    documentation:
      "issue low-level `CALL` with the given payload, returns success condition and return data, forwards all available gas, adjustable",
    kind: CompletionItemKind.Method,
  },
  {
    label: "delegatecall",
    detail: "<address>.delegatecall(bytes memory) returns (bool, bytes memory)",
    documentation:
      "issue low-level `DELEGATECALL` with the given payload, returns success condition and return data, forwards all available gas, adjustable",
    kind: CompletionItemKind.Method,
  },
  {
    label: "staticcall",
    detail: "<address>.staticcall(bytes memory) returns (bool, bytes memory)",
    documentation:
      "issue low-level `STATICCALL` with the given payload, returns success condition and return data, forwards all available gas, adjustable",
    kind: CompletionItemKind.Method,
  },
];
