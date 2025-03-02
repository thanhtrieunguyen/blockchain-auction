import React, { useContext, useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Box,
    Typography,
    TextField,
    Paper,
    InputAdornment,
    CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import Web3Button from '../components/Web3Button';
import { AccountContext } from '../context/AccountContext';
import { initWeb3, getContracts } from '../web3';
import { useSnackbar } from 'notistack';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
}));

const NFTPreview = styled(Box)(({ theme }) => ({
    width: '100%',
    height: 400,
    borderRadius: '12px',
    border: '2px solid rgba(32, 129, 226, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(32, 129, 226, 0.05)',
    overflow: 'hidden',
}));


const CreateAuction = () => {
    const navigate = useNavigate();
    const { account } = useContext(AccountContext);
    const [formData, setFormData] = useState({
        tokenAddress: '',
        tokenId: '',
        startingPrice: '',
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24h from now
    });
    const [loading, setLoading] = useState(false);
    const [nftData, setNftData] = useState(null);
    const [error, setError] = useState('');
    const { enqueueSnackbar } = useSnackbar();

    // Hàm này sẽ gọi API để lấy thông tin NFT
        const fetchNFTData = async () => {
        if (!formData.tokenAddress || !formData.tokenId || !account) return;
    
        setLoading(true);
        setError('');
        try {
            const web3 = await initWeb3();
            const { nftMinting } = await getContracts(web3);
            
            // Kiểm tra tính hợp lệ của tokenId
            try {
                const tokenURI = await nftMinting.methods.tokenURI(formData.tokenId).call();
                let metadata = {};
                
                // Thử lấy metadata từ tokenURI
                if (tokenURI.startsWith('http')) {
                    const response = await fetch(tokenURI);
                    metadata = await response.json();
                }
                
                // Kiểm tra quyền sở hữu
                const owner = await nftMinting.methods.ownerOf(formData.tokenId).call();
                const isOwner = owner.toLowerCase() === account.toLowerCase();
                
                if (!isOwner) {
                    setError('You do not own this NFT');
                    setNftData(null);
                } else {
                    setNftData({
                        imageUrl: metadata.image || "https://via.placeholder.com/400?text=NFT+Preview",
                        name: metadata.name || `NFT #${formData.tokenId}`,
                        collection: metadata.collection || "Your NFT Collection",
                        description: metadata.description || ""
                    });
                }
            } catch (err) {
                console.error("Error fetching NFT data:", err);
                setError('Could not fetch NFT data. Please verify the token address and ID.');
                setNftData(null);
            }
        } catch (err) {
            setError('Could not connect to blockchain. Please try again.');
            setNftData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const web3 = await initWeb3();
            const { nftAuction, nftMinting } = await getContracts(web3);

            // Validate inputs
            if (!formData.tokenAddress || !formData.tokenId || !formData.startingPrice || !formData.endDate) {
                throw new Error('Please fill in all required fields');
            }

            if (parseFloat(formData.startingPrice) <= 0) {
                throw new Error('Starting price must be greater than 0');
            }

            const now = new Date();
            if (formData.endDate <= now) {
                throw new Error('End date must be in the future');
            }

            // Convert values for contract interaction
            const startingPriceWei = web3.utils.toWei(formData.startingPrice, 'ether');
            const durationInMinutes = Math.floor((formData.endDate - now) / (60 * 1000));

            // Check NFT ownership
            const owner = await nftMinting.methods.ownerOf(formData.tokenId).call();
            if (owner.toLowerCase() !== account.toLowerCase()) {
                throw new Error('You do not own this NFT');
            }

            // Approve NFT transfer
            try {
                const approved = await nftMinting.methods.getApproved(formData.tokenId).call();
                if (approved.toLowerCase() !== nftAuction._address.toLowerCase()) {
                    setLoading(true);
                    // Hiển thị thông báo phê duyệt
                    enqueueSnackbar('Please confirm the approval transaction in your wallet', {
                        variant: 'info',
                        autoHideDuration: 5000,
                    });

                    await nftMinting.methods
                        .approve(nftAuction._address, formData.tokenId)
                        .send({
                            from: account
                        });

                    // Hiển thị thông báo phê duyệt thành công
                    enqueueSnackbar('NFT approved successfully! Please confirm the auction creation', {
                        variant: 'success',
                        autoHideDuration: 3000,
                    });
                }
            } catch (error) {
                throw new Error('Failed to approve NFT transfer: ' + error.message);
            }

            // Create auction
            try {
                // Hiển thị thông báo tạo đấu giá
                enqueueSnackbar('Please confirm the auction creation transaction in your wallet', {
                    variant: 'info',
                    autoHideDuration: 5000,
                });

                await nftAuction.methods
                    .createAuction(
                        nftMinting._address,
                        formData.tokenId,
                        startingPriceWei,
                        durationInMinutes
                    )
                    .send({
                        from: account
                    });

                // Thành công - chuyển hướng đến my auctions
                enqueueSnackbar('Auction created successfully!', {
                    variant: 'success',
                    autoHideDuration: 3000,
                });
                navigate('/my-auctions');
            } catch (error) {
                throw new Error('Failed to create auction: ' + error.message);
            }
        } catch (error) {
            console.error("Error creating auction:", error);
            setError(error.message || 'Failed to create auction. Please try again.');
            enqueueSnackbar(error.message || 'Failed to create auction', {
                variant: 'error',
                autoHideDuration: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!account) {
            navigate('/', {
                replace: true,
                state: { message: 'Please connect your wallet to create an auction' }
            });
        }
    }, [account, navigate]);

    if (!account) {
        return null;
    }

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 4 }}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        fontWeight: 700,
                        mb: 4,
                    }}
                >
                    Create New Auction
                </Typography>

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={4}>
                        {/* Left Column - NFT Preview */}
                        <Grid item xs={12} md={6}>
                            <StyledPaper>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                    NFT Preview
                                </Typography>
                                <NFTPreview>
                                    {loading ? (
                                        <CircularProgress />
                                    ) : nftData ? (
                                        <img
                                            src={nftData.imageUrl}
                                            alt={nftData.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                            }}
                                        />
                                    ) : (
                                        <Typography color="textSecondary">
                                            Enter token details to preview NFT
                                        </Typography>
                                    )}
                                </NFTPreview>
                                {nftData && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="h6">{nftData.name}</Typography>
                                        <Typography color="textSecondary">
                                            {nftData.collection}
                                        </Typography>
                                    </Box>
                                )}
                                {error && (
                                    <Typography color="error" sx={{ mt: 2 }}>
                                        {error}
                                    </Typography>
                                )}
                            </StyledPaper>
                        </Grid>

                        {/* Right Column - Auction Details */}
                        <Grid item xs={12} md={6}>
                            <StyledPaper>
                                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                    Auction Details
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <TextField
                                        label="Token Address"
                                        fullWidth
                                        value={formData.tokenAddress}
                                        onChange={(e) => {
                                            setFormData({ ...formData, tokenAddress: e.target.value });
                                            if (formData.tokenId) fetchNFTData();
                                        }}
                                        required
                                    />

                                    <TextField
                                        label="Token ID"
                                        fullWidth
                                        value={formData.tokenId}
                                        onChange={(e) => {
                                            setFormData({ ...formData, tokenId: e.target.value });
                                            if (formData.tokenAddress) fetchNFTData();
                                        }}
                                        required
                                    />

                                    <TextField
                                        label="Starting Price"
                                        fullWidth
                                        type="number"
                                        value={formData.startingPrice}
                                        onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">ETH</InputAdornment>,
                                        }}
                                        required
                                    />

                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <DateTimePicker
                                            label="End Date"
                                            value={formData.endDate}
                                            onChange={(newValue) => setFormData({ ...formData, endDate: newValue })}
                                            minDateTime={new Date()}
                                            sx={{ width: '100%' }}
                                        />
                                    </LocalizationProvider>

                                    <Web3Button
                                        type="submit"
                                        fullWidth
                                        disabled={!nftData || loading}
                                    >
                                        {loading ? 'Creating Auction...' : 'Create Auction'}
                                    </Web3Button>
                                </Box>
                            </StyledPaper>
                        </Grid>
                    </Grid>
                </form>
            </Box>
        </Container>
    );
};

export default CreateAuction;