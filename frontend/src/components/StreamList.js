import React from "react";

export default function StreamList({ streams }) {
  if (!streams || streams.length === 0) {
    return <p>No active streams found.</p>;
  }

  return (
    <div>
      <h2>Active Streams</h2>
      {streams.map((stream) => (
        <div key={stream.id}>
          <p>Stream ID: {stream.id}</p>
          <p>Deposit: {stream.deposit} ETH</p>
          <p>
            Start Time: {new Date(stream.startTime * 1000).toLocaleString()}
          </p>
          <p>End Time: {new Date(stream.endTime * 1000).toLocaleString()}</p>
          <p>Withdrawn: {stream.withdrawn} ETH</p>
          <p>Remaining Balance: {stream.remainingBalance} ETH</p>
        </div>
      ))}
    </div>
  );
}
