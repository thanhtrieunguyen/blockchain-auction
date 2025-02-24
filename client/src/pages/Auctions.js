import React, { useState, useEffect } from 'react';
import { Container, Typography, Box } from '@mui/material';
import AuctionList from '../components/AuctionList';

const Auctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Here you would fetch auctions from your smart contract
    // For now, let's use dummy data
    const dummyAuctions = [
      {
        id: 1,
        title: "Crypto Punk #1234",
        description: "Rare Crypto Punk NFT",
        imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
        currentPrice: "2.5",
        endTime: "2h 45m",
        status: "live"
      },
      {
        id: 2,
        title: "Bored Ape #4567",
        description: "Bored Ape Yacht Club NFT",
        imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
        currentPrice: "3.5",
        endTime: "1d 5h",
        status: "live"
      },
      {
        id: 3,
        title: "Meebit #7890",
        description: "Meebit NFT",
        imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
        currentPrice: "1.5",
        endTime: "3d 12h",
        status: "upcoming"
      },
      // id 4 5 6 7 8 9
      {
        id: 4,
        title: "Crypto Punk #1234",
        description: "Rare Crypto Punk NFT",
        imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
        currentPrice: "2.5",
        endTime: "2h 45m",
        status: "live"
      },
      {
        id: 5,
        title: "Bored Ape #4567",
        description: "Bored Ape Yacht Club NFT",
        imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
        currentPrice: "3.5",
        endTime: "1d 5h",
        status: "live"
      },
      {
        id: 6,
        title: "Meebit #7890",
        description: "Meebit NFT",
        imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
        currentPrice: "1.5",
        endTime: "3d 12h",
        status: "upcoming"
      },
      {
        id: 7,
        title: "Crypto Punk #1234",
        description: "Rare Crypto Punk NFT",
        imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
        currentPrice: "2.5",
        endTime: "2h 45m",
        status: "live"
      },
      {
        id: 8,
        title: "Bored Ape #4567",
        description: "Bored Ape Yacht Club NFT",
        imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
        currentPrice: "3.5",
        endTime: "1d 5h",
        status: "live"
      },
      {
        id: 9,
        title: "Meebit #7890",
        description: "Meebit NFT",
        imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
        currentPrice: "1.5",
        endTime: "3d 12h",
        status: "upcoming"
      } 

      // Add more dummy auctions...
    ];

    setAuctions(dummyAuctions);
    setLoading(false);
  }, []);

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
          Các phiên đấu giá NFT
        </Typography>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>Loading...</Box>
        ) : (
          <AuctionList auctions={auctions} />
        )}
      </Box>
    </Container>
  );
};

export default Auctions;