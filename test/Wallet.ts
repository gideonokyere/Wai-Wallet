import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
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
    const [owner,...otherAccount] = await ethers.getSigners();
    
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
    
    // it("Signer should be able to create a new transaction",async function(){
    //   const {wallet,otherAccount} = deployObject;
    //   const amountToSend = ethers.parseEther("50");
    //   const tx = await wallet.newTransaction(otherAccount[4].address,amountToSend);
    // });
  });

})