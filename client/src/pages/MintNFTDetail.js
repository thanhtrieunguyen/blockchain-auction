import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Grid, CircularProgress, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { AccountContext } from '../context/AccountContext';
import { useSnackbar } from 'notistack';
import { initWeb3, getContracts } from '../web3';
import '../css/NFTDetail.css';
import '../css/Overview.css';

const NFTImage = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '400px',
  borderRadius: '12px',
  overflow: 'hidden',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
}));

const MintNFTDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nft, setNft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { account } = useContext(AccountContext);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchNFTData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const web3 = await initWeb3();
        const { nftMinting } = await getContracts(web3);
        
        // Get NFT data
        const tokenURI = await nftMinting.methods.tokenURI(id).call();
        const price = await nftMinting.methods.getMintPrice(id).call();
        
        let metadata = {};
        if (tokenURI.startsWith('http')) {
          try {
            const response = await fetch(tokenURI);
            metadata = await response.json();
          } catch (err) {
            console.warn(`Failed to fetch metadata for token ${id}`);
          }
        }
        
        setNft({
          id: id,
          title: metadata.name || `NFT #${id}`,
          description: metadata.description || 'No description available',
          image: metadata.image || 'https://via.placeholder.com/400',
          price: web3.utils.fromWei(price, 'ether'),
          attributes: metadata.attributes || []
        });
      } catch (error) {
        console.error("Error fetching NFT:", error);
        enqueueSnackbar('Failed to load NFT details', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchNFTData();
  }, [id, enqueueSnackbar]);

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleIncrease = () => {
    setQuantity(prev => prev + 1);
  };

  const handleMint = async () => {
    if (!account) {
      enqueueSnackbar("Please connect your wallet to mint NFTs", { variant: "warning" });
      navigate('/connect-wallet', {
        state: { returnPath: `/mint/${id}`, message: 'Please connect your wallet to mint NFTs' }
      });
      return;
    }
    
    setMinting(true);
    try {
      const web3 = await initWeb3();
      const { nftMinting } = await getContracts(web3);
      
      // Get the price of the NFT
      const price = await nftMinting.methods.getMintPrice(id).call();
      const totalPrice = web3.utils.toBN(price).mul(web3.utils.toBN(quantity));
      
      // Mint the NFT
      await nftMinting.methods.mintNFT(id).send({ 
          from: account, 
          value: totalPrice.toString() 
      });
      
      enqueueSnackbar("NFT minted successfully!", { variant: "success" });
      
      // Redirect to user profile or NFT collection page
      navigate('/my-nfts');
    } catch (error) {
      console.error("Failed to mint NFT:", error);
      enqueueSnackbar(`Failed to mint NFT: ${error.message}`, { variant: "error" });
    } finally {
      setMinting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!nft) {
    return (
      <Container maxWidth="lg" sx={{ textAlign: 'center', py: 5 }}>
        <Typography variant="h5">NFT not found or not available for minting</Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 3 }}
          onClick={() => navigate('/mint')}
        >
          Back to Mint Page
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <div className="overview-container">
        {/* NFT Image */}
        <div className="overview-left">
          <NFTImage>
            <img 
              src={nft.image} 
              alt={nft.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </NFTImage>
        </div>

        {/* NFT Info and Mint Section */}
        <div className="overview-right">
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {nft.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {nft.description}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Mint Section */}
            <div className="mint-section">
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Mint Price</Typography>
              <Typography className="mint-price">
                {nft.price} ETH 
                <span className="usd-price"> ~${(parseFloat(nft.price) * 3000).toFixed(2)}</span>
              </Typography>
              
              <div className="quantity-selector">
                <Button 
                  variant="outlined" 
                  onClick={handleDecrease}
                  disabled={quantity <= 1 || minting}
                  sx={{ minWidth: '40px', p: 0 }}
                >
                  <RemoveIcon />
                </Button>
                <Typography variant="h6" sx={{ mx: 2 }}>{quantity}</Typography>
                <Button 
                  variant="outlined" 
                  onClick={handleIncrease}
                  disabled={minting}
                  sx={{ minWidth: '40px', p: 0 }}
                >
                  <AddIcon />
                </Button>
              </div>
              
              <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                Total: {(parseFloat(nft.price) * quantity).toFixed(3)} ETH
              </Typography>
              
              <Button 
                variant="contained" 
                fullWidth 
                sx={{ 
                  py: 1.5, 
                  fontWeight: 700, 
                  fontSize: '1.1rem',
                  backgroundColor: 'black',
                  '&:hover': {
                    backgroundColor: '#333',
                  }
                }}
                onClick={handleMint}
                disabled={minting}
              >
                {minting ? <CircularProgress size={24} color="inherit" /> : 'Mint Now'}
              </Button>
            </div>
            
            {nft.attributes && nft.attributes.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Properties</Typography>
                <Grid container spacing={2}>
                  {nft.attributes.map((attr, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Box sx={{ 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 2, 
                        p: 1.5,
                        textAlign: 'center',
                        backgroundColor: 'rgba(21, 178, 229, 0.06)'
                      }}>
                        <Typography variant="caption" color="primary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                          {attr.trait_type}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {attr.value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        </div>
      </div>
    </Container>
  );
};

export default MintNFTDetail;