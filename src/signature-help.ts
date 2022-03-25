import { FunctionDefinition } from "solidity-ast";
import {
  SignatureHelp,
  SignatureHelpParams,
  SignatureInformation,
} from "vscode-languageserver";
import { documents, solidityMap } from ".";
import { getFunctionDefinition } from "./hover";

export function onSignatureHelp({
  textDocument: { uri },
  position,
}: SignatureHelpParams): SignatureHelp | undefined {
  const document = documents.get(uri)!;
  const solidity = solidityMap.get(uri)!;
  const line = document.getText().split("\n")[position.line];
  const functionName = line.match(/(\w+)\($/);
  if (!functionName) return;

  const node = <FunctionDefinition>(
    solidity.definitions.find(
      (i) => i.nodeType == "FunctionDefinition" && i.name == functionName[1]
    )
  );
  if (!node) return;

  const signature: SignatureInformation = {
    label: getFunctionDefinition(node),
    documentation: node.documentation?.text,
    parameters: node.parameters.parameters.map((param) => ({
      label: param.name,
    })),
    activeParameter: 0,
  };
  return {
    signatures: [signature],
    activeParameter: null,
    activeSignature: null,
  };
}
