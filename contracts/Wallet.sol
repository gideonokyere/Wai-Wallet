// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Signers,Transaction,SignerStatus} from "./structs/Wallet.sol";
import {TransactionApproval} from "./enums/Transaction.sol";

contract Wallet is Ownable, AccessControl {

  event TransactionSent(uint256 indexed _txId,address indexed _to,uint256 _amount);
  event TransactionCreated(uint256 indexed _txId,address indexed _to,uint256 _amount);
  event TransactionRejected(uint256 indexed _txId);
  event FundsReceived(address indexed _addr, uint256 _amount);
  event SignerAdded(address indexed _addr);

  string public name; // name of the wallet
  uint256 public requiredConfirmation; // number of confirmations needed to excute the transaction
  uint256 public numOfSigners; // number of signers of the wallet
  uint256 public walletBalance; // balance of the wallet
  uint256 private txId; // transaction Id
  mapping(uint256=>Signers) public signers; // Signer name and address
  mapping(uint256=>Transaction) public transactions; // This keep tracks of transactions
  mapping(uint256=>SignerStatus[]) public signerStatus; // this record signer action on a transaction

  bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
  

  constructor(string memory _name, uint64 _requiredConfirmation,Signers[] memory _signers)Ownable(msg.sender){
    name = _name;
    requiredConfirmation = _requiredConfirmation;
    walletBalance = 0;
    uint256 countSigners = 0;
    for(uint256 i=0; i<_signers.length; i++){
      signers[i] = _signers[i];
      _grantRole(SIGNER_ROLE,_signers[i].addr);
      countSigners++;
    }
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    numOfSigners = countSigners;
  }

/***
 * @notice - if you are sending funds from a contract, you should use call instead of send or transfer
 */
  receive() external payable {
    if(address(this).balance > walletBalance){
      walletBalance = address(this).balance + msg.value;
    }else{
      walletBalance+=msg.value;
    }
    emit FundsReceived(msg.sender,msg.value);
  }

/***
 * @dev this function is used to create a new transaction.
 * @notice only signers can call this function
 * @param _to the reciever of the funds
 * @param _amount amount to send
 * @return txId the Id of the transaction
 */
  function newTransaction(address _to, uint256 _amount) external onlyRole(SIGNER_ROLE) returns (uint256) {
    require(walletBalance >= _amount,"Low wallet balance");
    txId++;
    transactions[txId] = Transaction({
      txId:txId,
      amount:_amount,
      to:_to,
      approved:0,
      unApproved:0,
      numConfirmation:0,
      excuted:false
    });
    emit TransactionCreated(txId,_to,_amount);
    return txId;
  }

/****
 * @dev this function returns the list of signers of the wallet
 * @return an array of Signers[]
 */
  function getWalletSigners() external view returns (Signers[] memory ){
    Signers[] memory signer = new Signers[](numOfSigners);
    for(uint256 i =0; i<numOfSigners; i++){
      signer[i] = signers[i];
    }
    return signer;
  }

/****
 * @dev this function allows a signer to sign a transaction
 * @param _txId transaction Id
 * @param _vote enum type with YES or NO values
 */
  function signAndExcuteTransaction(uint256 _txId, TransactionApproval _vote) external payable onlyRole(SIGNER_ROLE) returns (bool){
    //checking if the transaction has been excuted
    if(_hasTransactionExcuted(_txId) == true){
      revert("Transaction already excuted");
    }
    if(_canExcuteTransaction(_txId,_vote) == true){
      _sendFunds(_txId);
    }
    return true;
  }

/***
 * @dev this function allows you to add a signer to the wallet
 * @notice only admin can add a signer
 * @param _name name of the signer
 * @param _add address of the signer
 * @return true if sucess
 */
  function addSigner(string memory _name,address _addr) external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool){
    //Checking if the address is already a signer
    if(msg.sender == address(0)){
      revert("Zero address not allowed");
    }
    if(hasRole(SIGNER_ROLE,_addr)){
      revert("Already a signer");
    }
    numOfSigners+=1;
    signers[numOfSigners] = Signers({
      name: _name,
      addr: _addr
    });
    emit SignerAdded(_addr);
    return true;
  }

  /**
   * @dev this function returns signer's name
   * @return _name name of the signer calling the function
   */
  function _getSignerName() internal view returns (string memory _name){
    for(uint256 i=0; i<numOfSigners; i++){
      if(signers[i].addr == msg.sender){
        return signers[i].name;
      }
    }
    return "";
  }

/****
 * @dev This function checks if a transaction have been approved and can be excuted as well.
 * if the transaction a is not approved by signers, the transaction will be excuted but the 
 * funds will not be sent.
 * @param _txId The transaction Id
 * @param _vote An enum type with YES or No values
 * @return true or false which indicates if a the funds can be sent or not
 */
  function _canExcuteTransaction(uint256 _txId, TransactionApproval _vote) internal returns (bool){
    Transaction storage trans = transactions[_txId];
    string memory _name = _getSignerName();//get the name of the signer
    trans.numConfirmation += 1;
    SignerStatus[] storage signer = signerStatus[_txId];

    if(_vote == TransactionApproval.YES){
      trans.approved += 1;
      signer.push(SignerStatus({
        name: _name,
        addr: msg.sender,
        approved: true
      }));
    }else if(_vote == TransactionApproval.NO){
      trans.unApproved +=1;
      signer.push(SignerStatus({
        name: _name,
        addr: msg.sender,
        approved: false
      }));
    }

    if(trans.numConfirmation >= requiredConfirmation) {
      trans.excuted = true;
      assert(trans.excuted == true);
    }
    //Checking if approved is > unApproved
    if(trans.approved > trans.unApproved){
      return true;
    }
    emit TransactionRejected(_txId);
    return false;
  }

/***
 * @dev this function checks if a transaction has been excuted
 * @param _txId uint256
 * @return bool
 */
  function _hasTransactionExcuted(uint256 _txId) internal view returns (bool){
    Transaction memory trans = transactions[_txId];
    if(trans.excuted == true) {
      return true;
    }else{
      return false;
    }
  }

/***
 * @dev this function sends the funds but it depends on _hasTransactionExcuted and  _canExcuteTransaction
 * @param _txId Transaction Id
 * @return true or false
 */
  function _sendFunds(uint256 _txId) internal returns (bool){
    Transaction memory trans = transactions[_txId];
    if(trans.amount > walletBalance){
      revert("Wallet has a low a balance");
    }
    walletBalance -= trans.amount;
    (bool sent,) = payable(trans.to).call{value:trans.amount}("");
    if(!sent){
      revert("Transaction failed");
    }
    emit TransactionSent(_txId,trans.to,trans.amount);
    return true;
  }

}