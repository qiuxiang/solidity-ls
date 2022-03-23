import { CompletionItemKind } from "vscode-languageserver";

export default [
  {
    label: "length",
    detail: "(memer) uint256",
    documentation:
      "Arrays have a length member that contains their number of elements. The length of memory arrays is fixed (but dynamic, i.e. it can depend on runtime parameters) once they are created.",
    kind: CompletionItemKind.Property,
  },
  {
    label: "push",
    detail: "push()",
    documentation:
      "Dynamic storage arrays and bytes (not string) have a member function called push() that you can use to append a zero-initialised element at the end of the array. It returns a reference to the element, so that it can be used like x.push().t = 2 or x.push() = b.",
    kind: CompletionItemKind.Method,
  },
  {
    label: "push",
    detail: "push(x)",
    documentation:
      "Dynamic storage arrays and bytes (not string) have a member function called push(x) that you can use to append a given element at the end of the array. The function returns nothing.",
    kind: CompletionItemKind.Method,
  },
  {
    label: "pop",
    detail: "pop()",
    documentation:
      "Dynamic storage arrays and bytes (not string) have a member function called pop() that you can use to remove an element from the end of the array. This also implicitly calls delete on the removed element.",
    kind: CompletionItemKind.Method,
  },
];
