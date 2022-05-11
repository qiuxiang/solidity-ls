import { join } from "path/posix";
import { Duplex } from "stream";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionRequest,
  CompletionTriggerKind,
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
import { createServer } from "../src";
import { getTestContract, getTestContractUri } from "./utils";

class Stream extends Duplex {
  _write(chunk: string, _: string, done: () => void) {
    try {
      // console.log(JSON.parse(chunk.toString()));
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
    let isDone = false;
    openTextDocument("with-error.sol");
    client.onNotification(
      PublishDiagnosticsNotification.type,
      ({ diagnostics }) => {
        if (!isDone && diagnostics.length) {
          console.log(diagnostics[1]);
          expect(diagnostics[1]).toEqual({
            severity: DiagnosticSeverity.Error,
            range: {
              start: { line: 5, character: 2 },
              end: { line: 5, character: 3 },
            },
            message: `DeclarationError: Undeclared identifier.
  |
6 |   a();
  |   ^`,
            code: "7576",
          });
          isDone = true;
          done();
        }
      }
    );
  });

  it("hover", async () => {
    await openTextDocument("ballot.sol");
    const { contents } = (await client.sendRequest(HoverRequest.type, {
      textDocument: { uri: getTestContractUri("ballot.sol") },
      position: { line: 33, character: 9 },
    }))!;
    expect(contents).toEqual([
      {
        language: "solidity",
        value: "(state) address public chairperson",
      },
    ]);
  });

  it("format", async () => {
    const { uri } = await openTextDocument("unformatted.sol");
    const result = await client.sendRequest(DocumentFormattingRequest.type, {
      textDocument: { uri },
      options: FormattingOptions.create(2, true),
    });
    expect(result?.[0].newText).toEqual(
      getTestContract("formatted.sol").getText()
    );
  });

  it("completion", async () => {
    const { uri } = await openTextDocument("erc20.sol");
    const result = await client.sendRequest(CompletionRequest.type, {
      textDocument: { uri },
      position: { line: 7, character: 5 },
      context: { triggerKind: CompletionTriggerKind.Invoked },
    });
    console.log(result);
  });

  function openTextDocument(name: string) {
    return new Promise<TextDocument>((resolve) => {
      const document = getTestContract(name);
      client.sendNotification(DidOpenTextDocumentNotification.type, {
        textDocument: TextDocumentItem.create(
          document.uri,
          "solidity",
          0,
          document.getText()
        ),
      });
      client.onNotification(DidOpenTextDocumentNotification.type, () => {
        resolve(document);
      });
    });
  }
});
