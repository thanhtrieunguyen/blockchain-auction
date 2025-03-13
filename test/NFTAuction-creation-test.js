const NFTMinting = artifacts.require("NFTMinting");
const NFTAuction = artifacts.require("NFTAuction");

contract("NFTAuction - Creation", accounts => {
    let nftMinting, nftAuction;
    const owner = accounts[0];
    
    beforeEach(async () => {
        nftMinting = await NFTMinting.new({ from: owner });
        nftAuction = await NFTAuction.new({ from: owner });
    });

    it("should create an auction successfully", async () => {
        await nftMinting.testMint(owner, { from: owner });  // Thay mintNFT bằng testMint
        await nftMinting.approve(nftAuction.address, 0, { from: owner });
        
        await nftAuction.createAuction(nftMinting.address, 0, web3.utils.toWei("1", "ether"), 1, { from: owner });
        const auction = await nftAuction.auctions(1);
        assert.equal(auction.creator, owner);
    });

    it("should not create auction for non-existent NFT", async () => {
        try {
            await nftAuction.createAuction(nftMinting.address, 1, web3.utils.toWei("1", "ether"), 1, { from: owner });
            assert.fail("Should not create auction");
        } catch (error) {
            assert(error.message.includes("ERC721: invalid token ID"));
        }
    });

    it("should not create auction with invalid duration", async () => {
        await nftMinting.testMint(owner, { from: owner });  // Sửa mintNFT thành testMint
        await nftMinting.approve(nftAuction.address, 0, { from: owner });
        try {
            await nftAuction.createAuction(nftMinting.address, 0, web3.utils.toWei("1", "ether"), 0, { from: owner });
            assert.fail("Should not create auction");
        } catch (error) {
            assert(error.message.includes("Duration must be at least 1 minute"));
        }
    });
});
