import React from "react";
import { withdrawFromStream } from "../utils/web3";

export default function StreamList({ streams, onStreamUpdate }) {
  const handleWithdraw = async (streamId) => {
    try {
      await withdrawFromStream(streamId);
      if (onStreamUpdate) {
        onStreamUpdate();
      }
    } catch (error) {
      console.error("Withdrawal failed:", error);
      alert("Failed to withdraw. Please try again.");
    }
  };

  if (!streams || streams.length === 0) {
    return <p>No active streams found.</p>;
  }

  return (
    <div className="flex flex-col items-center">
      <h2>Active Streams</h2>
      {streams.map((stream) => (
        <div key={stream.id} className="mb-4">
          <p>Stream ID: {stream.id}</p>
          <p>Deposit: {stream.deposit} ETH</p>
          <p>
            Start Time:{" "}
            {new Date(Number(stream.startTime) * 1000).toLocaleString()}
          </p>
          <p>
            End Time: {new Date(Number(stream.endTime) * 1000).toLocaleString()}
          </p>
          <p>Withdrawn: {stream.withdrawn} ETH</p>
          <p>Remaining Balance: {stream.remainingBalance} ETH</p>
          {stream.isReceiver && (
            <button onClick={() => handleWithdraw(stream.id)}>Withdraw</button>
          )}
        </div>
      ))}
    </div>
  );
}
