const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const PaymentStream = await hre.ethers.getContractFactory("PaymentStream");
  const paymentStream = await PaymentStream.deploy();

  await paymentStream.deployed();

  console.log("PaymentStream contract deployed to:", paymentStream.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
