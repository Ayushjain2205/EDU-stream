import { ethers } from "ethers";
import PaymentStreamABI from "../utils/contractABI.json";

const contractAddress = "0xD5F6A5634f9B3AD47E1dcBAcFC4dAfA67b30c696";
let provider, signer, contract;

const initializeWeb3 = async () => {
  if (typeof window.ethereum !== "undefined") {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
  } else {
    // Fallback to local provider if MetaMask is not available
    provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    const accounts = await provider.listAccounts();
    signer = provider.getSigner(accounts[0]);
  }
  contract = new ethers.Contract(contractAddress, PaymentStreamABI.abi, signer);
};

export const connectWallet = async () => {
  if (typeof window.ethereum !== "undefined") {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await initializeWeb3();
      return await signer.getAddress();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw new Error("Failed to connect wallet. Please try again.");
    }
  } else {
    throw new Error("Please install MetaMask!");
  }
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

    console.log("Fetching streams for recipient:", currentAddress);
    console.log("Total stream count:", streamCount.toString());

    const streams = [];
    for (let i = 0; i < streamCount; i++) {
      const stream = await contract.streams(currentAddress, i);

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
          canWithdraw: true,
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
  try {
    const tx = await contract.withdraw(streamId);
    await tx.wait();
    console.log(`Successfully withdrawn from stream ${streamId}`);
  } catch (error) {
    console.error(`Error withdrawing from stream ${streamId}:`, error);
    throw new Error(`Failed to withdraw: ${error.message}`);
  }
};

export const cancelStream = async (streamId) => {
  if (!contract) await initializeWeb3();
  const tx = await contract.cancelStream(streamId);
  await tx.wait();
};

export const listenToAccountChanges = (callback) => {
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length > 0) {
        initializeWeb3().then(() => callback(accounts[0]));
      } else {
        callback(null);
      }
    });
  }
};
