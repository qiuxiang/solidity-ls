import { CompletionItemKind } from "vscode-languageserver";

export default [
  {
    label: "concat",
    detail: "bytes.concat(...) returns (bytes memory)",
    documentation:
      "Concatenates variable number of bytes and bytes1, …, bytes32 arguments to one byte array",
    kind: CompletionItemKind.Method,
  },
];
