import { CompletionItemKind } from "vscode-languageserver";
import address from "./address";

export default [
  ...address,
  {
    label: "transfer",
    detail: "<address payable>.transfer(uint256 amount)",
    documentation:
      "send given amount of Wei to Address, reverts on failure, forwards 2300 gas stipend, not adjustable",
    kind: CompletionItemKind.Method,
  },
  {
    label: "send",
    detail: "<address payable>.send(uint256 amount) returns (bool)",
    documentation:
      "send given amount of Wei to Address, returns false on failure, forwards 2300 gas stipend, not adjustable",
    kind: CompletionItemKind.Method,
  },
];
