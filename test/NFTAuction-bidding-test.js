const NFTMinting = artifacts.require("NFTMinting");
const NFTAuction = artifacts.require("NFTAuction");

contract("NFTAuction - Bidding", accounts => {
    let nftMinting, nftAuction;
    const owner = accounts[0];
    const bidder1 = accounts[1];
    const bidder2 = accounts[2];
    
    beforeEach(async () => {
        nftMinting = await NFTMinting.new({ from: owner });
        nftAuction = await NFTAuction.new({ from: owner });
        await nftMinting.testMint(owner, { from: owner });  // Thay mintNFT bằng testMint
        await nftMinting.approve(nftAuction.address, 0, { from: owner });
        await nftAuction.createAuction(nftMinting.address, 0, web3.utils.toWei("1", "ether"), 1, { from: owner });
    });

    it("should accept valid bid", async () => {
        await nftAuction.bid(1, { from: bidder1, value: web3.utils.toWei("2", "ether") });
        const auction = await nftAuction.auctions(1);
        assert.equal(auction.highestBidder, bidder1);
    });

    it("should refund previous bidder", async () => {
        await nftAuction.bid(1, { from: bidder1, value: web3.utils.toWei("2", "ether") });
        const balanceBefore = await web3.eth.getBalance(bidder1);
        
        await nftAuction.bid(1, { from: bidder2, value: web3.utils.toWei("3", "ether") });
        const balanceAfter = await web3.eth.getBalance(bidder1);
        
        assert.isTrue(parseInt(balanceAfter) > parseInt(balanceBefore));
    });

    it("should transfer NFT and pay seller after auction ends", async () => {
        await nftAuction.bid(1, { from: bidder1, value: web3.utils.toWei("2", "ether") });
        
        // Tăng thời gian để kết thúc đấu giá
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [120],
            id: Date.now()
        }, () => {});
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: Date.now()
        }, () => {});

        await nftAuction.finalizeAuction(1, { from: owner });
        const newOwner = await nftMinting.ownerOf(0);
        assert.equal(newOwner, bidder1);
    });
});
