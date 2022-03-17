// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract __Array {
  /// Arrays have a length member that contains their number of elements.
  /// The length of memory arrays is fixed (but dynamic, i.e. it can depend on
  /// runtime parameters) once they are created.
  uint256 length;

  /// Dynamic storage arrays and bytes (not string) have a member function
  /// called push() that you can use to append a zero-initialised element at
  /// the end of the array. It returns a reference to the element, so that it
  /// can be used like `x.push().t = 2` or `x.push() = b`
  function push() public {}

  /// Dynamic storage arrays and bytes (not string) have a member function
  /// called pop() that you can use to remove an element from the end of the
  /// array. This also implicitly calls delete on the removed element.
  function pop() public {}
}
