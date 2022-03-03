import { exec } from "child_process";
import { DiagnosticSeverity } from "vscode-languageserver";
import { parseAstOutput, parseCompileOutput } from "../src/utils";
import { getTestContractPath } from "./utils";

describe("utils", () => {
  it("parseAstOutput()", (done) => {
    const path = getTestContractPath("basic.sol");
    exec("solc --ast-compact-json " + path, (_, stdout) => {
      const [ast] = parseAstOutput(stdout);
      expect(ast.nodeType).toEqual("SourceUnit");
      done();
    });
  });

  it("parseCompileOutput()", (done) => {
    const path = getTestContractPath("with-warning.sol");
    exec("solc " + path, (_, __, stderr) => {
      const diagnostics = parseCompileOutput(stderr);
      expect(diagnostics[1]).toEqual({
        severity: DiagnosticSeverity.Warning,
        range: {
          start: { line: 4, character: 4 },
          end: { line: 4, character: 5 },
        },
        message: "Unused local variable.",
      });
      done();
    });
  });
});
