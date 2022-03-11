import { writeFile } from "fs/promises";
import { compile } from "../src/compile";
import { getTestContract } from "./utils";

describe("utils", () => {
  it("compile()", async () => {
    console.log(compile(getTestContract("with-error.sol")));
    // await compile(getTestContract("with-error.sol"));
  });

  it("parseAst()", async () => {
    const document = getTestContract("ballot.sol");
    const result = compile(document);
    writeFile("dist/ast.json", JSON.stringify(result));
  });
});
