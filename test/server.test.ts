import { join } from "path/posix";
import { Duplex } from "stream";
import {
  Connection,
  createConnection,
  DidChangeConfigurationNotification,
  InitializeRequest,
} from "vscode-languageserver/node";
import { createServer } from "../src";

class Stream extends Duplex {
  _write(chunk: string, _: string, done: () => void) {
    try {
      console.log(JSON.parse(chunk.toString()));
    } catch (_) {}
    this.emit("data", chunk);
    done();
  }

  _read(_size: number) {}
}

describe("server", () => {
  let client: Connection;

  beforeAll(async () => {
    const input = new Stream();
    const output = new Stream();
    createServer(input, output);
    client = createConnection(output, input);
    client.listen();

    const result = await client.sendRequest(InitializeRequest.type.method, {
      workspaceFolders: [
        { uri: "file://" + console.log(join(__dirname, "..")) },
      ],
      capabilities: {},
    });
    expect(result).toEqual({ capabilities: { textDocumentSync: 1 } });

    client.sendNotification(DidChangeConfigurationNotification.type, {
      settings: { solidity: { includePath: "node_modules" } },
    });
  });

  it("open document", async () => {
    client.sendNotification("textDocument/didOpen", {
      textDocument: {
        uri:
          "file://" + join(__dirname, "..", "test", "contracts", "basic.sol"),
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
});
