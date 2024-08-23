import React from "react";
import { client } from "../utils/client";
import { ConnectButton, TransactionButton } from "thirdweb/react";

import { getContract, prepareContractCall } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { defineChain } from "thirdweb";

import { useSendTransaction } from "thirdweb/react";

import contractABI from "../utils/contractABI.json";

export const contract = getContract({
  client,
  chain: defineChain(11155111),
  address: "0xD5F6A5634f9B3AD47E1dcBAcFC4dAfA67b30c696",
});

// Ensure useSendTransaction is called within a functional component or custom hook
const test = () => {
  const { mutate: sendTransaction } = useSendTransaction();

  const onClick = async () => {
    const transaction = prepareContractCall({
      contract,
      method: "createStream",
      params: ["0x37fcE72a7397E5FDdEe880F9AAafC26d0F751782", 0.1, 600], // type safe params
    });
    sendTransaction(transaction);
    console.log("done");
  };

  return (
    <div>
      <ConnectButton client={client} />
      {/* <button onClick={onClick}>Create Stream</button> */}
      <TransactionButton
        transaction={() => {
          prepareContractCall({
            contract: contract,
            method: "createStream",
            params: ["0x37fcE72a7397E5FDdEe880F9AAafC26d0F751782", 0.1, 600],
          });
        }}
        onError={(error) => {
          console.log(error);
        }}
      >
        Create Stream
      </TransactionButton>
    </div>
  );
};

export default test;
