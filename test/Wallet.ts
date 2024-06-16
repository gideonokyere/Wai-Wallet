import { loadFixture,impersonateAccount } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import {expect} from 'chai';

describe("Wallet",function(){
  let deployObject:any;

  type Signers = {
    name:string;
    addr:string;
  }

  enum TransactionApproval {
    YES,
    NO
  }

  //Deploying wallet contract
  async function deployWallet(){
    let [owner,...otherAccount] = await ethers.getSigners();
    
    const signers:Signers[] = [
      {name:"Akon",addr:`${owner.address}`},
      {name:"Iso",addr:`${otherAccount[1].address}`},
      {name:"Ivy",addr:`${otherAccount[2].address}`}
    ];

    const Wallet = await ethers.getContractFactory("Wallet");
    const wallet = await Wallet.deploy('test',2,signers);
    await wallet.waitForDeployment();
    return {owner,otherAccount,wallet,deployObject};
  }

  this.beforeAll(async()=>{
    deployObject = await loadFixture(deployWallet);
  });

  describe("Wallet Test",async function(){
    it("should failed to create a new transaction if wallet has low balance",async function(){
      const {otherAccount,wallet} = deployObject;
      const amountToSend = ethers.parseEther("50");
      await expect((wallet.newTransaction(otherAccount[4].address,amountToSend))).revertedWith("Low wallet balance");
    });

    it("Should be able to send ether to the contract",async function(){
      const {owner,wallet} = deployObject;
      const walletAddr = await wallet.getAddress();
      const tx = (await ethers.getSigner(owner.address)).sendTransaction({
        to:walletAddr,
        value:ethers.parseEther("100")
      });
      (await tx).wait();
      const walletBalance = await ethers.provider.getBalance(walletAddr);
      await expect(walletBalance).to.equal(ethers.parseEther("100"));
    });
    
    it("Signer should be able to create a new transaction",async function(){
      const {wallet,otherAccount} = deployObject;
      const amountToSend = ethers.parseEther("0.5");
      await wallet.newTransaction(otherAccount[4].address,amountToSend);
      const lastTxId = await wallet.txId();
      expect(parseInt(lastTxId)).to.equal(1,"Transaction Id should be = 1");
    });

    it("should failed if sender is not a signer",async function(){
      let {otherAccount,wallet} = deployObject;
      const amountToSend = ethers.parseEther("1");
      await expect(wallet.connect(otherAccount[3]).newTransaction(otherAccount[4].address,amountToSend)).revertedWith("Not a signer");
    });

    it("Only signers should be able to sign a transaction",async function(){
      const {wallet,otherAccount} = deployObject;
      const txId = await wallet.txId();
      await expect(wallet.connect(otherAccount[3]).signAndExcuteTransaction(txId,TransactionApproval.YES)).revertedWith("Not a signer");
    });

    it("All signers should be able to sign a transaction",async function(){
      const {wallet,otherAccount} = deployObject;
      const beforeBalance = await ethers.provider.getBalance(otherAccount[4].address);
      //All signers approving the transaction
      const txId = await wallet.txId();
      await wallet.signAndExcuteTransaction(txId,TransactionApproval.YES);
      await wallet.connect(otherAccount[1]).signAndExcuteTransaction(txId,TransactionApproval.YES);
      const transactionStatus = await wallet.transactions(txId);
      expect(await ethers.provider.getBalance(transactionStatus[2])).equal(transactionStatus[1] + beforeBalance);
    });

    it("Signer should not be able to sign an excuted transaction",async function(){
      const {wallet} = deployObject;
      const txId = await wallet.txId();
      await expect(wallet.signAndExcuteTransaction(txId,TransactionApproval.YES)).revertedWith("Transaction already excuted");
    });

    it("Signers should be able to vote against a transaction",async function(){
      const {wallet,otherAccount} = deployObject;
      await wallet.newTransaction(otherAccount[6].address,ethers.parseEther("1"));
      const beforeTx = await ethers.provider.getBalance((await wallet.getAddress()));
      const txId = await wallet.txId();
      await wallet.connect(otherAccount[1]).signAndExcuteTransaction(txId,TransactionApproval.NO);
      await wallet.connect(otherAccount[2]).signAndExcuteTransaction(txId,TransactionApproval.NO);
      expect(await ethers.provider.getBalance((await wallet.getAddress()))).equal(beforeTx,"Unmatch Balance");
    });

    it("Only admin should be able to add a signer",async function(){
      const {wallet,otherAccount} = deployObject;
      await expect(wallet.connect(otherAccount[1]).addSigner("test3",otherAccount[9].address)).revertedWith("Only admin can add a signer");
    })

  });

})