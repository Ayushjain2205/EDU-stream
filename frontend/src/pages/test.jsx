import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import PaymentStreamArtifact from "../utils/contractABI.json";

const contractAddress = "0x5a065aa2c073B4a81FBAAB6293Fdf74524fDacc5";

export default function PaymentStreamComponent() {
  const [account, setAccount] = useState("");
  const [recipient, setRecipient] = useState(
    "0x37fcE72a7397E5FDdEe880F9AAafC26d0F751782"
  );
  const [deposit, setDeposit] = useState("");
  const [duration, setDuration] = useState("");
  const [contract, setContract] = useState(null);

  useEffect(() => {
    connectWallet();
  }, []);

  useEffect(() => {
    async function fetchStreams() {
      if (contract && account) {
        const streams = await contract.streams(account, 0);
        console.log(streams);
      }
    }
    fetchStreams();
  }, [contract, account]);

  async function connectWallet() {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        const contractInstance = new ethers.Contract(
          contractAddress,
          PaymentStreamArtifact.abi,
          signer
        );
        setContract(contractInstance);
      } catch (error) {
        console.error("Failed to connect to wallet:", error);
      }
    } else {
      console.log("Please install MetaMask!");
    }
  }

  async function createStream(event) {
    event.preventDefault();
    if (!contract) return;

    try {
      const tx = await contract.createStream(
        recipient,
        ethers.utils.parseEther(deposit),
        duration,
        {
          value: ethers.utils.parseEther(deposit),
        }
      );
      await tx.wait();
      console.log("Stream created successfully!");

      // Read the created stream details
      const streamId = await contract.nextStreamId(account);
      const stream = await contract.streams(account, streamId.sub(1));

      console.log("Stream details:", {
        sender: stream.sender,
        recipient: stream.recipient,
        deposit: ethers.utils.formatEther(stream.deposit),
        // startTime: new Date(
        //   stream.startTime.mul(1000).toNumber()
        // ).toLocaleString(),
        // endTime: new Date(stream.endTime.mul(1000).toNumber()).toLocaleString(),
        ratePerSecond: ethers.utils.formatEther(stream.ratePerSecond),
        withdrawn: ethers.utils.formatEther(stream.withdrawn),
      });
    } catch (error) {
      console.error("Error creating stream:", error);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Payment Stream Creator</h1>
      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Connect Wallet
        </button>
      ) : (
        <div>
          <p className="mb-4">Connected Account: {account}</p>
          <form onSubmit={createStream} className="space-y-4">
            <div>
              <label htmlFor="recipient" className="block">
                Recipient Address:
              </label>
              <input
                id="recipient"
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full border rounded px-2 py-1"
                required
              />
            </div>
            <div>
              <label htmlFor="deposit" className="block">
                Deposit Amount (in ETH):
              </label>
              <input
                id="deposit"
                type="number"
                step="0.01"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className="w-full border rounded px-2 py-1"
                required
              />
            </div>
            <div>
              <label htmlFor="duration" className="block">
                Duration (in seconds):
              </label>
              <input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border rounded px-2 py-1"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Create Stream
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
