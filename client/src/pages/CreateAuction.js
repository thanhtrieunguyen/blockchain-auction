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

    // Hàm này sẽ gọi API để lấy thông tin NFT
    const fetchNFTData = async () => {
        if (!formData.tokenAddress || !formData.tokenId) return;

        setLoading(true);
        setError('');
        try {
            // Đây là nơi bạn sẽ gọi API để lấy metadata của NFT
            // Ví dụ:
            // const response = await fetch(`/api/nft/${formData.tokenAddress}/${formData.tokenId}`);
            // const data = await response.json();

            // Tạm thời dùng dữ liệu mẫu
            const mockData = {
                imageUrl: "https://i.seadn.io/s/raw/files/5d86dafbc10d03c6589d5d920ada4379.jpg",
                name: "Sample NFT #" + formData.tokenId,
                collection: "Sample Collection"
            };

            setNftData(mockData);
        } catch (err) {
            setError('Could not fetch NFT data. Please verify the token address and ID.');
            setNftData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        // Xử lý tạo auction ở đây
        console.log('Form submitted:', formData);
        navigate('/my-auctions');
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
                                        Create Auction
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