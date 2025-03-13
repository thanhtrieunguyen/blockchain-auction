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
    Button,
    CircularProgress,
    Alert,
} from '@mui/material';
import Web3Button from '../components/Web3Button';
import { initWeb3, getContracts } from '../web3';
import { useSnackbar } from 'notistack';
import { formatDistanceToNow } from 'date-fns';


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

// Helper function to resolve IPFS URLs if needed
const resolveImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/300?text=No+Image';

    // If already handled by our getAllAuctions function, we don't need to change it
    if (url.startsWith('http')) return url;

    // Handle IPFS URIs if they somehow weren't resolved earlier
    if (url.startsWith('ipfs://')) {
        return `https://ipfs.io/ipfs/${url.substring(7)}`;
    }

    return url;
};

// Helper function to format wallet addresses
const formatAddress = (address) => {
    if (!address) return '';
    if (address === '0x0000000000000000000000000000000000000000') return 'None';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const AuctionDetail = () => {
    const { account } = useContext(AccountContext);
    const { id } = useParams();
    const [auction, setAuction] = useState(null);
    const [bidAmount, setBidAmount] = useState('');
    const [minBidAmount, setMinBidAmount] = useState('0');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bidHistory, setBidHistory] = useState([]);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [countdown, setCountdown] = useState('');
    const [bidLoading, setBidLoading] = useState(false);
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        const fetchAuctionDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                const web3 = await initWeb3();
                const { nftAuction, nftMinting } = await getContracts(web3);

                // Get auction data
                const auctionData = await nftAuction.methods.auctions(id).call();

                if (!auctionData || auctionData.creator === '0x0000000000000000000000000000000000000000') {
                    throw new Error('Auction not found');
                }

                // Get NFT metadata
                let metadata = {
                    name: `NFT #${auctionData.tokenId}`,
                    image: 'https://via.placeholder.com/400x400?text=No+Image',
                    description: '',
                    attributes: []
                };

                try {
                    // Determine if NFT is from our contract or external
                    const tokenAddress = auctionData.nftContract;
                    let tokenURI;

                    if (tokenAddress.toLowerCase() === nftMinting._address.toLowerCase()) {
                        // Our NFT contract
                        tokenURI = await nftMinting.methods.tokenURI(auctionData.tokenId).call();
                    } else {
                        // External NFT contract
                        const externalNFTContract = new web3.eth.Contract(
                            [{
                                "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
                                "name": "tokenURI",
                                "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
                                "stateMutability": "view",
                                "type": "function"
                            }],
                            tokenAddress
                        );
                        tokenURI = await externalNFTContract.methods.tokenURI(auctionData.tokenId).call();
                    }

                    // Process tokenURI
                    if (tokenURI) {
                        if (tokenURI.startsWith('ipfs://')) {
                            tokenURI = `https://ipfs.io/ipfs/${tokenURI.substring(7)}`;
                        }

                        const response = await fetch(tokenURI);
                        const data = await response.json();

                        metadata = {
                            name: data.name || metadata.name,
                            image: data.image || metadata.image,
                            description: data.description || metadata.description,
                            collection: data.collection || "Unknown Collection",
                            attributes: data.attributes || []
                        };

                        // Resolve IPFS image URL if needed
                        if (metadata.image && metadata.image.startsWith('ipfs://')) {
                            metadata.image = `https://ipfs.io/ipfs/${metadata.image.substring(7)}`;
                        }
                    }
                } catch (err) {
                    console.error("Error fetching metadata:", err);
                    // Continue with default metadata
                }

                // Format the auction data
                const endTimeMs = parseInt(auctionData.endTime) * 1000;
                const now = Date.now();
                const hasEnded = now >= endTimeMs || auctionData.ended;

                // Safely convert values with web3.utils.fromWei
                let highestBid = '0';
                let startPrice = '0';

                try {
                    // Check if the values exist and are valid before converting
                    if (auctionData.highestBid && auctionData.highestBid !== '0') {
                        // Make sure we convert a string representation
                        highestBid = web3.utils.fromWei(auctionData.highestBid.toString());
                    }

                    if (auctionData.startPrice) {
                        // Make sure we convert a string representation
                        startPrice = web3.utils.fromWei(auctionData.startPrice.toString());
                    }
                } catch (conversionError) {
                    console.error("Error converting wei to ETH:", conversionError);
                    // Fallback to string values if conversion fails
                    highestBid = auctionData.highestBid ? `${parseInt(auctionData.highestBid) / 1e18}` : '0';
                    startPrice = auctionData.startPrice ? `${parseInt(auctionData.startPrice) / 1e18}` : '0';
                }

                // Set minimum bid amount
                if (parseFloat(highestBid) > 0) {
                    // If there's a bid, next bid should be at least 0.01 ETH higher
                    const nextBid = (parseFloat(highestBid) + 0.01).toFixed(2);
                    setMinBidAmount(nextBid);
                    setBidAmount(nextBid);
                } else {
                    // Otherwise use start price
                    setMinBidAmount(startPrice);
                    setBidAmount(startPrice);
                }

                // Create auction object
                const formattedAuction = {
                    id: id,
                    title: metadata.name,
                    description: metadata.description,
                    imageUrl: metadata.image,
                    collection: metadata.collection || "NFT Collection",
                    tokenId: auctionData.tokenId,
                    startPrice: startPrice,
                    currentPrice: parseFloat(highestBid) > 0 ? highestBid : startPrice,
                    highestBidder: auctionData.highestBidder,
                    creator: auctionData.creator,
                    endTime: endTimeMs,
                    endTimeFormatted: new Date(endTimeMs).toLocaleString(),
                    hasEnded: hasEnded,
                    ended: auctionData.ended,
                    status: hasEnded ? "ended" : "active",
                    contractAddress: auctionData.nftContract,
                    attributes: metadata.attributes || [] // Add attributes to the auction object
                };

                // Get bid history events from the contract (normally would use events)
                // This is a placeholder example - in a real implementation, you'd fetch events from the blockchain
                const mockBidHistory = [];

                // Always add current highest bid if it exists
                if (auctionData.highestBidder !== '0x0000000000000000000000000000000000000000') {
                    mockBidHistory.push({
                        bidder: auctionData.highestBidder,
                        amount: highestBid,
                        time: new Date().toISOString() // Would normally be the timestamp from the event
                    });
                }

                // Set state
                setAuction(formattedAuction);
                setBidHistory(mockBidHistory);

                // Calculate time remaining
                if (!hasEnded) {
                    const remainingMs = endTimeMs - now;
                    setTimeRemaining(remainingMs > 0 ? remainingMs : 0);
                }
            } catch (error) {
                console.error("Error fetching auction details:", error);
                setError(error.message || "Failed to load auction details");
            } finally {
                setLoading(false);
            }
        };

        fetchAuctionDetails();
    }, [id]);

    // Update countdown timer
    useEffect(() => {
        if (!timeRemaining) return;

        const timer = setInterval(() => {
            const now = Date.now();
            const endTime = auction?.endTime;

            if (endTime) {
                const remainingMs = endTime - now;

                if (remainingMs <= 0) {
                    clearInterval(timer);
                    setCountdown("Auction ended");

                    // Update auction status
                    setAuction(prev => prev ? { ...prev, hasEnded: true, status: "ended" } : prev);
                } else {
                    const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

                    let countdownText = '';
                    if (days > 0) countdownText += `${days}d `;
                    if (hours > 0) countdownText += `${hours}h `;
                    if (minutes > 0) countdownText += `${minutes}m `;
                    countdownText += `${seconds}s`;

                    setCountdown(countdownText);
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [auction, timeRemaining]);

    const handleBid = async () => {
        if (!account) {
            enqueueSnackbar("Please connect your wallet first", { variant: "warning" });
            return;
        }

        if (parseFloat(bidAmount) < parseFloat(minBidAmount)) {
            enqueueSnackbar(`Bid must be at least ${minBidAmount} ETH`, { variant: "error" });
            return;
        }

        try {
            setBidLoading(true);
            const web3 = await initWeb3();
            const { nftAuction } = await getContracts(web3);

            // Convert bid amount to wei
            const bidAmountWei = web3.utils.toWei(bidAmount.toString(), 'ether');

            // Place bid
            await nftAuction.methods.bid(id).send({
                from: account,
                value: bidAmountWei
            });

            enqueueSnackbar("Bid placed successfully!", { variant: "success" });

            // Refresh auction data
            window.location.reload();
        } catch (error) {
            console.error("Error placing bid:", error);
            enqueueSnackbar(error.message || "Failed to place bid", { variant: "error" });
        } finally {
            setBidLoading(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="xl">
                <Box sx={{ textAlign: 'center', py: 8, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="xl">
                <Box sx={{ py: 4 }}>
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                    <Button onClick={() => navigate('/auctions')} variant="outlined">
                        Back to Auctions
                    </Button>
                </Box>
            </Container>
        );
    }

    if (!auction) {
        return (
            <Container maxWidth="xl">
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Alert severity="warning">Auction not found</Alert>
                </Box>
            </Container>
        );
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
                                    src={resolveImageUrl(auction.imageUrl)}
                                    alt={auction.title}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block'
                                    }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                                    }}
                                />
                            </Box>

                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                                {auction.title}
                            </Typography>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Collection
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {auction.collection}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Token ID
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {auction.tokenId}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Status
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontWeight: 600,
                                            color: auction.status === 'active' ? 'success.main' : 'text.secondary'
                                        }}
                                    >
                                        {auction.status === 'active' ? 'Live' : 'Ended'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Creator
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                        {formatAddress(auction.creator)}
                                    </Typography>
                                </Grid>
                            </Grid>

                            {/* <Typography variant="body1" sx={{ mb: 3 }}>
                                {auction.description || 'No description available for this NFT.'}
                            </Typography> */}

                            {/* Display NFT Attributes */}
                            {auction.attributes && auction.attributes.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                        Attributes
                                    </Typography>
                                    <Grid container spacing={1}>
                                        {auction.attributes.map((attr, index) => (
                                            <Grid item xs={6} sm={4} md={3} key={index}>
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        bgcolor: 'rgba(32, 129, 226, 0.1)',
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        textAlign: 'center',
                                                        height: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{ textTransform: 'uppercase', fontWeight: 500, mb: 0.5 }}
                                                    >
                                                        {attr.trait_type || 'Trait'}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ fontWeight: 600 }}
                                                        noWrap
                                                        title={attr.value || attr.name || '-'}
                                                    >
                                                        {attr.value || attr.name || '-'}
                                                    </Typography>
                                                    {attr.rarity && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Rarity: {attr.rarity}
                                                        </Typography>
                                                    )}
                                                </Paper>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            )}

                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Contract Address
                                </Typography>
                                <Typography
                                    variant="body2"
                                    component="div"
                                    sx={{
                                        wordBreak: 'break-all',
                                        fontFamily: 'monospace',
                                        bgcolor: 'rgba(0,0,0,0.03)',
                                        p: 1,
                                        borderRadius: 1
                                    }}
                                >
                                    {auction.contractAddress}
                                </Typography>
                            </Box>
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
                                        {auction.status === 'active' ? 'Time Remaining' : 'Auction Ended On'}
                                    </Typography>
                                    <Typography variant="h6" sx={{ mb: 3, color: auction.status === 'active' ? '#2081E2' : 'text.secondary' }}>
                                        {auction.status === 'active' ? countdown : new Date(auction.endTime).toLocaleString()}
                                    </Typography>

                                    {auction.status === 'active' && account.toLowerCase() !== auction.creator.toLowerCase() && (
                                        <Box sx={{ mb: 3 }}>
                                            <TextField
                                                fullWidth
                                                label="Your bid amount (ETH)"
                                                variant="outlined"
                                                type="number"
                                                value={bidAmount}
                                                onChange={(e) => setBidAmount(e.target.value)}
                                                helperText={`Minimum bid: ${minBidAmount} ETH`}
                                                InputProps={{
                                                    inputProps: { min: minBidAmount, step: "0.01" }
                                                }}
                                                sx={{ mb: 2 }}
                                            />
                                            <Web3Button
                                                fullWidth
                                                onClick={handleBid}
                                                disabled={bidLoading || account.toLowerCase() === auction.creator.toLowerCase()}
                                            >
                                                {bidLoading ? 'Placing Bid...' : 'Place Bid'}
                                            </Web3Button>

                                            {account.toLowerCase() === auction.creator.toLowerCase() && (
                                                <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                                                    You cannot bid on your own auction
                                                </Typography>
                                            )}
                                        </Box>
                                    )}

                                    {auction.status !== 'active' && (
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            This auction has ended and is no longer accepting bids
                                        </Alert>
                                    )}

                                    {auction.highestBidder !== '0x0000000000000000000000000000000000000000' && (
                                        <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                Highest Bidder
                                            </Typography>
                                            <Typography variant="body1">
                                                {formatAddress(auction.highestBidder)}
                                                {auction.highestBidder.toLowerCase() === account.toLowerCase() && (
                                                    <Typography component="span" sx={{ ml: 1, color: 'primary.main', fontWeight: 500 }}>
                                                        (You)
                                                    </Typography>
                                                )}
                                            </Typography>
                                        </Box>
                                    )}
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

                            {bidHistory.length > 0 ? (
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
                                    {bidHistory.map((bid, index) => (
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
                                                        {formatAddress(bid.bidder)}
                                                        {bid.bidder.toLowerCase() === account?.toLowerCase() && ' (You)'}
                                                    </span>
                                                </WalletAddress>

                                                <BidTime>
                                                    {new Date(bid.time).toLocaleString()}
                                                </BidTime>
                                            </ListItem>
                                            {index < bidHistory.length - 1 && (
                                                <Divider sx={{
                                                    opacity: 0.6,
                                                    borderStyle: 'dashed'
                                                }} />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                    No bids have been placed on this auction yet.
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default AuctionDetail;