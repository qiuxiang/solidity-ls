import { spawn } from "child_process";
import { URI } from "vscode-uri";
import { options } from "../src";
import { getTestContract } from "./utils";

describe("utils", () => {
  it("compile", (done) => {
    const document = getTestContract("erc20.sol");
    const child = spawn("solc", [
      "-",
      "--base-path",
      ".",
      "--include-path",
      options.includePath,
      "--standard-json",
    ]);

    let stdout = "";
    child.stdout.on("data", (buffer) => (stdout += buffer.toString()));
    child.stdout.on("end", () => {
      console.log(JSON.parse(stdout));
      done();
    });

    let stderr = "";
    child.stderr.on("data", (buffer) => (stderr += buffer.toString()));
    child.stdout.on("end", () => {
      if (!stderr) return;
    });

    const input = JSON.stringify({
      language: "Solidity",
      sources: { [document.uri]: { content: document.getText() } },
      settings: { outputSelection: { "*": { "": ["ast"] } } },
    });

    console.log(input);
    child.stdin.write(input);
    child.stdin.end();
  });
});
