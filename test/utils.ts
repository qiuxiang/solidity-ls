import { readFileSync } from "fs";
import { join } from "path";
import { TextDocument } from "vscode-languageserver-textdocument";

export function getTestContractUri(name: string) {
  return "file://" + getTestContractPath(name);
}

export function getTestContractPath(name: string) {
  return join(__dirname, "..", "test", "contracts", name);
}

export function getTestContractDocument(name: string) {
  const path = getTestContractPath(name);
  const text = readFileSync(path).toString();
  return TextDocument.create("file://" + path, "solidity", 0, text);
}
