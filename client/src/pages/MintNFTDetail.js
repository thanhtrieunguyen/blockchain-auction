// M// MintNFTDetail.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Grid, CircularProgress, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { AccountContext } from '../context/AccountContext';
import { useSnackbar } from 'notistack';
import { initWeb3, getContracts } from '../web3';
import NFTHeader from '../components/NFTHeader';
import Overview from '../components/Overview';
import '../css/NFTDetail.css';
import '../css/Overview.css';

const DetailContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  padding: '12px 24px',
  fontWeight: 'bold',
  textTransform: 'none',
  fontSize: '1rem',
}));

const QuantityControl = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  '& button': {
    width: '36px',
    height: '36px',
    minWidth: 'unset',
    borderRadius: '8px',
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  }
}));

const MintNFTDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const { account } = useContext(AccountContext);
  const { enqueueSnackbar } = useSnackbar();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle quantity changes
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
        const web3 = await initWeb3();
        const { nftMinting } = await getContracts(web3);
        
        // Get NFT data from blockchain
        const tokenURI = await nftMinting.methods.tokenURI(id).call();
        const price = await nftMinting.methods.getMintPrice(id).call();
        const priceInEth = web3.utils.fromWei(price, 'ether');
        
        // Fetch metadata from tokenURI
        let metadata = {};
        if (tokenURI.startsWith('http')) {
          const response = await fetch(tokenURI);
          metadata = await response.json();
        }
        
        setNft({
          id: id,
          title: metadata.name || `NFT #${id}`,
          description: metadata.description || "No description available",
          imageUrl: metadata.image || `https://picsum.photos/id/${Number(id) + 100}/500/500`,
          price: priceInEth,
          creator: metadata.creator || "Admin",
          properties: metadata.attributes || []
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading NFT data:", error);
        enqueueSnackbar("Failed to load NFT details", { variant: "error" });
        setLoading(false);
        navigate('/mint');
      }
    };

    fetchNFTData();
  }, [id, enqueueSnackbar, navigate]);

  // Handle Minting
  const handleMint = async () => {
    if (!account) {
      enqueueSnackbar("Please connect your wallet first", { variant: "warning" });
      navigate('/connect-wallet', { state: { returnPath: `/mint/${id}` } });
      return;
    }

    try {
      setMinting(true);
      const web3 = await initWeb3();
      const { nftMinting } = await getContracts(web3);

      // Calculate total price
      const priceWei = web3.utils.toWei(String(nft.price), "ether");
      const totalPrice = BigInt(priceWei) * BigInt(quantity);
      
      // Call mint function from contract
      await nftMinting.methods.mintNFT(id)
        .send({ 
          from: account, 
          value: totalPrice.toString() 
        });

      enqueueSnackbar("NFT minted successfully", { variant: "success" });
      navigate('/my-nfts');  // Redirect to user's NFTs page
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
    <DetailContainer maxWidth="xl">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* NFT Header with Image and Basic Info */}
          <NFTHeader nft={nft} loading={loading} />
          
          <Grid container spacing={4} sx={{ mt: 3 }}>
            {/* Left column - Details */}
            <Grid item xs={12} md={8}>
              {/* Tabs for NFT information */}
              <Box className="tabs-container">
                <Button 
                  className={`custom-tab ${activeTab === 0 ? 'Mui-selected' : ''}`}
                  onClick={() => setActiveTab(0)}
                >
                  Overview
                </Button>
                <Button 
                  className={`custom-tab ${activeTab === 1 ? 'Mui-selected' : ''}`}
                  onClick={() => setActiveTab(1)}
                >
                  Properties
                </Button>
              </Box>
              
              {/* Tab Content */}
              <Box sx={{ p: 2 }}>
                {activeTab === 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>Description</Typography>
                    <Typography variant="body1" paragraph>
                      {nft.description}
                    </Typography>
                  </Box>
                )}
                {activeTab === 1 && (
                  <Overview nftData={nft} />
                )}
              </Box>
            </Grid>
            
            {/* Right column - Mint UI */}
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                p: 3, 
                border: '1px solid #e0e0e0', 
                borderRadius: 2,
                backgroundColor: '#fff', 
                position: 'sticky', 
                top: 100 
              }}>
                <Typography variant="h5" gutterBottom>
                  Mint this NFT
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Price: {nft.price} ETH
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box>
                  <Typography variant="body1" gutterBottom>
                    Quantity:
                  </Typography>
                  <QuantityControl>
                    <Button onClick={handleDecrease} disabled={quantity <= 1}>
                      <RemoveIcon />
                    </Button>
                    <Typography sx={{ mx: 2 }}>
                      {quantity}
                    </Typography>
                    <Button onClick={handleIncrease}>
                      <AddIcon />
                    </Button>
                  </QuantityControl>
                  
                  <Typography variant="body1" gutterBottom>
                    Total: {(nft.price * quantity).toFixed(6)} ETH
                  </Typography>
                </Box>
                
                <ActionButton 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  sx={{ mt: 3 }}
                  onClick={handleMint}
                  disabled={minting || !account}
                >
                  {minting ? <CircularProgress size={24} /> : 'Mint NFT'}
                </ActionButton>
                
                {!account && (
                  <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                    Please connect your wallet to mint this NFT
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </>
      )}
    </DetailContainer>
  );
};

export default MintNFTDetail;