import { RenameParams, TextEdit, WorkspaceEdit } from "vscode-languageserver";
import { documents } from ".";
import { getIdentifierRange, getReferences } from "./references";

export function onRename({
  textDocument: { uri },
  position,
  newName,
}: RenameParams): WorkspaceEdit {
  const document = documents.get(uri);
  if (!document) return {};

  return getReferences(uri, position).reduce<WorkspaceEdit>(
    (previous, node) => {
      const { changes } = previous;
      if (!changes![uri]) changes![uri] = [];

      const range = getIdentifierRange(node, document);
      changes![uri].push(TextEdit.replace(range, newName));
      return previous;
    },
    { changes: {} }
  );
}
