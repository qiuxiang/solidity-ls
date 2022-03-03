import { readFileSync } from "fs";
import { join } from "path/posix";
import { Duplex } from "stream";
import {
  Connection,
  createConnection,
  DiagnosticSeverity,
  DidChangeConfigurationNotification,
  DidOpenTextDocumentNotification,
  DocumentFormattingRequest,
  FormattingOptions,
  HoverRequest,
  InitializeRequest,
  InitializeResult,
  PublishDiagnosticsNotification,
  TextDocumentItem,
} from "vscode-languageserver/node";
import { URI } from "vscode-uri";
import { createServer } from "../src";
import { getTestContractPath, getTestContractUri } from "./utils";

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

    const { capabilities } = await client.sendRequest<InitializeResult>(
      InitializeRequest.type.method,
      {
        capabilities: {},
        workspaceFolders: [{ uri: "file://" + join(__dirname, "..") }],
        initializationOptions: { extensionPath: join(__dirname, "..") },
      }
    );
    expect(capabilities).toBeTruthy();

    client.sendNotification(DidChangeConfigurationNotification.type, {
      settings: { solidity: { includePath: "node_modules" } },
    });
  });

  it("diagnostics", (done) => {
    openTextDocument(getTestContractUri("with-error.sol"));
    client.onNotification(
      PublishDiagnosticsNotification.type,
      ({ diagnostics }) => {
        expect(diagnostics[1]).toEqual({
          severity: DiagnosticSeverity.Error,
          range: {
            start: { line: 5, character: 2 },
            end: { line: 5, character: 3 },
          },
          message: "Undeclared identifier.",
        });
        done();
      }
    );
  });

  it("hover", async () => {
    const result = await client.sendRequest(HoverRequest.type, {
      textDocument: { uri: getTestContractUri("basic.sol") },
      position: { line: 0, character: 0 },
    });
    console.log(result);
  });

  it("format", async () => {
    const uri = getTestContractUri("unformatted.sol");
    openTextDocument(uri);
    const [{ newText }] = await client.sendRequest(
      DocumentFormattingRequest.type,
      {
        textDocument: { uri },
        options: FormattingOptions.create(2, true),
      }
    );
    expect(newText).toEqual(
      readFileSync(getTestContractPath("formatted.sol")).toString()
    );
  });

  function openTextDocument(uri: string) {
    const text = readFileSync(URI.parse(uri).path).toString();
    client.sendNotification(DidOpenTextDocumentNotification.type, {
      textDocument: TextDocumentItem.create(uri, "solidity", 0, text),
    });
  }
});
