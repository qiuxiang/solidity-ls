import { CompletionItemKind } from "vscode-languageserver";

export default [
  {
    label: "decode",
    detail: "abi.decode(bytes memory encodedData, (...)) returns (...)",
    documentation:
      "ABI-decodes the given data, while the types are given in parentheses as second argument. Example: `(uint a, uint[2] memory b, bytes memory c) = abi.decode(data, (uint, uint[2], bytes))`",
    kind: CompletionItemKind.Method,
  },
  {
    label: "encode",
    detail: "abi.encode(...) returns (bytes memory)",
    documentation: "ABI-encodes the given arguments",
    kind: CompletionItemKind.Method,
  },
  {
    label: "encodePacked",
    detail: "abi.encodePacked(...) returns (bytes memory)",
    documentation:
      "Performs packed encoding of the given arguments. Note that packed encoding can be ambiguous!",
    kind: CompletionItemKind.Method,
  },
  {
    label: "encodeWithSelector",
    detail:
      "abi.encodeWithSelector(bytes4 selector, ...) returns (bytes memory)",
    documentation:
      "ABI-encodes the given arguments starting from the second and prepends the given four-byte selector",
    kind: CompletionItemKind.Method,
  },
  {
    label: "encodeWithSignature",
    detail:
      "abi.encodeWithSignature(string memory signature, ...) returns (bytes memory)",
    documentation:
      "Equivalent to `abi.encodeWithSelector(bytes4(keccak256(bytes(signature))), ...)`",
    kind: CompletionItemKind.Method,
  },
  {
    label: "encodeCall",
    detail:
      "abi.encodeCall(function functionPointer, (...)) returns (bytes memory)",
    documentation:
      "ABI-encodes a call to `functionPointer` with the arguments found in the tuple. Performs a full type-check, ensuring the types match the function signature. Result equals `abi.encodeWithSelector(functionPointer.selector, (...))`",
    kind: CompletionItemKind.Method,
  },
];
