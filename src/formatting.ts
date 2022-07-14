import { existsSync } from "fs";
import { join } from "path";
import {
  DocumentFormattingParams,
  Range,
  TextEdit,
} from "vscode-languageserver";
import { documents } from ".";

export function onFormatting({
  textDocument: { uri },
}: DocumentFormattingParams): TextEdit[] {
  const document = documents.get(uri);
  if (!document) return [];
  const pluginName = "prettier-plugin-solidity";
  const { format, resolveConfig } = require("prettier");
  let pluginPath = join(__dirname, "..", "..", pluginName);
  if (!existsSync(pluginPath)) {
    pluginPath = join(__dirname, "..", "node_modules", pluginName);
  }
  const formatted = format(document.getText(), {
    parser: "solidity-parse",
    plugins: [pluginPath],
    ...resolveConfig.sync(document.uri),
  });
  return [
    TextEdit.replace(Range.create(0, 0, document.lineCount, 0), formatted),
  ];
}
