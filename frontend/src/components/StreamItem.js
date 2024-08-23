import { useState, useEffect } from "react";
import { withdrawFromStream, cancelStream } from "../utils/web3";

export default function StreamItem({ stream }) {
  const [remainingBalance, setRemainingBalance] = useState(
    stream.remainingBalance
  );

  useEffect(() => {
    const timer = setInterval(() => {
      // Update remaining balance in real-time
      setRemainingBalance(calculateRemainingBalance(stream));
    }, 1000);

    return () => clearInterval(timer);
  }, [stream]);

  const handleWithdraw = async () => {
    try {
      await withdrawFromStream(stream.id);
      // Update stream data after withdrawal
    } catch (error) {
      console.error("Error withdrawing:", error);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelStream(stream.id);
      // Remove stream from list or update its status
    } catch (error) {
      console.error("Error cancelling stream:", error);
    }
  };

  return (
    <div>
      <p>Recipient: {stream.recipient}</p>
      <p>Total Amount: {stream.deposit} ETH</p>
      <p>Remaining: {remainingBalance} ETH</p>
      <button onClick={handleWithdraw}>Withdraw</button>
      <button onClick={handleCancel}>Cancel Stream</button>
    </div>
  );
}
