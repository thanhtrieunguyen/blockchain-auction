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
        // First create an NFT with a price
        const tokenURI = "https://example.com/nft/1";
        const price = web3.utils.toWei("0.1", "ether");
        await nftMinting.createNFT(tokenURI, price, { from: owner });
        
        // Then mint it with the required payment
        await nftMinting.mintNFT(0, { from: owner, value: price });
        const tokenOwner = await nftMinting.ownerOf(0);
        assert.equal(tokenOwner, owner, "Owner should own the minted NFT");
    });
    
    it("should approve NFT for auction", async () => {
        // First create and mint an NFT
        const tokenURI = "https://example.com/nft/1";
        const price = web3.utils.toWei("0.1", "ether");
        await nftMinting.createNFT(tokenURI, price, { from: owner });
        await nftMinting.mintNFT(0, { from: owner, value: price });
        
        // Then approve it for auction
        await nftMinting.approve(nftAuction.address, 0, { from: owner });
        const approved = await nftMinting.getApproved(0);
        assert.equal(approved, nftAuction.address, "NFTAuction should be approved");
    });

    // Rest of the tests remain unchanged
    it("should allow admin to create NFT", async () => {
        const tokenURI = "https://example.com/nft/1";
        const price = web3.utils.toWei("0.1", "ether");
        
        await nftMinting.createNFT(tokenURI, price, { from: owner });
        
        const availableNFTs = await nftMinting.getAvailableNFTs();
        assert.equal(availableNFTs.length, 1);
        assert.equal(await nftMinting.tokenURI(0), tokenURI);
        assert.equal(await nftMinting.getMintPrice(0), price);
    });
    
    it("should allow users to mint available NFT", async () => {
        const tokenURI = "https://example.com/nft/1";
        const price = web3.utils.toWei("0.1", "ether");
        
        await nftMinting.createNFT(tokenURI, price, { from: owner });
        await nftMinting.mintNFT(0, { from: accounts[1], value: price });
        
        assert.equal(await nftMinting.ownerOf(0), accounts[1]);
        assert.equal(await nftMinting.availableToMint(0), false);
    });
});