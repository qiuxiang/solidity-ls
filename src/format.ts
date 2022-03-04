import { existsSync } from "fs";
import { join } from "path";
import {
  DocumentFormattingParams,
  TextEdit,
  Range,
} from "vscode-languageserver";
import { documents, extensionPath } from ".";

export function format({
  textDocument: { uri },
}: DocumentFormattingParams): TextEdit[] {
  const document = documents.get(uri);
  const pluginName = "prettier-plugin-solidity";
  let pluginPath = join(extensionPath, "node_modules", pluginName);
  if (!existsSync(pluginPath)) {
    pluginPath = join(extensionPath, "..", pluginName);
  }
  const { format, resolveConfig } = require("prettier");
  const formatted = format(document.getText(), {
    parser: "solidity-parse",
    plugins: [pluginPath],
    ...resolveConfig.sync(document.uri),
  });
  return [
    TextEdit.replace(Range.create(0, 0, document.lineCount, 0), formatted),
  ];
}
