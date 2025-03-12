const NFTAuction = artifacts.require("NFTAuction");
const TestNFT = artifacts.require("TestNFT");

contract("NFTAuction", accounts => {
    let testNFT, nftAuction;
    const owner = accounts[0];
    const bidder = accounts[1];
    const otherBidder = accounts[2];

    beforeEach(async () => {
        testNFT = await TestNFT.new({ from: owner });
        nftAuction = await NFTAuction.new({ from: owner });
        
        // Mint một NFT đơn giản cho test
        await testNFT.mint(owner, 0);
        await testNFT.approve(nftAuction.address, 0, { from: owner });
    });

    it("should create an auction and accept a valid bid", async () => {
        await nftAuction.createAuction(testNFT.address, 0, web3.utils.toWei("1", "ether"), 1, { from: owner });
        // Bidder places a bid with 2 ETH
        await nftAuction.bid(1, { from: bidder, value: web3.utils.toWei("2", "ether") });

        // Retrieve auction details
        const auction = await nftAuction.auctions(1);
        assert.equal(auction.highestBidder, bidder, "Highest bidder should be set to bidder");
    });

    it("should not accept a bid below the start price", async () => {
        await nftMinting.mintNFT({ from: owner });
        await nftMinting.approve(nftAuction.address, 0, { from: owner });

        await nftAuction.createAuction(nftMinting.address, 0, web3.utils.toWei("1", "ether"), 1, { from: owner });
    
        try {
            await nftAuction.bid(1, { from: bidder, value: web3.utils.toWei("0.5", "ether") });
            assert.fail("Bid should not be accepted");
        } catch (error) {
            assert(error.message.includes("Bid must be greater than or equal to the start price"), error.message);
        }
    });

    it("should not accept a bid below the current highest bid", async () => {
        await nftMinting.mintNFT({ from: owner });
        await nftMinting.approve(nftAuction.address, 0, { from: owner });

        // Owner creates an auction for tokenId 0 with a start price of 1 ETH and duration 1 minute
        await nftAuction.createAuction(nftMinting.address, 0, web3.utils.toWei("1", "ether"), 1, { from: owner });
        // Bidder places a bid with 2 ETH
        await nftAuction.bid(1, { from: bidder, value: web3.utils.toWei("2", "ether") });

        // Bidder places a bid with 1.5 ETH
        try {
            await nftAuction.bid(1, { from: bidder, value: web3.utils.toWei("1.5", "ether") });
            assert.fail("Bid should not be accepted");
        } catch (error) {
            assert(error.message.includes("Bid must be greater than the current highest bid"), error.message);
        }
    });

    it("should not accept a bid after the auction has ended", async () => {
        await nftMinting.mintNFT({ from: owner });
        await nftMinting.approve(nftAuction.address, 0, { from: owner });
        await nftAuction.createAuction(nftMinting.address, 0, web3.utils.toWei("1", "ether"), 1, { from: owner });

        // Increase time by 2 minutes to ensure auction has ended
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [120],
            id: Date.now()
        }, () => { });

        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: Date.now()
        }, () => { });

        try {
            await nftAuction.bid(1, { from: bidder, value: web3.utils.toWei("2", "ether") });
            assert.fail("Bid should not be accepted");
        } catch (error) {
            assert(error.message.includes("Auction has ended"), error.message);
        }
    });

    it("should not accept a bid if the auction does not exist", async () => {
        await nftMinting.mintNFT({ from: owner });
        await nftMinting.approve(nftAuction.address, 0, { from: owner });

        // Bidder places a bid with 2 ETH
        try {
            await nftAuction.bid(1, { from: bidder, value: web3.utils.toWei("2", "ether") });
            assert.fail("Bid should not be accepted");
        } catch (error) {
            assert(error.message.includes("Auction does not exist"), error.message);
        }
    });

    it("should not accept a bid if the auction has been finalized", async () => {
        await nftMinting.mintNFT({ from: owner });
        await nftMinting.approve(nftAuction.address, 0, { from: owner });
        await nftAuction.createAuction(nftMinting.address, 0, web3.utils.toWei("1", "ether"), 1, { from: owner });

        // Increase time by 2 minutes
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [120],
            id: Date.now()
        }, () => { });

        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: Date.now()
        }, () => { });

        await nftAuction.finalizeAuction(1, { from: owner });

        try {
            await nftAuction.bid(1, { from: bidder, value: web3.utils.toWei("2", "ether") });
            assert.fail("Bid should not be accepted");
        } catch (error) {
            assert(error.message.includes("Auction has ended"), error.message);
        }
    });

    it("should refund the previous highest bidder when a higher bid is placed", async () => {
        await nftMinting.mintNFT({ from: owner });
        await nftMinting.approve(nftAuction.address, 0, { from: owner });
        await nftAuction.createAuction(nftMinting.address, 0, web3.utils.toWei("1", "ether"), 1, { from: owner });

        // Bidder places a bid with 2 ETH
        await nftAuction.bid(1, { from: bidder, value: web3.utils.toWei("2", "ether") });
        // Retrieve bidder balance before refund
        const bidderBalanceBefore = await web3.eth.getBalance(bidder);

        // Other bidder places a bid with 3 ETH instead of owner
        await nftAuction.bid(1, { from: otherBidder, value: web3.utils.toWei("3", "ether") });
        // Retrieve bidder balance after refund
        const bidderBalanceAfter = await web3.eth.getBalance(bidder);

        assert.isAbove(parseInt(bidderBalanceAfter), parseInt(bidderBalanceBefore), "Bidder should receive a refund");
    });

    it("should not refund the previous highest bidder when a lower bid is placed", async () => {
        await nftMinting.mintNFT({ from: owner });
        await nftMinting.approve(nftAuction.address, 0, { from: owner });
        await nftAuction.createAuction(nftMinting.address, 0, web3.utils.toWei("1", "ether"), 1, { from: owner });

        // Bidder places a bid with 2 ETH
        await nftAuction.bid(1, { from: bidder, value: web3.utils.toWei("2", "ether") });

        try {
            // Other bidder attempts a lower bid with 1.5 ETH
            await nftAuction.bid(1, { from: otherBidder, value: web3.utils.toWei("1.5", "ether") });
            assert.fail("Bid should not be accepted");
        } catch (error) {
            assert(error.message.includes("Bid must be greater than the current highest bid"), error.message);
        }
    });

    it("should not accepte creator bid", async () => {
        await nftMinting.mintNFT({ from: owner });
        await nftMinting.approve(nftAuction.address, 0, { from: owner });
        await nftAuction.createAuction(nftMinting.address, 0, web3.utils.toWei("1", "ether"), 1, { from: owner });

        try {
            await nftAuction.bid(1, { from: owner, value: web3.utils.toWei("2", "ether") });
            assert.fail("Bid should not be accepted");
        } catch (error) {
            assert(error.message.includes("Creator cannot bid"), error.message);
        }
    });

    // Creator nhận được tiền đấu giá sau khi đấu giá kết thúc
    it("should pay creator after auction ends", async () => {
        await nftMinting.mintNFT({ from: owner });
        await nftMinting.approve(nftAuction.address, 0, { from: owner });
        await nftAuction.createAuction(nftMinting.address, 0, web3.utils.toWei("1", "ether"), 1, { from: owner });

        // Bidder places a bid with 2 ETH
        await nftAuction.bid(1, { from: bidder, value: web3.utils.toWei("2", "ether") });

        // Increase time by 2 minutes to ensure auction has ended
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [120],
            id: Date.now()
        }, () => { });

        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: Date.now()
        }, () => { });

        // Retrieve creator balance before payout
        const creatorBalanceBefore = await web3.eth.getBalance(owner);
        // Finalize auction to pay creator
        await nftAuction.finalizeAuction(1, { from: owner });
        // Retrieve creator balance after payout
        const creatorBalanceAfter = await web3.eth.getBalance(owner);

        assert.isAbove(parseInt(creatorBalanceAfter), parseInt(creatorBalanceBefore), "Creator should receive payment");
    });

    it("should refund the exact bid amount to the previous highest bidder", async () => {
        await nftMinting.mintNFT({ from: owner });
        await nftMinting.approve(nftAuction.address, 0, { from: owner });
        await nftAuction.createAuction(nftMinting.address, 0, web3.utils.toWei("1", "ether"), 1, { from: owner });

        // Bidder places a bid with 2 ETH
        await nftAuction.bid(1, { from: bidder, value: web3.utils.toWei("2", "ether") });
        // Retrieve bidder balance before refund
        const bidderBalanceBefore = await web3.eth.getBalance(bidder);

        // Other bidder places a bid with 3 ETH instead of owner
        await nftAuction.bid(1, { from: otherBidder, value: web3.utils.toWei("3", "ether") });
        // Retrieve bidder balance after refund
        const bidderBalanceAfter = await web3.eth.getBalance(bidder);

        assert.equal(parseInt(bidderBalanceAfter), parseInt(bidderBalanceBefore) + parseInt(web3.utils.toWei("2", "ether")), "Bidder should receive a refund");
    });

    it("should transfer NFT to highest bidder after auction ends", async () => {
        await nftMinting.mintNFT({ from: owner });
        await nftMinting.approve(nftAuction.address, 0, { from: owner });
        await nftAuction.createAuction(nftMinting.address, 0, web3.utils.toWei("1", "ether"), 1, { from: owner });

        // Bidder places a bid with 2 ETH
        await nftAuction.bid(1, { from: bidder, value: web3.utils.toWei("2", "ether") });

        // Increase time by 2 minutes to ensure auction has ended
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [120],
            id: Date.now()
        }, () => { });
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: Date.now()
        }, () => { });

        // Finalize auction to transfer NFT to highest bidder
        await nftAuction.finalizeAuction(1, { from: owner });
        
        // Verify NFT token ownership is transferred to bidder
        const newOwner = await nftMinting.ownerOf(0);
        assert.equal(newOwner, bidder, "Token owner should be highest bidder");
    });
});
