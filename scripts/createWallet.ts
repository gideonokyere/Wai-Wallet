import {ethers} from "hardhat";

async function createWallet(){
  const contractAddress = "0x01aa19bc4dc044718aDEADb349212F5e6fc154F7";
  const WalletFactory = await ethers.getContractAt("WalletFactory",`${contractAddress}`);

  const [owner,...otherAccount] = await ethers.getSigners();
  
  const signers = [
    {name:"Akon",addr:`${owner.address}`},
    {name:"Iso",addr:"0x7855b41E4beC4Ff0ea347C75Fb2055e4F6C9d3b1"},
    {name:"Ivy",addr:"0xd1e1BF0117b36B9dDf9a9Ff8cEf1DDd2bd9ac2c2"}
  ];

  await WalletFactory.createWallet("Bluechain",2,signers);
  console.log("Wallet Created");
}

createWallet().catch((error)=>{
  console.log(error);
  process.exitCode = 1;
})