import { ethers } from "ethers";
import PaymentStreamABI from "../utils/contractABI.json";

const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3"; // Replace with the address from step 3
let provider, signer, contract;

const initializeWeb3 = async () => {
  // Connect to the local Hardhat network
  provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

  // Get the first account from the local network
  const accounts = await provider.listAccounts();
  signer = provider.getSigner(accounts[0]);

  contract = new ethers.Contract(contractAddress, PaymentStreamABI.abi, signer);
};

export const connectWallet = async () => {
  await initializeWeb3();
  return await signer.getAddress();
};

export const getAccount = async () => {
  if (!signer) {
    await initializeWeb3();
  }
  return await signer.getAddress();
};

export const createStream = async (recipient, amount, duration) => {
  if (!contract) await initializeWeb3();
  const tx = await contract.createStream(
    recipient,
    ethers.utils.parseEther(amount),
    duration,
    {
      value: ethers.utils.parseEther(amount),
    }
  );
  await tx.wait();
};

export const getActiveStreams = async () => {
  try {
    if (!contract) await initializeWeb3();

    const currentAddress = await signer.getAddress();
    const streamCount = await contract.nextStreamId(currentAddress);

    console.log("Fetching streams for address:", currentAddress);
    console.log("Total stream count:", streamCount.toString());

    const streams = [];
    for (let i = 0; i < streamCount; i++) {
      const stream = await contract.streams(currentAddress, i);

      // Check if the stream is active (has a non-zero deposit)
      if (stream.deposit.gt(0)) {
        const balance = await contract.calculateBalance(currentAddress, i);

        streams.push({
          id: i,
          deposit: ethers.utils.formatEther(stream.deposit),
          startTime: stream.startTime.toString(),
          endTime: stream.endTime.toString(),
          ratePerSecond: ethers.utils.formatEther(stream.ratePerSecond),
          withdrawn: ethers.utils.formatEther(stream.withdrawn),
          remainingBalance: ethers.utils.formatEther(balance),
        });
      }
    }

    console.log("Active streams fetched:", streams);
    return streams;
  } catch (error) {
    console.error("Error in getActiveStreams:", error);
    throw new Error(`Failed to fetch streams: ${error.message}`);
  }
};

export const withdrawFromStream = async (streamId) => {
  if (!contract) await initializeWeb3();
  const tx = await contract.withdraw(streamId);
  await tx.wait();
};

export const cancelStream = async (streamId) => {
  if (!contract) await initializeWeb3();
  const tx = await contract.cancelStream(streamId);
  await tx.wait();
};
