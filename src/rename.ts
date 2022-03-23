import { RenameParams, TextEdit, WorkspaceEdit } from "vscode-languageserver";
import { getIdentifierLocation, getReferences } from "./references";

export function onRename({
  textDocument: { uri },
  position,
  newName,
}: RenameParams): WorkspaceEdit {
  return getReferences(uri, position).reduce<WorkspaceEdit>(
    (previous, node) => {
      const { changes } = previous;
      const { uri, range } = getIdentifierLocation(node);
      if (!changes![uri]) changes![uri] = [];
      changes![uri].push(TextEdit.replace(range, newName));
      return previous;
    },
    { changes: {} }
  );
}
