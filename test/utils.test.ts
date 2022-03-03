import { compile } from "../src/utils";
import { getTestContract } from "./utils";

describe("utils", () => {
  it("compile()", async () => {
    // console.log(await compile(getTestContract("basic.sol")));
    console.log(await compile(getTestContract("with-error.sol")));
  });
});
