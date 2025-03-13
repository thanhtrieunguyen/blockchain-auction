import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Grid, Paper, Divider, Chip, Avatar, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { AccountContext } from '../context/AccountContext';
import { useSnackbar } from 'notistack';
import { initWeb3, getContracts } from '../web3';
import NFTHeader from '../components/NFTHeader';

const NFTDetail = () => {
  const { id } = useParams();
  const { account } = useContext(AccountContext);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auctionLoading, setAuctionLoading] = useState(false);

  useEffect(() => {
    const fetchNFTData = async () => {
      try {
        setLoading(true);
        
        // Giả lập việc tải dữ liệu từ blockchain
        setTimeout(() => {
          setNft({
            id: id,
            name: `Amazing NFT #${id}`,
            description: "This is a unique digital collectible representing ownership of exclusive content.",
            image: `https://picsum.photos/id/${parseInt(id) + 100}/800/800`,
            owner: "0xABC...123",
            creator: "Artist Studio",
            creationDate: "2023-04-15",
            properties: [
              { type: "Background", value: "Blue" },
              { type: "Character", value: "Robot" },
              { type: "Size", value: "Medium" }
            ]
          });
          setLoading(false);
        }, 700); // Giả lập thời gian tải
        
      } catch (error) {
        console.error("Error loading NFT data:", error);
        enqueueSnackbar("Failed to load NFT details", { variant: "error" });
        setLoading(false);
      }
    };

    fetchNFTData();
  }, [id, enqueueSnackbar]);

  // Thay thế Handle Minting bằng chức năng tạo đấu giá
  const handleCreateAuction = async () => {
    if (!account) {
      enqueueSnackbar("Please connect your wallet first", { variant: "warning" });
      return;
    }

    navigate(`/create-auction?tokenId=${id}`);
  };

  return (
    <div className="p-6">
      <NFTHeader nft={nft} loading={loading} />
      
      {/* Thêm nút tạo đấu giá thay vì mint NFT */}
      {account && nft && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 3 }}>
          <Button 
            variant="contained" 
            color="primary"
            size="large"
            onClick={handleCreateAuction}
            disabled={auctionLoading}
            sx={{ 
              minWidth: 200,
              py: 1.5,
              fontSize: '1.1rem',
              borderRadius: '8px',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)'
            }}
          >
            {auctionLoading ? <CircularProgress size={24} /> : 'Create Auction'}
          </Button>
        </Box>
      )}

      {/* Các phần hiển thị khác của NFT */}
      {/* ...existing code... */}
    </div>
  );
};

export default NFTDetail;