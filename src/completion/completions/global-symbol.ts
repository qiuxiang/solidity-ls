import { CompletionItemKind } from "vscode-languageserver";

export default [
  {
    label: "msg",
    documentation: "message",
    kind: CompletionItemKind.Module,
  },
  {
    label: "block",
    documentation: "current block",
    kind: CompletionItemKind.Module,
  },
  {
    label: "tx",
    documentation: "current transaction",
    kind: CompletionItemKind.Module,
  },
  {
    label: "blockhash",
    detail: "blockhash(uint blockNumber) returns (bytes32)",
    documentation:
      "hash of the given block when `blocknumber` is one of the 256 most recent blocks; otherwise returns zero",
    kind: CompletionItemKind.Function,
  },
  {
    label: "gasleft",
    detail: "gasleft() returns (uint256)",
    documentation: "remaining gas",
    kind: CompletionItemKind.Function,
  },
  {
    label: "abi",
    documentation: "ABI encoding and decoding",
    kind: CompletionItemKind.Module,
  },
  {
    label: "assert",
    detail: "assert(bool condition)",
    documentation:
      "causes a Panic error and thus state change reversion if the condition is not met - to be used for internal errors.",
    kind: CompletionItemKind.Function,
  },
  {
    label: "require",
    detail: "require(bool condition, string message)",
    documentation:
      "reverts if the condition is not met - to be used for errors in inputs or external components. Also provides an error message.",
    kind: CompletionItemKind.Function,
  },
  {
    label: "revert",
    detail: "revert(string memory message)",
    documentation:
      "abort execution and revert state changes, providing an explanatory string",
    kind: CompletionItemKind.Function,
  },
  {
    label: "addmod",
    detail: "addmod(uint x, uint y, uint k) returns (uint)",
    documentation:
      "compute (x + y) % k where the addition is performed with arbitrary precision and does not wrap around at 2**256. Assert that k != 0 starting from version 0.5.0.",
    kind: CompletionItemKind.Function,
  },
  {
    label: "mulmod",
    detail: "mulmod(uint x, uint y, uint k) returns (uint)",
    documentation:
      "compute (x * y) % k where the multiplication is performed with arbitrary precision and does not wrap around at 2**256. Assert that k != 0 starting from version 0.5.0.",
    kind: CompletionItemKind.Function,
  },
  {
    label: "keccak256",
    detail: "keccak256(bytes memory) returns (bytes32)",
    documentation: "compute the Keccak-256 hash of the input",
    kind: CompletionItemKind.Function,
  },
  {
    label: "sha256",
    detail: "sha256(bytes memory) returns (bytes32)",
    documentation: "compute the SHA-256 hash of the input",
    kind: CompletionItemKind.Function,
  },
  {
    label: "ripemd160",
    detail: "ripemd160(bytes memory) returns (bytes32)",
    documentation: "compute the RIPEMD-160 hash of the input",
    kind: CompletionItemKind.Function,
  },
  {
    label: "ecrecover",
    detail:
      "ecrecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) returns (address)",
    documentation: `recover the address associated with the public key from elliptic curve signature or return zero on error. The function parameters correspond to ECDSA values of the signature:
- r = first 32 bytes of signature
- s = second 32 bytes of signature
- v = final 1 byte of signature

ecrecover returns an address, and not an address payable. See address payable for conversion, in case you need to transfer funds to the recovered address.

## Warnning
If you use ecrecover, be aware that a valid signature can be turned into a different valid signature without requiring knowledge of the corresponding private key. In the Homestead hard fork, this issue was fixed for _transaction_ signatures (see EIP-2), but the ecrecover function remained unchanged.

This is usually not a problem unless you require signatures to be unique or use them to identify items. OpenZeppelin have a ECDSA helper library that you can use as a wrapper for ecrecover without this issue.`,
    kind: CompletionItemKind.Function,
  },
];
