// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PaymentStream {
    struct Stream {
        uint256 deposit;
        uint256 startTime;
        uint256 endTime;
        uint256 ratePerSecond;
        uint256 withdrawn;
    }

    mapping(address => mapping(uint256 => Stream)) public streams;
    mapping(address => uint256) public nextStreamId;

    event StreamCreated(
        address indexed recipient,
        uint256 streamId,
        uint256 deposit,
        uint256 startTime,
        uint256 endTime
    );
    event Withdraw(address indexed recipient, uint256 streamId, uint256 amount);
    event StreamCancelled(
        address indexed recipient,
        uint256 streamId,
        uint256 refundAmount
    );

    function createStream(
        address recipient,
        uint256 deposit,
        uint256 duration
    ) external payable {
        require(msg.value == deposit, "Deposit must match the value sent");
        require(deposit > 0, "Deposit must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");

        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;
        uint256 ratePerSecond = deposit / duration;

        uint256 streamId = nextStreamId[recipient];
        streams[recipient][streamId] = Stream({
            deposit: deposit,
            startTime: startTime,
            endTime: endTime,
            ratePerSecond: ratePerSecond,
            withdrawn: 0
        });

        nextStreamId[recipient]++;

        emit StreamCreated(recipient, streamId, deposit, startTime, endTime);
    }

    function withdraw(uint256 streamId) external {
        Stream storage stream = streams[msg.sender][streamId];
        require(stream.deposit > 0, "No active stream");

        uint256 balance = calculateBalance(msg.sender, streamId);
        require(balance > 0, "No balance to withdraw");

        stream.withdrawn += balance;
        payable(msg.sender).transfer(balance);

        emit Withdraw(msg.sender, streamId, balance);
    }

    function calculateBalance(
        address recipient,
        uint256 streamId
    ) public view returns (uint256) {
        Stream storage stream = streams[recipient][streamId];
        if (block.timestamp >= stream.endTime) {
            return stream.deposit - stream.withdrawn;
        } else {
            uint256 elapsedTime = block.timestamp - stream.startTime;
            uint256 earned = elapsedTime * stream.ratePerSecond;
            return earned - stream.withdrawn;
        }
    }

    function cancelStream(uint256 streamId) external {
        Stream storage stream = streams[msg.sender][streamId];
        require(stream.deposit > 0, "No active stream");

        uint256 remainingBalance = stream.deposit - stream.withdrawn;
        delete streams[msg.sender][streamId];

        payable(msg.sender).transfer(remainingBalance);

        emit StreamCancelled(msg.sender, streamId, remainingBalance);
    }

    receive() external payable {}
}
