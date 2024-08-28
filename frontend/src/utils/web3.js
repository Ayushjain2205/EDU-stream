import { ethers } from "ethers";
import PaymentStreamArtifact from "../utils/contractABI.json";

const contractAddress = "0x66A0101be94047134bDe1A124bbFF3bF3a80042C"; // Replace with your deployed contract address
let provider, signer, contract;

// Extract the ABI from the artifact
const PaymentStreamABI = PaymentStreamArtifact.abi;

const initializeWeb3 = async () => {
  if (typeof window.ethereum !== "undefined") {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
  } else {
    throw new Error("Please install MetaMask!");
  }
  contract = new ethers.Contract(contractAddress, PaymentStreamABI, signer);
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

    console.log("Fetching streams for address:", currentAddress);

    const streams = [];

    // Fetch all StreamCreated events
    const streamCreatedFilter = contract.filters.StreamCreated();
    const allStreamEvents = await contract.queryFilter(streamCreatedFilter);

    console.log("Total stream events found:", allStreamEvents.length);

    for (const event of allStreamEvents) {
      const { recipient, streamId } = event.args;

      // Check if the current address is either the recipient or the sender
      const isIncoming =
        recipient.toLowerCase() === currentAddress.toLowerCase();
      const isOutgoing =
        event.args[0].toLowerCase() === currentAddress.toLowerCase(); // Assuming the first argument is the sender

      if (isIncoming || isOutgoing) {
        const stream = await contract.streams(
          isOutgoing ? currentAddress : recipient,
          streamId
        );
        if (stream.deposit.gt(0)) {
          const balance = await contract.calculateBalance(
            isOutgoing ? currentAddress : recipient,
            streamId
          );
          streams.push({
            id: streamId.toString(),
            sender: isOutgoing ? currentAddress : event.args[0],
            recipient: recipient,
            deposit: ethers.utils.formatEther(stream.deposit),
            startTime: stream.startTime.toString(),
            endTime: stream.endTime.toString(),
            ratePerSecond: ethers.utils.formatEther(stream.ratePerSecond),
            withdrawn: ethers.utils.formatEther(stream.withdrawn),
            remainingBalance: ethers.utils.formatEther(balance),
            isIncoming: isIncoming,
          });
        }
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
