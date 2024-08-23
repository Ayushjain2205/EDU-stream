const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PaymentStream", function () {
  let PaymentStream;
  let paymentStream;
  let owner;
  let recipient;
  let addr2;

  beforeEach(async function () {
    [owner, recipient, addr2] = await ethers.getSigners();

    const PaymentStreamFactory = await ethers.getContractFactory(
      "PaymentStream"
    );
    paymentStream = await PaymentStreamFactory.deploy();

    await paymentStream.waitForDeployment();
  });

  describe("createStream", function () {
    it("Should create a stream successfully", async function () {
      const deposit = ethers.parseEther("1");
      const duration = 3600; // 1 hour

      const tx = await paymentStream.createStream(
        recipient.address,
        deposit,
        duration,
        { value: deposit }
      );
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log) => log.fragment.name === "StreamCreated"
      );
      expect(event).to.not.be.undefined;

      const [
        eventRecipient,
        eventStreamId,
        eventDeposit,
        eventStartTime,
        eventEndTime,
      ] = event.args;

      expect(eventRecipient).to.equal(recipient.address);
      expect(eventStreamId).to.equal(0);
      expect(eventDeposit).to.equal(deposit);

      const block = await ethers.provider.getBlock(receipt.blockNumber);
      expect(eventStartTime).to.be.closeTo(BigInt(block.timestamp), BigInt(2));
      expect(eventEndTime).to.be.closeTo(
        BigInt(block.timestamp) + BigInt(duration),
        BigInt(2)
      );
    });

    it("Should fail if deposit doesn't match sent value", async function () {
      const deposit = ethers.parseEther("1");
      const duration = 3600; // 1 hour

      await expect(
        paymentStream.createStream(recipient.address, deposit, duration, {
          value: ethers.parseEther("0.5"),
        })
      ).to.be.revertedWith("Deposit must match the value sent");
    });
  });

  describe("withdraw", function () {
    it("Should allow withdrawal after some time", async function () {
      const deposit = ethers.parseEther("1");
      const duration = 3600; // 1 hour

      await paymentStream.createStream(recipient.address, deposit, duration, {
        value: deposit,
      });

      await ethers.provider.send("evm_increaseTime", [1800]);
      await ethers.provider.send("evm_mine");

      const balanceBefore = await ethers.provider.getBalance(recipient.address);
      const tx = await paymentStream.connect(recipient).withdraw(0);
      const receipt = await tx.wait();
      const balanceAfter = await ethers.provider.getBalance(recipient.address);

      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const expectedWithdraw = ethers.parseEther("0.5");
      const actualWithdraw = balanceAfter - balanceBefore + gasCost;

      expect(actualWithdraw).to.be.closeTo(
        expectedWithdraw,
        ethers.parseEther("0.01")
      );
    });
  });

  describe("cancelStream", function () {
    it("Should cancel stream and refund remaining balance", async function () {
      const deposit = ethers.parseEther("1");
      const duration = 3600; // 1 hour

      await paymentStream.createStream(recipient.address, deposit, duration, {
        value: deposit,
      });

      // Fast forward time by 30 minutes
      await ethers.provider.send("evm_increaseTime", [1800]);
      await ethers.provider.send("evm_mine");

      const balanceBefore = await ethers.provider.getBalance(recipient.address);
      const tx = await paymentStream.connect(recipient).cancelStream(0);
      const receipt = await tx.wait();
      const balanceAfter = await ethers.provider.getBalance(recipient.address);

      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const expectedRefund = deposit; // Expect full deposit to be refunded
      const actualRefund = balanceAfter - balanceBefore + gasCost;

      expect(actualRefund).to.be.closeTo(
        expectedRefund,
        ethers.parseEther("0.01")
      );
    });

    it("Should cancel stream and refund remaining balance after partial withdrawal", async function () {
      const deposit = ethers.parseEther("1");
      const duration = 3600; // 1 hour

      await paymentStream.createStream(recipient.address, deposit, duration, {
        value: deposit,
      });

      // Fast forward time by 30 minutes
      await ethers.provider.send("evm_increaseTime", [1800]);
      await ethers.provider.send("evm_mine");

      // Perform a withdrawal
      await paymentStream.connect(recipient).withdraw(0);

      // Fast forward time by another 15 minutes
      await ethers.provider.send("evm_increaseTime", [900]);
      await ethers.provider.send("evm_mine");

      const balanceBefore = await ethers.provider.getBalance(recipient.address);
      const tx = await paymentStream.connect(recipient).cancelStream(0);
      const receipt = await tx.wait();
      const balanceAfter = await ethers.provider.getBalance(recipient.address);

      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const expectedRefund = ethers.parseEther("0.5"); // Expect half of deposit to be refunded
      const actualRefund = balanceAfter - balanceBefore + gasCost;

      expect(actualRefund).to.be.closeTo(
        expectedRefund,
        ethers.parseEther("0.01")
      );
    });
  });

  describe("calculateBalance", function () {
    it("Should correctly calculate balance", async function () {
      const deposit = ethers.parseEther("1");
      const duration = 3600; // 1 hour

      await paymentStream.createStream(recipient.address, deposit, duration, {
        value: deposit,
      });

      await ethers.provider.send("evm_increaseTime", [1800]);
      await ethers.provider.send("evm_mine");

      const balance = await paymentStream.calculateBalance(
        recipient.address,
        0
      );
      expect(balance).to.be.closeTo(
        ethers.parseEther("0.5"),
        ethers.parseEther("0.01")
      );
    });
  });
});
