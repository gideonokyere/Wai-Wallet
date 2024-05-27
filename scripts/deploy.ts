import {ethers} from 'hardhat';

async function deploy(){
  const Wallet = await ethers.getContractFactory("WalletFactory");
  console.log("********** Deploying Contracts *************");
  const wallet = await Wallet.deploy();
  await wallet.waitForDeployment();
  console.log("Wallet Deployed at: ",await wallet.getAddress());
}

deploy().catch((error)=>{
  console.log(error);
  process.exitCode = 1;
})