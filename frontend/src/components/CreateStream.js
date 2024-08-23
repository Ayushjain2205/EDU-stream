import { useState } from "react";
import { createStream } from "../utils/web3";

export default function CreateStream({ onStreamCreated }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createStream(recipient, amount, duration);
      setRecipient("");
      setAmount("");
      setDuration("");
      if (onStreamCreated) {
        await onStreamCreated();
      }
    } catch (error) {
      console.error("Error creating stream:", error);
      alert("Failed to create stream. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        disabled={isCreating}
      />
      <input
        type="number"
        placeholder="Amount (in ETH)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={isCreating}
      />
      <input
        type="number"
        placeholder="Duration (in seconds)"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        disabled={isCreating}
      />
      <button type="submit" disabled={isCreating}>
        {isCreating ? "Creating..." : "Create Stream"}
      </button>
    </form>
  );
}
