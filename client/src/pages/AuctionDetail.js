import React, { useState, useEffect, useContext } from 'react';
import { AccountContext } from '../context/AccountContext';
import { useParams } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Box,
    Typography,
    TextField,
    Divider,
    List,
    ListItem,
    Paper,
} from '@mui/material';
import Web3Button from '../components/Web3Button';


const BidAmount = styled(Typography)(({ theme }) => ({
    color: '#2081E2',
    fontWeight: 600,
    fontSize: '1.1rem'
}));

const WalletAddress = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.secondary,
    '& .highlight': {
        color: theme.palette.text.primary,
        fontWeight: 500,
    }
}));

const BidTime = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.disabled,
    fontSize: '0.75rem'
}));

const AuctionDetail = () => {

    const { account } = useContext(AccountContext);
    const { id } = useParams();
    const [auction, setAuction] = useState(null);
    const [bidAmount, setBidAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Dummy data - replace with actual API call
        const dummyAuction = {
            id: id,
            title: "Bored Ape #1234",
            description: "A unique Bored Ape NFT from the famous collection",
            imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
            currentPrice: "2.5",
            endTime: "2h 45m",
            creator: "0x1234...5678",
            collection: "Bored Ape Yacht Club",
            tokenId: "#1234",
            biddingHistory: [
                { bidder: "0xabcd...efgh", amount: "2.5", time: "2024-02-25 10:30" },
                { bidder: "0xabcd...efgh", amount: "2.5", time: "2024-02-25 10:30" },
                { bidder: "0xabcd...efgh", amount: "2.5", time: "2024-02-25 10:30" },
                { bidder: "0x9876...5432", amount: "2.3", time: "2024-02-25 10:15" },
                { bidder: "0xijkl...mnop", amount: "2.0", time: "2024-02-25 10:00" },
            ]
        };

        setAuction(dummyAuction);
        setLoading(false);
    }, [id]);

    const handleBid = () => {
        console.log(`Placing bid of ${bidAmount} ETH`);
    };

    if (loading || !auction) {
        return <Box sx={{ textAlign: 'center', py: 4 }}>Loading...</Box>;
    }

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 4 }}>
                <Grid container spacing={4}>
                    {/* Left Column - NFT Image and Details */}
                    <Grid item xs={12} md={7}>
                        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                            <Box
                                sx={{
                                    mb: 3,
                                    maxWidth: '500px',
                                    mx: 'auto',
                                    aspectRatio: '1',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                <img
                                    src={auction.imageUrl}
                                    alt={auction.title}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block'
                                    }}
                                />
                            </Box>

                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                                {auction.title}
                            </Typography>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Collection
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {auction.collection}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Token ID
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {auction.tokenId}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Typography variant="body1" sx={{ mb: 3 }}>
                                {auction.description}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        {account ? (
                            <>
                                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                        Current Price
                                    </Typography>
                                    <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
                                        {auction.currentPrice} ETH
                                    </Typography>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                        Time Remaining
                                    </Typography>
                                    <Typography variant="h6" sx={{ mb: 3, color: '#2081E2' }}>
                                        {auction.endTime}
                                    </Typography>

                                    <Box sx={{ mb: 3 }}>
                                        <TextField
                                            fullWidth
                                            label="Your bid amount (ETH)"
                                            variant="outlined"
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(e.target.value)}
                                            sx={{ mb: 2 }}
                                        />
                                        <Web3Button
                                            fullWidth
                                            onClick={handleBid}
                                        >
                                            Place Bid
                                        </Web3Button>
                                    </Box>
                                </Paper>



                            </>
                        ) : (
                            <Paper
                                elevation={2}
                                sx={{
                                    p: 4,
                                    borderRadius: 2,
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 3,
                                    mb: 3
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                                    Connect your wallet to place bids
                                </Typography>
                                <Web3Button
                                    onClick={() => navigate('/connect-wallet')}
                                    sx={{ maxWidth: 250 }}
                                >
                                    Connect Wallet
                                </Web3Button>
                            </Paper>
                        )}

                        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="h6" sx={{
                                mb: 2,
                                fontWeight: 600,
                                borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                                pb: 1
                            }}>
                                Bidding History
                            </Typography>

                            <List sx={{
                                maxHeight: '400px',
                                overflow: 'auto',
                                '&::-webkit-scrollbar': {
                                    width: '6px',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: 'rgba(0,0,0,.2)',
                                    borderRadius: '3px',
                                }
                            }}>
                                {auction.biddingHistory.map((bid, index) => (
                                    <React.Fragment key={index}>
                                        <ListItem
                                            sx={{
                                                px: 0,
                                                py: 2,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start'
                                            }}
                                        >
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                mb: 0.5
                                            }}>
                                                <BidAmount>
                                                    {bid.amount} ETH
                                                </BidAmount>
                                            </Box>

                                            <WalletAddress variant="body2">
                                                by <span className="highlight">
                                                    {bid.bidder.slice(0, 6)}...{bid.bidder.slice(-4)}
                                                </span>
                                            </WalletAddress>

                                            <BidTime>
                                                {new Date(bid.time).toLocaleString()}
                                            </BidTime>
                                        </ListItem>
                                        {index < auction.biddingHistory.length - 1 && (
                                            <Divider sx={{
                                                opacity: 0.6,
                                                borderStyle: 'dashed'
                                            }} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default AuctionDetail;