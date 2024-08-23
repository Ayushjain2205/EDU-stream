import React from "react";
import { withdrawFromStream, cancelStream } from "../utils/web3";
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

  const handleCancel = async (streamId) => {
    try {
      await cancelStream(streamId);
      alert("Stream cancelled successfully!");
      onStreamUpdate();
    } catch (error) {
      console.error("Cancellation failed:", error);
      alert("Failed to cancel stream. Please try again.");
    }
  };

  if (!streams || streams.length === 0) {
    return <p>No active streams found.</p>;
  }

  const incomingStreams = streams.filter((stream) => stream.isIncoming);
  const outgoingStreams = streams.filter((stream) => !stream.isIncoming);

  const renderStream = (stream, isIncoming) => {
    const remainingBalance = ethers.utils.parseEther(stream.remainingBalance);
    const hasRemainingBalance = !remainingBalance.isZero();

    return (
      <div key={stream.id} className="border p-4 mb-4 rounded">
        <p>Stream ID: {stream.id}</p>
        <p>
          {isIncoming ? "From" : "To"}: {stream.recipient}
        </p>
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
        {isIncoming && hasRemainingBalance && (
          <button
            onClick={() => handleWithdraw(stream.id)}
            className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Withdraw
          </button>
        )}
        {!isIncoming && (
          <button
            onClick={() => handleCancel(stream.id)}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Cancel Stream
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Active Streams</h2>

      <h3 className="text-lg font-semibold mb-2">Incoming Streams</h3>
      {incomingStreams.length > 0 ? (
        incomingStreams.map((stream) => renderStream(stream, true))
      ) : (
        <p>No incoming streams found.</p>
      )}

      <h3 className="text-lg font-semibold mb-2 mt-6">Outgoing Streams</h3>
      {outgoingStreams.length > 0 ? (
        outgoingStreams.map((stream) => renderStream(stream, false))
      ) : (
        <p>No outgoing streams found.</p>
      )}
    </div>
  );
}
