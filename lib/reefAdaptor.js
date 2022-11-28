import getContract from "./getContracts";
import { BigNumber } from "ethers";
import { toast } from "react-toastify";
import contractAddress from "./getContracts";
import getReef from "./getReef";
import { getSigner, getMnemonicSigner_serverSideOnly } from "./signerUtil.ts";

let signer, inventory, token;

const initializeReef = async () => {
  const reefSigner = await getReef();
  console.log(reefSigner);
  reefSigner.subscribeSelectedAccountSigner(async (sig) => {
    try {
      if (!sig) {
        throw new Error(
          "Create account in Reef extension or make selected account visible."
        );
      }
      signer = sig;
      setContracts();
      let substrateAddress = await sig?.getSubstrateAddress();
      address = substrateAddress;
    } catch (err) {
      errorMsg(err);
    }
  });
  return reefSigner;
};

async function isSelectedAddress(addr, selectedSigner) {
  const selAddr = await selectedSigner.getSubstrateAddress();
  if (addr !== selAddr) {
    return false;
  }
  return true;
}

const errorMsg = (message) => {
  toast.error(message);
};

const successMsg = (message) => {
  toast.success(message);
};

async function setContracts() {
  const contracts = await getContract(signer);
  inventory = contracts.inventory;
  token = contracts.token;
}

async function getTokenBalance() {
  const token = (await getContract(signer)).token;
  try {
    var tokenBalance = await token.balanceOf(await signer.getAddress());
    return tokenBalance.toString();
  } catch (error) {
    errorMsg(error?.message ?? error);
  }
}

async function mint(token_id, price) {
  const inventory = (await getContract(signer)).inventory;
  console.log(Object.getOwnPropertyNames(inventory));
  successMsg("Transaction Started");
  try {
    await inventory["mint(uint256)"](BigNumber.from(token_id.toString()), {
      value: BigNumber.from(price.toString()),
    });
    successMsg("Transaction Successfully");
  } catch (error) {
    errorMsg(error?.data?.message ?? error.message);
  }
}

async function mintWithToken(token_id) {
  const inventory = (await getContract(signer)).inventory;
  successMsg("Transaction Started");
  try {
    console.log("mint with token");
    await inventory["mint(uint256)"](token_id);
    successMsg("Transaction Successfully");
  } catch (error) {
    errorMsg(error?.data?.message ?? error.message);
  }
}

async function mintToken(val, account) {
  const signer = await getMnemonicSigner_serverSideOnly();
  console.log(account);
  const token = (await getContract(signer)).token;
  console.log(token);
  try {
    let res = await token.mint(account, val);
    console.log(res);
  } catch (error) {
    console.log(error);
  }
}

async function getURI(token_id) {
  const inventory = (await getContract(signer)).inventory;
  var uri = await inventory.uri(token_id);
  return uri;
}
async function getPrices(token_id) {
  const inventory = (await getContract(signer)).inventory;
  var prices = await inventory.getPrice(token_id);
  return prices;
}

const mint_by_owner = async () => {
  console.log("mint by owner");
  const inventory = (await getContract(signer)).inventory;

  for (let index = 0; index < 13; index++) {
    let value = Math.random();
    let price = value * 10 * 10 ** 18;
    let trt = 100 * value;
    if (index < 9) {
      console.log("minting tank", index + 1);
    } else {
      price /= 10;
      trt /= 10;
      console.log("minting bullet", index + 1 - 9);
    }
    console.log(Object.getOwnPropertyNames(inventory));
    var transaction = await inventory["mint(uint256,uint256)"](
      BigNumber.from(Math.round(price).toString()),
      Math.round(trt).toString()
    );
    await new Promise((r) => setTimeout(r, 2000));
    console.log(transaction);
  }
};

async function getAddress() {
  return await signer.getAddress();
}

export {
  initializeReef,
  mint,
  mintWithToken,
  getTokenBalance,
  mint_by_owner,
  mintToken,
  getURI,
  getPrices,
  getAddress,
};
