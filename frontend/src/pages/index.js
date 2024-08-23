import { useState, useEffect, useCallback } from "react";
import CreateStream from "../components/CreateStream";
import StreamList from "../components/StreamList";
import { connectWallet, getAccount, getActiveStreams } from "../utils/web3";

export default function Home() {
  const [account, setAccount] = useState(null);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const handleAccountsChanged = useCallback(
    async (accounts) => {
      if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts
        setAccount(null);
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
      }
    },
    [account]
  );

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

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, [handleAccountsChanged]);

  useEffect(() => {
    if (account) {
      fetchStreams();
    }
  }, [account, fetchStreams]);

  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      const connectedAccount = await connectWallet();
      setAccount(connectedAccount);
    } catch (err) {
      console.error("Connection error:", err);
      setError("Failed to connect wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4">Payment Streaming App</h1>
      <button
        onClick={handleConnectWallet}
        className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        disabled={loading}
      >
        {account ? "Switch Account" : "Connect Wallet"}
      </button>
      {account && <p className="mb-4">Connected: {account}</p>}
      {account ? (
        <>
          <div className="flex flex-col items-center mb-8">
            <CreateStream onStreamCreated={fetchStreams} />
          </div>

          {loading ? (
            <div>Loading streams...</div>
          ) : error ? (
            <div>
              <p className="text-red-500">Error: {error}</p>
              <button
                onClick={fetchStreams}
                className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Retry
              </button>
            </div>
          ) : (
            <StreamList streams={streams} onStreamUpdate={fetchStreams} />
          )}
        </>
      ) : (
        <p>Please connect your wallet to use the app.</p>
      )}
    </div>
  );
}
