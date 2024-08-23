import { useState, useEffect, useCallback } from "react";
import CreateStream from "../components/CreateStream";
import StreamList from "../components/StreamList";
import { connectWallet, getAccount, getActiveStreams } from "../utils/web3";

export default function Home() {
  const [account, setAccount] = useState(null);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStreams = useCallback(async () => {
    if (!account) return;
    try {
      setLoading(true);
      setError(null);
      const activeStreams = await getActiveStreams();
      setStreams(activeStreams);
    } catch (err) {
      console.error("Error fetching streams:", err);
      setError(err.message || "Failed to fetch streams. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    const init = async () => {
      try {
        const currentAccount = await getAccount();
        setAccount(currentAccount);
      } catch (err) {
        console.error("Initialization error:", err);
        setError(
          "Failed to initialize. Please make sure you're connected to the correct network."
        );
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (account) {
      fetchStreams();
    }
  }, [account, fetchStreams]);

  const handleConnectWallet = async () => {
    try {
      const connectedAccount = await connectWallet();
      setAccount(connectedAccount);
    } catch (err) {
      console.error("Connection error:", err);
      setError("Failed to connect wallet. Please try again.");
    }
  };

  return (
    <div className="w-full">
      <h1>Payment Streaming App</h1>
      {account ? (
        <>
          <div className="flex flex-col items-center mb-8">
            <p>Connected: {account}</p>
            <CreateStream onStreamCreated={fetchStreams} />
          </div>

          {loading ? (
            <div>Loading streams...</div>
          ) : error ? (
            <div>
              <p>Error: {error}</p>
              <button onClick={fetchStreams}>Retry</button>
            </div>
          ) : (
            <StreamList streams={streams} onStreamUpdate={fetchStreams} />
          )}
        </>
      ) : (
        <button onClick={handleConnectWallet}>Connect Wallet</button>
      )}
    </div>
  );
}
