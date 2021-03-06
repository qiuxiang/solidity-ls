import { writeFile } from "fs/promises";
import { compile } from "../src/compile";
import { getTestContract } from "./utils";

describe("utils", () => {
  it("compile()", async () => {
    console.log(await compile(getTestContract("with-error.sol")));
    // console.log(await compile(getTestContract("erc20.sol")));
  });

  it("parseAst()", async () => {
    const document = getTestContract("ballot.sol");
    const result = compile(document);
    writeFile("dist/ast.json", JSON.stringify(result));
  });
});
