// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DEPMToken is ERC20 {
  constructor() ERC20("DEPM", "DEPM") {
    a
    _mint(address(this), 10**decimals());
  }
}
