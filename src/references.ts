import { Location, Range, ReferenceParams } from "vscode-languageserver";
import { documents, solidityMap } from ".";

export function onReferences({
  textDocument: { uri },
  position,
}: ReferenceParams): Location[] {
  const document = documents.get(uri);
  if (!document) return [];

  const solidity = solidityMap.get(uri);
  if (!solidity) return [];

  const node = solidity.getCurrentNodes(position)[0];
  let nodeId = node.id;
  const ref = Reflect.get(node, "referencedDeclaration");
  if (ref) {
    nodeId = ref;
  }
  const items = solidity.identifiers.filter(
    (i) => i.referencedDeclaration == nodeId
  );

  return items.map((i) => {
    return Location.create(
      uri,
      Range.create(
        document.positionAt(i.srcStart!),
        document.positionAt(i.srcEnd!)
      )
    );
  });
}
