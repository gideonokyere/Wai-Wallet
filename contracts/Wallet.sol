// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {Signers,Transaction,SignerStatus} from "./structs/Wallet.sol";

contract Wallet {
  string public name; // name of the wallet
  uint256 public numConfirmation; // number of confirmations need to excute the transaction
  uint256 public numSigners; // number of signers of the wallet
  uint256 public balance; // balance of the wallet
  uint256 private txId; // last transaction Id
  mapping(uint256=>Signers) public signers; // Signer name and address
  mapping(uint256=>Transaction[]) public transactions; // This keep tracks of transactions
  mapping(uint256=>SignerStatus[]) public signerStatus; // this record signer action on a transaction

  constructor(string memory _name, uint64 _numConfirmation,Signers[] memory _signers){
    name = _name;
    numConfirmation = _numConfirmation;
    balance = 0;
    uint256 countSigners = 0;
    for(uint256 i=0; i<_signers.length; i++){
      signers[i] = _signers[i];
      countSigners++;
    }
    numSigners = countSigners;
  }

  function newTransaction(address _to, uint256 _amount) external returns (uint256) {
    uint256 walletBalance = address(this).balance;
    require(walletBalance >= _amount,"Low wallet balance");
    txId++;
    transactions[txId].push(Transaction({
      txId:txId,
      amount:_amount,
      to:_to,
      approved:0,
      unApproved:0,
      numConfirmation:0,
      excuted:false
    }));
    return txId;
  }

  function getWalletSigners() external view returns (Signers[] memory ){
    Signers[] memory signer = new Signers[](numSigners);
    for(uint256 i =0; i<numSigners; i++){
      signer[i] = signers[i];
    }
    return signer;
  }

}