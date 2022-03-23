import { CompletionItemKind } from "vscode-languageserver";

export default [
  {
    label: "name",
    documentation: "The name of the contract.",
    kind: CompletionItemKind.Property,
  },
  {
    label: "creationCode",
    documentation:
      "Memory byte array that contains the creation bytecode of the contract. This can be used in inline assembly to build custom creation routines, especially by using the create2 opcode. This property can not be accessed in the contract itself or any derived contract. It causes the bytecode to be included in the bytecode of the call site and thus circular references like that are not possible.",
    kind: CompletionItemKind.Property,
  },
  {
    label: "runtimeCode",
    documentation:
      "Memory byte array that contains the runtime bytecode of the contract. This is the code that is usually deployed by the constructor of C. If C has a constructor that uses inline assembly, this might be different from the actually deployed bytecode. Also note that libraries modify their runtime bytecode at time of deployment to guard against regular calls. The same restrictions as with .creationCode also apply for this property.",
    kind: CompletionItemKind.Property,
  },
];
