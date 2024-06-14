import { loadFixture,impersonateAccount } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import {expect} from 'chai';

describe("Wallet",function(){
  let deployObject:any;

  type Signers = {
    name:string;
    addr:string;
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
      const amountToSend = ethers.parseEther("1");
      await wallet.newTransaction(otherAccount[4].address,amountToSend);
      const lastTxId = await wallet.txId();
      expect(parseInt(lastTxId)).to.equal(1,"Transaction Id should be = 1");
    });

    it("should failed if sender is not a signer",async function(){
      let {otherAccount,wallet} = deployObject;
      const amountToSend = ethers.parseEther("1");
      await expect(wallet.connect(otherAccount[3]).newTransaction(otherAccount[4].address,amountToSend)).revertedWith("Not a signer");
    });

  });

})