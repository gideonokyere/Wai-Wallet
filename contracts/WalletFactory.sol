// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {Signers,WalletStruct} from "./structs/Wallet.sol";
import "./Wallet.sol";

contract WalletFactory {
  event WalletCreated(address indexed addr);
  mapping(address=>WalletStruct[] walletStruct) public userWallets;

  function createWallet(string memory _name, uint64 _numConfirmation, Signers[] memory _signers) public returns (address addr) {
    require(_signers.length >= 1,"please provide signers");
    require(_numConfirmation <= _signers.length,"number of confirmations higher then signers");
    Wallet wallet = new Wallet(_name,_numConfirmation,_signers);
    userWallets[msg.sender].push(WalletStruct({name:_name,addr:address(wallet)}));
    emit WalletCreated(address(wallet));
    return address(wallet);
  }

  function getWallets() external view returns (WalletStruct[] memory walletStruct) {
    return userWallets[msg.sender];
  }

}