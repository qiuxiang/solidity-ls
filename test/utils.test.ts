import { writeFileSync } from "fs";
import { identifierMap, symbolMap } from "../src";
import { compile } from "../src/compile";
import { parseAst } from "../src/parse";
import { getTestContract } from "./utils";

describe("utils", () => {
  it("compile()", async () => {
    console.log(await compile(getTestContract("basic.sol")));
    console.log(await compile(getTestContract("with-error.sol")));
  });

  it("parseAst()", async () => {
    const document = getTestContract("ballot.sol");
    const ast = await compile(document);
    console.log(ast);
    return;
    writeFileSync("dist/ast.json", JSON.stringify(ast));
    parseAst(ast);
    console.log(
      identifierMap.get(document.uri)?.map((i) => [i.start, i.nodeType, i.name])
    );
    console.log(
      symbolMap
        .get(document.uri)
        ?.map((i) => [i.start, i.nodeType, i.name ?? i.memberName])
    );
  });
});
