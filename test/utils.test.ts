import { writeFileSync } from "fs";
import { definitionMap, identifierMap } from "../src";
import { compile } from "../src/compile";
import { parseAst } from "../src/parse";
import { getTestContract } from "./utils";

describe("utils", () => {
  it("compile()", async () => {
    await compile(getTestContract("basic.sol"));
    await compile(getTestContract("with-error.sol"));
  });

  it("parseAst()", async () => {
    const document = getTestContract("ballot.sol");
    const ast = await compile(document);
    writeFileSync("dist/ast.json", JSON.stringify(ast));
    parseAst(ast);
    console.log(
      definitionMap
        .get(document.uri)
        ?.map((i) => [i.srcStart, i.nodeType, i.name])
    );
    console.log(
      identifierMap
        .get(document.uri)
        ?.map((i) => [
          i.srcStart,
          i.nodeType,
          i.nodeType == "MemberAccess" ? i.memberName : i.name,
        ])
    );
  });
});
