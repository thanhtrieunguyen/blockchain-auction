import React, { useState, useEffect, useContext } from "react";
import { Box, Tabs, Tab, Button, CircularProgress, IconButton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useParams } from "react-router-dom";
import NFTHeader from "../components/NFTHeader";
import "../css/NFTDetail.css";
import Overview from "../components/Overview";
import { AccountContext } from "../context/AccountContext";
import { useSnackbar } from "notistack";
import { initWeb3, getContracts } from "../web3";

const NFTDetail = () => {
  const { id } = useParams();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [value, setValue] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { account } = useContext(AccountContext);
  const { enqueueSnackbar } = useSnackbar();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  // Xử lý tăng/giảm số lượng
  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleIncrease = () => {
    setQuantity(prev => prev + 1);
  };

  // Fetch NFT data by ID
  useEffect(() => {
    const fetchNFTData = async () => {
      try {
        setLoading(true);
        
        // Vì không có API, chúng ta sẽ sử dụng dữ liệu mẫu
        // Trong môi trường thực tế, bạn sẽ gọi API hoặc lấy dữ liệu từ blockchain
        setTimeout(() => {
          setNft({
            id: id,
            title: "NFT Collection #" + id,
            description: "This is a unique digital collectible NFT from our exclusive collection. Each piece is carefully crafted and features unique properties that make it valuable in the digital art world.",
            imageUrl: `https://picsum.photos/id/${Number(id) + 100}/500/500`,
            price: 0.05,
            creator: "0x8901Ab..." + id,
            properties: [
              { type: "Rarity", value: "Rare" },
              { type: "Collection", value: "Genesis" },
              { type: "Style", value: "Abstract" },
              { type: "Color", value: "Multi" },
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

  // Handle Minting
  const handleMint = async () => {
    if (!account) {
      enqueueSnackbar("Please connect your wallet first", { variant: "warning" });
      return;
    }

    try {
      setMinting(true);
      const web3 = await initWeb3();
      const { nftContract } = await getContracts(web3);

      // Giả sử nft.price là giá của NFT
      const price = web3.utils.toWei(String(nft.price * quantity), "ether");
      
      await nftContract.methods
        .mint(id, quantity)
        .send({ from: account, value: price });

      enqueueSnackbar("NFT minted successfully", { variant: "success" });
    } catch (error) {
      console.error("Minting error:", error);
      enqueueSnackbar(
        `Failed to mint: ${error.message || "Transaction failed"}`,
        { variant: "error" }
      );
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="p-6">
      <NFTHeader nft={nft} loading={loading} />
      
      {/* Thêm phần chọn số lượng và Mint NFT */}
      {account && nft && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body1" sx={{ mr: 2 }}>Quantity:</Typography>
            <IconButton onClick={handleDecrease} size="small" sx={{ border: '1px solid #e0e0e0' }}>
              <RemoveIcon />
            </IconButton>
            <Typography variant="body1" sx={{ mx: 2, minWidth: '30px', textAlign: 'center' }}>
              {quantity}
            </Typography>
            <IconButton onClick={handleIncrease} size="small" sx={{ border: '1px solid #e0e0e0' }}>
              <AddIcon />
            </IconButton>
          </Box>
          
          <Typography variant="h6" sx={{ mb: 2 }}>
            Total: {(nft.price * quantity).toFixed(3)} ETH
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleMint}
            disabled={minting}
            sx={{ px: 4, py: 1, borderRadius: 2, minWidth: '200px' }}
          >
            {minting ? <CircularProgress size={24} /> : 'Mint NFT'}
          </Button>
        </Box>
      )}

      <Box className="tabs-container">
        <Tabs value={value} onChange={handleChange} centered>
          <Tab label="Overview" className="custom-tab" />
          <Tab label="Items" className="custom-tab" />
          <Tab label="Offers" className="custom-tab" />
          <Tab label="Analytics" className="custom-tab" />
          <Tab label="Activity" className="custom-tab" />
        </Tabs>
      </Box>

      <div className="custom-tab-panel">
        {value === 0 && <Overview nftData={nft} />}
        {value === 1 && <div>Items list will be displayed here...</div>}
        {value === 2 && <div>Offers content here...</div>}
        {value === 3 && <div>Analytics data here...</div>}
        {value === 4 && <div>Activity logs here...</div>}
      </div>
    </div>
  );
};

export default NFTDetail;