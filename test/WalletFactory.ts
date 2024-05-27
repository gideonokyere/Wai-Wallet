import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {ethers} from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";

describe("Wallet Factory",function(){

  let deployObject: any;

  async function deployContract(){
    const [owner,...otherAccount] = await ethers.getSigners();
    console.log("********** Deployong Contracts *************");
    const WalletFactory = await ethers.getContractFactory("WalletFactory");
    const walletFactory = await WalletFactory.deploy();
    await walletFactory.waitForDeployment();
    return {owner,otherAccount,walletFactory,deployObject};
  };

  this.beforeAll(async()=>{
    deployObject = await loadFixture(deployContract);
  });

  type Signers = {
    name:string;
    addr:string;
  }

  describe("Wallet Factory Testing",async function(){

    it("Should be able to create new wallets",async()=>{
      const {owner,otherAccount,walletFactory} = deployObject;
      const signers:Signers[] = [
        {name:"Akon",addr:`${owner.address}`},
        {name:"Iso",addr:`${otherAccount[1].address}`},
        {name:"Ivy",addr:`${otherAccount[2].address}`}
      ];
      await walletFactory.createWallet("Gift",2,signers);
      await walletFactory.createWallet("Transport",3,signers);
      await walletFactory.createWallet("Air Ticket",1,signers);
      expect( (await walletFactory.userWallets(owner,0)).includes("Gift")).to.be.true;
    });

    it("Should be able to get all user wallets",async function(){
      const {walletFactory} = deployObject;
      const wallets = await walletFactory.getWallets();
      expect(wallets.length).equal(3,"user should have three wallets");
    });

    it("Should return wallet signers",async function(){
      const {walletFactory} = deployObject;
      const wallets = await walletFactory.getWallets();
      const walletAddress = wallets[0][1];
      const Wallet = await ethers.getContractAt("Wallet",`${walletAddress}`);
      const signersCount = await Wallet.numSigners();
      const walletSigners = (await Wallet.getWalletSigners()).length;
      expect(walletSigners).eql(signersCount,"Must be equal to signersCount");
    });

    it("Should failed if no signers are provided",async function(){
      const {walletFactory} = await loadFixture(deployContract);
      const signers:any = [];
      await expect(walletFactory.createWallet("Gift",2,signers)).revertedWith("please provide signers");
    });

    it("should failed if numbers confirmation more then signers",async function(){
      const {owner,otherAccount,walletFactory} = await loadFixture(deployContract);
      const signers:Signers[] = [
        {name:"Akon",addr:`${owner.address}`},
        {name:"Iso",addr:`${otherAccount[1].address}`},
        {name:"Ivy",addr:`${otherAccount[2].address}`}
      ];
      await expect(walletFactory.createWallet("BlueChain",signers.length+1,signers)).revertedWith("number of confirmations higher then signers");
    });

  });

})