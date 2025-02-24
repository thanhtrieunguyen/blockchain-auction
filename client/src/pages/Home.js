import React from 'react';
import { Container, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <Container maxWidth="md" style={{ textAlign: 'center', marginTop: '50px' }}>
      <Typography variant="h2" component="h1" gutterBottom>
        Welcome to NFT Auction
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom>
        Discover, collect, and auction extraordinary NFTs
      </Typography>
      <Button variant="contained" color="primary" component={Link} to="/auctions" style={{ marginTop: '20px' }}>
        Explore Auctions
      </Button>
    </Container>
  );
};

export default Home;