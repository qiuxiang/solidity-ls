[npm]: https://www.npmjs.com/package/solidity-ls
[npm-badge]: https://img.shields.io/npm/v/solidity-ls.svg

# solidity-ls [![npm-badge]][npm]

**This language server currently has no tolerance.**
Means that some completions will only work if sources are no syntax error.

For example:

```solidity
// should not work
msg.
   ^

// should work fine
msg.;
   ^
```

## Usage

```
npx solidity-ls --stdio
```
