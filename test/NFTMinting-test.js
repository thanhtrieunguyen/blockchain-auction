const NFTMinting = artifacts.require("NFTMinting");
const NFTAuction = artifacts.require("NFTAuction");

contract("NFTMinting", accounts => {
    let nftMinting, nftAuction;
    const owner = accounts[0];
    
    beforeEach(async () => {
        nftMinting = await NFTMinting.new({ from: owner });
        nftAuction = await NFTAuction.new({ from: owner });
    });
    
    it("should mint an NFT", async () => {
        await nftMinting.mintNFT({ from: owner });
        const tokenOwner = await nftMinting.ownerOf(0);
        assert.equal(tokenOwner, owner, "Owner should own the minted NFT");
    });
    
    it("should approve NFT for auction", async () => {
        await nftMinting.mintNFT({ from: owner });
        await nftMinting.approve(nftAuction.address, 0, { from: owner });
        const approved = await nftMinting.getApproved(0);
        assert.equal(approved, nftAuction.address, "NFTAuction should be approved");
    });
});