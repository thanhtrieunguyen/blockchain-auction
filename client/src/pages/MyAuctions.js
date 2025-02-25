import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, Box, Grid, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AuctionList from '../components/AuctionList';
import Web3Button from '../components/Web3Button';
import { useNavigate } from 'react-router-dom';
import { AccountContext } from '../context/AccountContext';

const MyAuctions = () => {
  const { account } = useContext(AccountContext);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (account) {
      // Dummy data - would be replaced with actual user's auctions
      const dummyMyAuctions = [
        {
          id: 1,
          title: "My Crypto Punk #1234",
          description: "Rare Crypto Punk NFT",
          imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
          currentPrice: "2.5",
          endTime: "2h 45m",
          status: "live"
        },
        {
          id: 2,
          title: "My Bored Ape #4567",
          description: "Bored Ape Yacht Club NFT",
          imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
          currentPrice: "3.5",
          endTime: "1d 5h",
          status: "live"
        },
        // Add more dummy auctions...
      ];

      setAuctions(dummyMyAuctions);
      setLoading(false);
    }
  }, [account]);

  const handleCreateAuction = () => {
    // Redirect to create auction page
    navigate('/create-auction');
  };

  if (!account) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 4,
              textAlign: 'center'
            }}
          >
            My Auctions
          </Typography>
          <Paper
            elevation={2}
            sx={{
              p: 6,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            <Typography variant="h6" color="text.secondary" textAlign="center">
              Please connect your wallet to view and manage your auctions
            </Typography>
            <Web3Button
              onClick={() => navigate('/connect-wallet')}
              sx={{ maxWidth: 250 }}
            >
              Connect Wallet
            </Web3Button>
          </Paper>
        </Box>
      </Container>
    );
  }


  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Grid item>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              My Auctions
            </Typography>
          </Grid>
          <Grid item>
            <Web3Button
              startIcon={<AddIcon />}
              onClick={() => handleCreateAuction()}
            >
              Create Auction
            </Web3Button>
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>Loading...</Box>
        ) : auctions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              You haven't created any auctions yet
            </Typography>
          </Box>
        ) : (
          <AuctionList auctions={auctions} />
        )}
      </Box>
    </Container>
  );
};

export default MyAuctions;