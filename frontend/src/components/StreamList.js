import React, { useState, useEffect } from "react";
import { withdrawFromStream, cancelStream } from "../utils/web3";
import { ethers } from "ethers";

export default function StreamList({ streams, onStreamUpdate }) {
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("StreamList rendered with streams:", streams);
  }, [streams]);

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

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  if (!streams) {
    return <p>Loading streams...</p>;
  }

  const incomingStreams = streams.filter((stream) => stream.isIncoming);
  const outgoingStreams = streams.filter((stream) => !stream.isIncoming);

  console.log("Incoming streams:", incomingStreams);
  console.log("Outgoing streams:", outgoingStreams);

  const renderStream = (stream) => {
    try {
      const remainingBalance = ethers.utils.parseEther(stream.remainingBalance);
      const hasRemainingBalance = !remainingBalance.isZero();

      return (
        <div key={stream.id} className="border p-4 mb-4 rounded">
          <p>Stream ID: {stream.id}</p>
          <p>From: {stream.sender}</p>
          <p>To: {stream.recipient}</p>
          <p>Deposit: {parseFloat(stream.deposit).toFixed(6)} ETH</p>
          <p>
            Start Time:{" "}
            {new Date(parseInt(stream.startTime) * 1000).toLocaleString()}
          </p>
          <p>
            End Time:{" "}
            {new Date(parseInt(stream.endTime) * 1000).toLocaleString()}
          </p>
          <p>Withdrawn: {parseFloat(stream.withdrawn).toFixed(6)} ETH</p>
          <p>
            Remaining Balance: {parseFloat(stream.remainingBalance).toFixed(6)}{" "}
            ETH
          </p>
          {stream.isIncoming && hasRemainingBalance && (
            <button
              onClick={() => handleWithdraw(stream.id)}
              className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Withdraw
            </button>
          )}
          {!stream.isIncoming && (
            <button
              onClick={() => handleCancel(stream.id)}
              className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Cancel Stream
            </button>
          )}
        </div>
      );
    } catch (renderError) {
      console.error("Error rendering stream:", renderError, stream);
      return (
        <p key={stream.id} className="text-red-500">
          Error rendering stream {stream.id}
        </p>
      );
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Active Streams</h2>

      <h3 className="text-lg font-semibold mb-2">
        Incoming Streams ({incomingStreams.length})
      </h3>
      {incomingStreams.length > 0 ? (
        incomingStreams.map(renderStream)
      ) : (
        <p>No incoming streams found.</p>
      )}

      <h3 className="text-lg font-semibold mb-2 mt-6">
        Outgoing Streams ({outgoingStreams.length})
      </h3>
      {outgoingStreams.length > 0 ? (
        outgoingStreams.map(renderStream)
      ) : (
        <p>No outgoing streams found.</p>
      )}

      {streams.length === 0 && <p className="mt-4">No active streams found.</p>}
    </div>
  );
}
