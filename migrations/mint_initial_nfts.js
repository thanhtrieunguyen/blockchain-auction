const NFTMinting = artifacts.require("NFTMinting");

module.exports = async function(deployer, network, accounts) {
  // Only run this in development networks like Ganache
  if (network === 'development') {
    const nftMinting = await NFTMinting.deployed();
    
    console.log("Minting initial NFTs for the first 5 accounts...");
    console.log("Contract address:", nftMinting.address);
    
    // For the first 5 accounts
    for (let i = 0; i < 5 && i < accounts.length; i++) {
      console.log(`Minting 3 NFTs for account ${accounts[i]}...`);
      
      // Mint 3 NFTs for each account
      for (let j = 0; j < 3; j++) {
        // Calculate a unique token ID for each NFT
        const tokenId = i * 3 + j;
        
        // Use IDs between 0 and 9999 for Bored Ape collection 
        // with a proper distribution to get different apes
        const nftId = (tokenId * 777) % 10000; // Create a better distribution
        
        try {
          // Create and mint the NFT directly to the account
          await nftMinting.testMint(accounts[i], { from: accounts[0] });
          
          // Set the token URI with the proper format including .json extension
          const tokenUri = `https://ipfs.io/ipfs/QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/${nftId}`;
          await nftMinting.setTokenURI(tokenId, tokenUri, { from: accounts[0] });
          
          console.log(`Minted NFT #${tokenId} for ${accounts[i]} with ID: ${nftId}`);
          console.log(`Token URI: ${tokenUri}`);
          
          // Verify ownership
          const owner = await nftMinting.ownerOf(tokenId);
          console.log(`Verified owner: ${owner} (should be ${accounts[i]})`);
        } catch (error) {
          console.error(`Error minting NFT #${tokenId}:`, error.message);
        }
      }
    }
    
    console.log("Initial NFT minting completed!");
    console.log("To import in MetaMask:");
    console.log("1. Go to NFTs tab");
    console.log(`2. Import NFT with contract address: ${nftMinting.address}`);
    console.log("3. Use token ID between 0-14 for the NFTs just created");
    console.log("4. Make sure you're connected to your Ganache network");
  } else {
    console.log("Skipping initial NFT minting for non-development network");
  }
};
