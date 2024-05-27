// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

struct WalletStruct {
  string name;
  address addr;
}

struct Signers {
  string name;
  address addr;
}

struct Transaction {
  uint256 txId;
  uint256 amount;
  address to;
  uint256 approved;
  uint256 unApproved;
  uint256 numConfirmation;
  bool excuted;
}

struct SignerStatus {
  string name;
  address addr;
  bool approved;
}