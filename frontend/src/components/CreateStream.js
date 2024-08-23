import { useState } from "react";
import { createStream } from "../utils/web3";

export default function CreateStream({ onStreamCreated }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");
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
      setError(
        "Failed to create stream. Please check the console for more details."
      );
      alert("Failed to create stream. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-4">Create New Stream</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="recipient"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Recipient Address
          </label>
          <input
            id="recipient"
            type="text"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={isCreating}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div>
          <label
            htmlFor="amount"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Amount (in ETH)
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isCreating}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div>
          <label
            htmlFor="duration"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Duration (in seconds)
          </label>
          <input
            id="duration"
            type="number"
            placeholder="3600"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            disabled={isCreating}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isCreating}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              isCreating ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isCreating ? "Creating..." : "Create Stream"}
          </button>
        </div>
      </form>
    </div>
  );
}
