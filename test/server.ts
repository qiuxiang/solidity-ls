import { Duplex } from "stream";
import {
  createConnection,
  InitializeRequest,
} from "vscode-languageserver/node";
import { createServerConnection } from "../src";

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

it("contains spec with an expectation", async () => {
  const input = new Stream();
  const output = new Stream();
  createServerConnection(input, output);
  const client = createConnection(output, input);
  client.listen();
  const { capabilities } = await client.sendRequest(InitializeRequest.type, {
    workspaceFolders: [{ uri: "file:///", name: "" }],
    rootUri: "file:///",
    processId: 0,
    capabilities: {},
  });
  expect(capabilities).toEqual({});
});
