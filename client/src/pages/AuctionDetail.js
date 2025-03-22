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
import erc721ABI from '../abis/erc721ABI.json';

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

const AddressBadge = styled(Box)(({ theme }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(32, 129, 226, 0.1)',
    borderRadius: '8px',
    padding: '4px 8px',
    margin: '2px 0',
    border: '1px solid rgba(32, 129, 226, 0.2)',
    fontFamily: 'monospace',
    fontWeight: 500,
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

// Enhanced helper function to format wallet addresses
const formatAddress = (address) => {
    if (!address) return '';
    if (address === '0x0000000000000000000000000000000000000000') return 'Không có';
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
    const [canDeposit, setCanDeposit] = useState(false);
    const [isNFTDeposited, setIsNFTDeposited] = useState(true);


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
                    throw new Error('Không tìm thấy phiên đấu giá');
                }

                // Explicitly convert tokenId to string and log it for debugging
                const tokenIdRaw = auctionData.tokenId;
                const tokenIdString = String(tokenIdRaw);

                console.log("Token ID raw:", tokenIdRaw);
                console.log("Token ID as string:", tokenIdString);

                const isDeposited = auctionData.nftDeposited;
                setIsNFTDeposited(isDeposited);

                // Check if NFT needs to be deposited and user is the creator
                const needsDeposit = !isDeposited &&
                    account &&
                    account.toLowerCase() === auctionData.creator.toLowerCase();
                setCanDeposit(needsDeposit);

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
                    if (auctionData.highestBid && auctionData.highestBid !== '0' && auctionData.highestBid !== undefined) {
                        // Make sure we convert a string representation
                        highestBid = web3.utils.fromWei(auctionData.highestBid.toString(), 'ether');
                    }

                    if (auctionData.startPrice && auctionData.startPrice !== undefined) {
                        // Make sure we convert a string representation
                        startPrice = web3.utils.fromWei(auctionData.startPrice.toString(), 'ether');
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
                    collection: metadata.collection || "Bộ Sưu Tập NFT",
                    tokenId: tokenIdString, // Ensure tokenId is a string
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

                // Debug to verify tokenId is present
                console.log("Token ID from blockchain:", auctionData.tokenId);
                console.log("Formatted auction object:", formattedAuction);

                // Get bid history events from the blockchain
                try {
                    // Fetch all NewBid events for this auction
                    const events = await nftAuction.getPastEvents('NewBid', {
                        filter: { auctionId: id },
                        fromBlock: 0,
                        toBlock: 'latest'
                    });

                    console.log("Bid events:", events);

                    // Process events one by one to avoid Promise.all errors
                    const bidHistoryEntries = [];

                    for (const event of events) {
                        try {
                            // Convert BigInt values to regular JavaScript numbers
                            const blockNumber = typeof event.blockNumber === 'bigint'
                                ? Number(event.blockNumber)
                                : Number(event.blockNumber);

                            // Get the block timestamp
                            let timestamp;
                            try {
                                // Try to get block timestamp directly
                                const block = await web3.eth.getBlock(blockNumber);
                                timestamp = block ? Number(block.timestamp) : Math.floor(Date.now() / 1000);
                            } catch (blockError) {
                                console.error("Error fetching block timestamp:", blockError);
                                timestamp = Math.floor(Date.now() / 1000);
                            }

                            // Convert to milliseconds for JavaScript Date
                            const timeValue = timestamp * 1000;

                            // Create the bid entry with safe conversions
                            bidHistoryEntries.push({
                                bidder: event.returnValues.bidder,
                                amount: web3.utils.fromWei(event.returnValues.amount.toString(), 'ether'),
                                time: new Date(timeValue),
                                timestamp: timeValue,
                                blockNumber
                            });
                        } catch (eventError) {
                            console.error("Error processing bid event:", eventError, event);
                        }
                    }

                    // Sort by timestamp (descending)
                    bidHistoryEntries.sort((a, b) => b.timestamp - a.timestamp);

                    // Update bid history
                    setBidHistory(bidHistoryEntries);

                    console.log("Bid history:", bidHistoryEntries);
                } catch (eventError) {
                    console.error("Error fetching bid history events:", eventError);

                    // Fallback to just showing the current highest bid
                    const fallbackBidHistory = [];
                    if (auctionData.highestBidder !== '0x0000000000000000000000000000000000000000') {
                        fallbackBidHistory.push({
                            bidder: auctionData.highestBidder,
                            amount: highestBid,
                            time: new Date(),
                            timestamp: Date.now()
                        });
                    }
                    setBidHistory(fallbackBidHistory);
                }

                // Set auction state
                setAuction(formattedAuction);

                // Calculate time remaining
                if (!hasEnded) {
                    const remainingMs = endTimeMs - now;
                    setTimeRemaining(remainingMs > 0 ? remainingMs : 0);
                }
            } catch (error) {
                console.error("Error fetching auction details:", error);
                setError(error.message || "Không thể tải thông tin phiên đấu giá");
            } finally {
                setLoading(false);
            }
        };

        fetchAuctionDetails();
    }, [id, account]);

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
                    setCountdown("Phiên đấu giá đã kết thúc");

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

    const handleDepositNFT = async () => {
        try {
            setLoading(true);
            const web3 = await initWeb3();
            const { nftAuction } = await getContracts(web3);

            // First approve the NFT transfer if needed
            const nftContract = new web3.eth.Contract(erc721ABI, auction.contractAddress);
            const isApproved = await nftContract.methods.isApprovedForAll(account, nftAuction._address).call();
            const approvedAddress = await nftContract.methods.getApproved(auction.tokenId).call();

            if (!isApproved && approvedAddress.toLowerCase() !== nftAuction._address.toLowerCase()) {
                await nftContract.methods.approve(nftAuction._address, auction.tokenId).send({ from: account });
            }

            // Deposit NFT
            await nftAuction.methods.depositNFT(id).send({ from: account });

            enqueueSnackbar("NFT đã được gửi vào hợp đồng thành công!", { variant: "success" });
            window.location.reload();
        } catch (error) {
            console.error("Error depositing NFT:", error);
            enqueueSnackbar(error.message || "Không thể gửi NFT", { variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleBid = async () => {
        if (!account || !bidAmount) return;

        try {
            setBidLoading(true);
            const web3 = await initWeb3();
            const { nftAuction } = await getContracts(web3);
            /* global BigInt */
            // Convert bid amount from ETH to Wei using web3.utils
            const bidAmountWei = web3.utils.toWei(bidAmount.toString(), 'ether');

            // Get current highest bid in Wei
            const auctionData = await nftAuction.methods.auctions(id).call();
            const currentHighestBid = BigInt(auctionData.highestBid);

            // Convert bidAmountWei to BigInt for comparison
            const newBidAmount = BigInt(bidAmountWei);

            // Kiểm tra giá đặt phải cao hơn giá cao nhất hiện tại
            if (newBidAmount <= currentHighestBid) {
                throw new Error('Bid amount must be higher than current highest bid');
            }

            // Place bid
            await nftAuction.methods.bid(id).send({
                from: account,
                value: bidAmountWei
            });

            enqueueSnackbar('Đặt giá thành công!', { variant: 'success' });
            window.location.reload();
        } catch (error) {
            console.error('Error placing bid:', error);
            enqueueSnackbar(
                error.message || 'Không thể đặt giá. Vui lòng thử lại.',
                { variant: 'error' }
            );
        } finally {
            setBidLoading(false);
        }
    };

    // Helper function to extract revert reason from error
    const extractRevertReason = (error) => {
        if (!error) return null;

        // Check for revert reason in error message
        if (error.message) {
            // Check for common error patterns
            if (error.message.includes("NFT not deposited yet")) {
                return "NFT chưa được gửi vào hợp đồng. Vui lòng liên hệ người tạo đấu giá.";
            }
            if (error.message.includes("Auction has ended")) {
                return "Phiên đấu giá đã kết thúc";
            }
            if (error.message.includes("Creator cannot bid")) {
                return "Người tạo đấu giá không thể tham gia đấu giá";
            }
            if (error.message.includes("Bid must be greater than")) {
                return "Giá đặt phải cao hơn giá hiện tại";
            }

            // Try to extract reason string from error
            const revertReasonMatch = error.message.match(/reason string: ['"](.+?)['"]/);
            if (revertReasonMatch && revertReasonMatch[1]) {
                return revertReasonMatch[1];
            }
        }

        return null;
    };

    // Create a component for displaying wallet addresses (without copy functionality)
    const WalletAddressBadge = ({ address }) => {
        if (!address) return null;

        return (
            <AddressBadge>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                    {formatAddress(address)}
                </Typography>
            </AddressBadge>
        );
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
                        Quay lại Đấu Giá
                    </Button>
                </Box>
            </Container>
        );
    }

    if (!auction) {
        return (
            <Container maxWidth="xl">
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Alert severity="warning">Không tìm thấy phiên đấu giá</Alert>
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
                                        Bộ Sưu Tập
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
                                        {auction.tokenId !== undefined ? auction.tokenId : "Không có"}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Trạng Thái
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontWeight: 600,
                                            color: auction.status === 'active' ? 'success.main' : 'text.secondary'
                                        }}
                                    >
                                        {auction.status === 'active' ? 'Đang Diễn Ra' : 'Đã Kết Thúc'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Người Tạo
                                    </Typography>
                                    <WalletAddressBadge address={auction.creator} />
                                </Grid>
                            </Grid>

                            {/* <Typography variant="body1" sx={{ mb: 3 }}>
                                {auction.description || 'No description available for this NFT.'}
                            </Typography> */}

                            {/* Display NFT Attributes */}
                            {auction.attributes && auction.attributes.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                        Thuộc Tính
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
                                                        {attr.trait_type || 'Đặc Điểm'}
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
                                                            Độ Hiếm: {attr.rarity}
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
                                    Địa Chỉ Hợp Đồng
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
                                        Giá Hiện Tại
                                    </Typography>
                                    <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
                                        {auction.currentPrice} ETH
                                    </Typography>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                        {auction.status === 'active' ? 'Thời Gian Còn Lại' : 'Phiên Đấu Giá Kết Thúc Vào'}
                                    </Typography>
                                    <Typography variant="h6" sx={{ mb: 3, color: auction.status === 'active' ? '#2081E2' : 'text.secondary' }}>
                                        {auction.status === 'active' ? countdown : new Date(auction.endTime).toLocaleString()}
                                    </Typography>

                                    {auction.status === 'active' && account.toLowerCase() !== auction.creator.toLowerCase() && (
                                        <Box sx={{ mb: 3 }}>
                                            <TextField
                                                fullWidth
                                                label="Số tiền đấu giá của bạn (ETH)"
                                                variant="outlined"
                                                type="number"
                                                value={bidAmount}
                                                onChange={(e) => setBidAmount(e.target.value)}
                                                helperText={`Giá đấu tối thiểu: ${minBidAmount} ETH`}
                                                InputProps={{
                                                    inputProps: { min: minBidAmount, step: "0.01" }
                                                }}
                                                sx={{ mb: 2 }}
                                            />
                                            <Web3Button
                                                fullWidth
                                                onClick={handleBid}
                                                disabled={bidLoading || !isNFTDeposited || account.toLowerCase() === auction.creator.toLowerCase()}
                                            >
                                                {!isNFTDeposited
                                                    ? 'Chờ người tạo gửi NFT'
                                                    : bidLoading
                                                        ? 'Đang Đặt Giá...'
                                                        : 'Đặt Giá'}
                                            </Web3Button>

                                            {!isNFTDeposited && (
                                                <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                                                    Không thể đặt giá vì NFT chưa được gửi vào hợp đồng
                                                </Typography>
                                            )}

                                            {account.toLowerCase() === auction.creator.toLowerCase() && (
                                                <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                                                    Bạn không thể đấu giá trong phiên đấu giá của chính mình
                                                </Typography>
                                            )}
                                        </Box>
                                    )}

                                    {!isNFTDeposited && (
                                        <Alert severity="warning" sx={{ mb: 3 }}>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                NFT chưa được gửi vào hợp đồng
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                {canDeposit
                                                    ? "Bạn cần gửi NFT vào hợp đồng để kích hoạt đấu giá. Người khác sẽ không thể đặt giá cho đến khi bạn hoàn tất bước này."
                                                    : "Người tạo đấu giá chưa gửi NFT vào hợp đồng. Bạn không thể đặt giá cho đến khi NFT được gửi vào."}
                                            </Typography>
                                            {canDeposit && (
                                                <Button
                                                    variant="contained"
                                                    color="warning"
                                                    onClick={handleDepositNFT}
                                                    disabled={loading}
                                                    sx={{ mt: 2 }}
                                                >
                                                    {loading ? <CircularProgress size={24} /> : "Gửi NFT và kích hoạt đấu giá"}
                                                </Button>
                                            )}
                                        </Alert>
                                    )}

                                    {auction.status !== 'active' && (
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            Phiên đấu giá này đã kết thúc và không còn nhận đặt giá
                                        </Alert>
                                    )}

                                    {auction.highestBidder !== '0x0000000000000000000000000000000000000000' && (
                                        <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                Người Đặt Giá Cao Nhất
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <WalletAddressBadge address={auction.highestBidder} />
                                                {account && auction.highestBidder && auction.highestBidder.toLowerCase() === account.toLowerCase() && (
                                                    <Typography component="span" sx={{ ml: 1, color: 'primary.main', fontWeight: 500 }}>
                                                        (Bạn)
                                                    </Typography>
                                                )}
                                            </Box>
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
                                    Kết nối ví của bạn để đặt giá
                                </Typography>
                                <Web3Button
                                    onClick={() => navigate('/connect-wallet')}
                                    sx={{ maxWidth: 250 }}
                                >
                                    Kết Nối Ví
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
                                Lịch Sử Đấu Giá
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
                                                    bởi <WalletAddressBadge address={bid.bidder || ''} />
                                                    {bid.bidder && account && bid.bidder.toLowerCase() === account.toLowerCase() ? ' (Bạn)' : ''}
                                                </WalletAddress>

                                                <BidTime>
                                                    {bid.time ? bid.time.toLocaleString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    }) : 'Thời gian không xác định'}
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
                                    Chưa có lượt đấu giá nào cho phiên đấu giá này.
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