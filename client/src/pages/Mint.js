import React, { useState, useEffect } from 'react';
import { Container, Typography, Box } from '@mui/material';
import MintNFTList from '../components/MintNFTList';

const Mint = () => {
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Dummy data with more NFTs
        const dummyNFTs = [
            {
                id: 1,
                title: "Digital Art #001",
                description: "3D Model NFT",
                imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
                price: "0",
                collection: "Digital Art Collection"
            },
            {
                id: 2,
                title: "Pixel Art #002",
                description: "3D Model NFT",
                imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
                price: "0.15",
                collection: "Pixel Art Collection"
            },
            {
                id: 3,
                title: "3D Model #003",
                description: "3D Model NFT",
                imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
                price: "0.2",
                collection: "3D Models"
            },
            {
                id: 4,
                title: "Digital Art #004",
                description: "3D Model NFT",
                imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
                price: "0.1",
                collection: "Digital Art Collection"
            },
            {
                id: 5,
                title: "Pixel Art #005",
                description: "3D Model NFT",
                imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
                price: "0.15",
                collection: "Pixel Art Collection"
            },
            {
                id: 6,
                title: "3D Model #006",
                description: "3D Model NFT",
                imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
                price: "0.2",
                collection: "3D Models"
            }
            // Add more dummy NFTs similar to auction list...
        ];

        setNfts(dummyNFTs);
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
                    Available NFTs to Mint
                </Typography>

                {loading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>Loading...</Box>
                ) : (
                    <MintNFTList nfts={nfts} />
                )}
            </Box>
        </Container>
    );
};

export default Mint;