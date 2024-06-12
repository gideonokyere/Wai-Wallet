import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks:{
    ganache:{
      url:process.env.GANACHE_URL,
      accounts:[`${process.env.GANACHE_KEY}`]
    }
  }
};

export default config;
