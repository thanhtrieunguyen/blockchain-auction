import React from "react";
import "../css/NFTHeader.css";

const NFTHeader = () => {
  const nftData = {
    name: "Unknowns",
    author: "amber_vittoria",
    price: "0.008 ETH",
    imageBackground:
      "https://i.seadn.io/s/primary-drops/0xa09bfff67fcd0b2c3ef238e5fb36f4666c81fea0/34314199:about:media:c98543de-e2c3-4913-bddf-31d3ce42bffb.png?auto=format&dpr=1&w=1920",
    image:
      "https://i.seadn.io/s/raw/files/288ec0a6ad66be1bc71f03cb88e01c88.png?auto=format&dpr=1&w=256",
    totalVolume: "0.8142 ETH",
    floorPrice: "0.0079 ETH",
    bestOffer: "0.0053 WETH",
    listedPercentage: "14%",
    owners: "252 (43%)",
  };

  return (
    <div className="nft-header">
      {/* Background Image */}
      <div
        className="nft-background"
        style={{ backgroundImage: `url(${nftData.imageBackground})` }}
      >
        <div className="nft-overlay"></div>
      </div>

      {/* NFT Info */}
<div className="nft-info-container">
  <div className="nft-info">
    <img src={nftData.image} alt={nftData.name} className="nft-avatar" />
    <div>
      <h1 className="nft-title">{nftData.name}</h1>
      <p className="nft-author">by {nftData.author}</p>
      <p className="minting-tag">Minting</p> 
    </div>
  </div>
</div>


      {/* Stats */}
      <div className="nft-stats">
        <div>
          <p className="stat-label">Total Volume</p>
          <p className="stat-value">{nftData.totalVolume}</p>
        </div>
        <div>
          <p className="stat-label">Floor Price</p>
          <p className="stat-value">{nftData.floorPrice}</p>
        </div>
        <div>
          <p className="stat-label">Best Offer</p>
          <p className="stat-value">{nftData.bestOffer}</p>
        </div>
        <div>
          <p className="stat-label">Listed</p>
          <p className="stat-value">{nftData.listedPercentage}</p>
        </div>
        <div>
          <p className="stat-label">Owners</p>
          <p className="stat-value">{nftData.owners}</p>
        </div>
      </div>
    </div>
  );
};

export default NFTHeader;
