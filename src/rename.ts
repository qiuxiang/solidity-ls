import { RenameParams, WorkspaceEdit } from "vscode-languageserver";
import { solidityMap } from ".";

export function onRename({
  textDocument: { uri },
  position,
  newName,
}: RenameParams): WorkspaceEdit {
  const solidity = solidityMap.get(uri);
  if (!solidity) return {};
  const nodes = solidity.getCurrentNodes(position);
  const node = nodes[0];
  if (newName == Reflect.get(node, "name")) return {};

  return {};
}
