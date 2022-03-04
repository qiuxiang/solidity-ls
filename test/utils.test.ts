import { writeFileSync } from "fs";
import { compile, parseAst } from "../src/utils";
import { getTestContract } from "./utils";

describe("utils", () => {
  it("compile()", async () => {
    console.log(await compile(getTestContract("basic.sol")));
    console.log(await compile(getTestContract("with-error.sol")));
  });

  it("parseAst()", async () => {
    const ast = await compile(getTestContract("ballot.sol"));
    writeFileSync("ast.json", JSON.stringify(ast, null, 2));
    // parseAst(Object.values(ast)[0].ast);
  });
});
