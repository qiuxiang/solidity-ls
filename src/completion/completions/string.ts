import { CompletionItemKind } from "vscode-languageserver";

export default [
  {
    label: "concat",
    detail: "string.concat(...) returns (string memory)",
    documentation:
      "Concatenates variable number of string arguments to one string array",
    kind: CompletionItemKind.Method,
  },
];
