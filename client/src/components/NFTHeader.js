import React from "react";
import { Skeleton, Box } from "@mui/material";

const NFTHeader = ({ nft, loading }) => {
  if (loading) {
    return (
      <Box className="nft-header">
        <Skeleton variant="rectangular" width="100%" height={300} />
        <Box sx={{ pt: 2 }}>
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="text" width="60%" height={20} />
        </Box>
      </Box>
    );
  }

  return (
    <div className="nft-header">
      {/* Hiển thị thông tin NFT */}
      <img src={nft?.imageUrl} alt={nft?.title} className="nft-image" />
      <div className="nft-info">
        <h1 className="nft-title">{nft?.title}</h1>
        <p className="nft-description">{nft?.description}</p>
        <div className="nft-price">
          <span>Price: {nft?.price} ETH</span>
        </div>
      </div>
    </div>
  );
};

export default NFTHeader;