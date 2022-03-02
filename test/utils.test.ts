import { exec } from "child_process";
import { join } from "path/posix";
import { DiagnosticSeverity } from "vscode-languageserver";
import { parseAstOutput, parseCompileOutput } from "../src/utils";

describe("utils", () => {
  it("parseAstOutput()", (done) => {
    const file = join(__dirname, "..", "test", "contracts", "basic.sol");
    exec("solc --ast-compact-json " + file, (_, stdout) => {
      const [ast] = parseAstOutput(stdout);
      expect(ast.nodeType).toEqual("SourceUnit");
      done();
    });
  });

  it("parseCompileOutput()", (done) => {
    const file = join(__dirname, "..", "test", "contracts", "with-warning.sol");
    exec("solc " + file, (_, __, stderr) => {
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
