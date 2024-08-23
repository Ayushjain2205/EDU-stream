import React from "react";
import { withdrawFromStream } from "../utils/web3";
import { ethers } from "ethers";

export default function StreamList({ streams, onStreamUpdate }) {
  const handleWithdraw = async (streamId) => {
    try {
      await withdrawFromStream(streamId);
      alert("Withdrawal successful!");
      onStreamUpdate();
    } catch (error) {
      console.error("Withdrawal failed:", error);
      alert("Failed to withdraw. Please try again.");
    }
  };

  if (!streams || streams.length === 0) {
    return <p>No active streams found.</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Active Streams</h2>
      {streams.map((stream) => {
        const remainingBalance = ethers.utils.parseEther(
          stream.remainingBalance
        );
        const hasRemainingBalance = !remainingBalance.isZero();

        return (
          <div key={stream.id} className="border p-4 mb-4 rounded">
            <p>Stream ID: {stream.id}</p>
            <p>Deposit: {stream.deposit} ETH</p>
            <p>
              Start Time:{" "}
              {new Date(Number(stream.startTime) * 1000).toLocaleString()}
            </p>
            <p>
              End Time:{" "}
              {new Date(Number(stream.endTime) * 1000).toLocaleString()}
            </p>
            <p>Withdrawn: {stream.withdrawn} ETH</p>
            <p>Remaining Balance: {stream.remainingBalance} ETH</p>
            {stream.canWithdraw && hasRemainingBalance && (
              <button
                onClick={() => handleWithdraw(stream.id)}
                className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Withdraw
              </button>
            )}
            {stream.canWithdraw && !hasRemainingBalance && (
              <p className="mt-2 text-gray-500">All funds withdrawn</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
