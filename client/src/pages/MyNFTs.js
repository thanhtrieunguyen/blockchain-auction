import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, Box, Grid, Card, CardMedia, CardContent, Button, CircularProgress, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { AccountContext } from '../context/AccountContext';
import { initWeb3, getContracts } from '../web3';
import { useSnackbar } from 'notistack';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';

const NFTCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '16px',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)'
  }
}));

const NFTImage = styled(CardMedia)(({ theme }) => ({
  paddingTop: '100%', // 1:1 Aspect Ratio
  backgroundSize: 'cover',
}));

function MyNFTs() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { account } = useContext(AccountContext);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const fetchNFTs = async () => {
    if (!account) return;

    try {
      setLoading(true);
      
      const web3 = await initWeb3();
      const { nftMinting } = await getContracts(web3);
      
      const myNFTs = [];
      
      // Kiểm tra sở hữu các NFT (giả sử tokenCounter không lớn)
      const tokenCounter = await nftMinting.methods.tokenCounter().call();
      
      for (let i = 0; i < tokenCounter; i++) {
        try {
          const owner = await nftMinting.methods.ownerOf(i).call();
          
          // Nếu người dùng hiện tại là chủ sở hữu NFT
          if (owner.toLowerCase() === account.toLowerCase()) {
            const tokenURI = await nftMinting.methods.tokenURI(i).call();
            let metadata = { name: `NFT #${i}`, image: `https://picsum.photos/id/${i+100}/500/500` };
            
            if (tokenURI.startsWith('http')) {
              try {
                const response = await fetch(tokenURI);
                const data = await response.json();
                if (data) {
                  metadata = data;
                }
              } catch (error) {
                console.warn(`Failed to fetch metadata for NFT #${i}`);
              }
            }
            
            myNFTs.push({
              id: i,
              name: metadata.name || `NFT #${i}`,
              description: metadata.description || 'No description available',
              image: metadata.image || `https://picsum.photos/id/${i+100}/500/500`,
              attributes: metadata.attributes || []
            });
          }
        } catch (error) {
          console.warn(`Error checking NFT #${i}:`, error);
        }
      }
      
      setNfts(myNFTs);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      enqueueSnackbar('Failed to load your NFTs', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!account) {
      navigate('/connect-wallet', { 
        state: { returnPath: '/my-nfts' } 
      });
      return;
    }
    
    fetchNFTs();
  }, [account, navigate, enqueueSnackbar]);

  const handleCreateAuction = (nftId) => {
    navigate(`/create-auction?tokenId=${nftId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          My NFTs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your NFT collection
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : nfts.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: 'center',
            backgroundColor: 'rgba(25, 118, 210, 0.04)',
            border: '1px dashed rgba(25, 118, 210, 0.4)',
          }}
        >
          <InfoIcon sx={{ fontSize: 60, color: 'primary.main', opacity: 0.7, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            You don't own any NFTs yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            When you acquire NFTs through auctions, they will appear here
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/auctions')}
            startIcon={<AddIcon />}
          >
            Explore Auctions
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {nfts.map((nft) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={nft.id}>
              <NFTCard>
                <NFTImage
                  image={nft.image}
                  title={nft.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom noWrap>
                    {nft.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {nft.description.length > 100 
                      ? `${nft.description.substring(0, 100)}...` 
                      : nft.description}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 'auto' }}
                    onClick={() => handleCreateAuction(nft.id)}
                  >
                    Create Auction
                  </Button>
                </CardContent>
              </NFTCard>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default MyNFTs;
