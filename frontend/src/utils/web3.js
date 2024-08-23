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

    console.log("Fetching streams for address:", currentAddress);

    const streams = [];

    // Fetch all streams created by or for the current address
    const streamCreatedFilter = contract.filters.StreamCreated(null, null);
    const allStreamEvents = await contract.queryFilter(streamCreatedFilter);

    console.log("Total stream events found:", allStreamEvents.length);

    for (const event of allStreamEvents) {
      try {
        const { recipient, streamId, deposit, startTime, endTime } = event.args;

        console.log("Processing stream event:", {
          recipient,
          streamId: streamId.toString(),
          deposit: ethers.utils.formatEther(deposit),
          startTime: startTime.toString(),
          endTime: endTime.toString(),
        });

        if (!recipient) {
          console.warn("Skipping stream with undefined recipient");
          continue;
        }

        // Retrieve the stream details from the contract
        const stream = await contract.streams(recipient, streamId);
        const balance = await contract.calculateBalance(recipient, streamId);

        const isIncoming =
          recipient.toLowerCase() === currentAddress.toLowerCase();

        // Include the stream if the current address is either the recipient
        // or if it's not the recipient (assuming it's the sender in this case)
        if (isIncoming || (!isIncoming && stream.deposit.gt(0))) {
          streams.push({
            id: streamId.toNumber(),
            sender: isIncoming ? "Unknown" : currentAddress,
            recipient: recipient,
            deposit: ethers.utils.formatEther(deposit),
            startTime: startTime.toString(),
            endTime: endTime.toString(),
            ratePerSecond: ethers.utils.formatEther(stream.ratePerSecond),
            withdrawn: ethers.utils.formatEther(stream.withdrawn),
            remainingBalance: ethers.utils.formatEther(balance),
            isIncoming: isIncoming,
          });

          console.log("Stream added:", streams[streams.length - 1]);
        }
      } catch (eventError) {
        console.error("Error processing stream event:", eventError);
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
