import { parseAstOutput } from "../src/utils";

describe("utils", () => {
  it("parseAstOutput()", () => {
    const result = parseAstOutput(`JSON AST (compact format):


======= home/i/Projects/solidity-language-server/test/contracts/simple.sol =======
{
  "absolutePath": "home/i/Projects/solidity-language-server/test/contracts/simple.sol",
  "exportedSymbols": {},
  "id": 2,
  "license": "MIT",
  "nodeType": "SourceUnit",
  "nodes":
  [
    {
      "id": 1,
      "literals":
      [
        "solidity",
        "^",
        "0.8",
        ".0"
      ],
      "nodeType": "PragmaDirective",
      "src": "32:23:0"
    }
  ],
  "src": "32:24:0"
}`);
    console.log(result);
    expect(result.length > 0);
  });
});
