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
    Button,
    FormControl,
    FormControlLabel,
    RadioGroup,
    Radio,
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

// Helper function to resolve IPFS URLs or other formats
const resolveIPFSUri = (uri) => {
    if (!uri) return null;
    
    // Handle IPFS URIs
    if (uri.startsWith('ipfs://')) {
        // Use multiple IPFS gateways in case one fails
        return `https://ipfs.io/ipfs/${uri.substring(7)}`;
    }
    
    // Handle base64 data URIs
    if (uri.startsWith('data:')) {
        return uri;
    }
    
    // Handle relative URLs by assuming a standard base
    if (uri.startsWith('/')) {
        console.log("Relative URI found:", uri);
        return uri;
    }
    
    // For http/https URLs, return as is
    return uri;
};

const CreateAuction = () => {
    const navigate = useNavigate();
    const { account } = useContext(AccountContext);
    const [formData, setFormData] = useState({
        tokenAddress: '',
        tokenId: '',
        startingPrice: '',
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24h from now
        durationMode: 'date', // 'date' or 'duration'
        durationMinutes: 60, // default 1 hour
    });
    const [loading, setLoading] = useState(false);
    const [nftData, setNftData] = useState(null);
    const [error, setError] = useState('');
    const { enqueueSnackbar } = useSnackbar();

    // Hàm này sẽ gọi API để lấy thông tin NFT
    const fetchNFTData = async () => {
        if (!formData.tokenAddress || !formData.tokenId) {
            return;
        }
        
        setLoading(true);
        setError('');
        setNftData(null);
        
        try {
            const web3 = await initWeb3();
            if (!web3) {
                throw new Error('Failed to initialize Web3');
            }
            
            // Validate token address format
            if (!web3.utils.isAddress(formData.tokenAddress)) {
                setError('Please enter a valid token address');
                setLoading(false);
                return;
            }
            
            // Validate token ID is a positive number
            const tokenId = parseInt(formData.tokenId);
            if (isNaN(tokenId) || tokenId < 0) {
                setError('Token ID must be a valid positive number');
                setLoading(false);
                return;
            }
            
            console.log("Current connected account:", account);
            
            try {
                // First, try to use our known contract interface
                const { nftAuction, nftMinting } = await getContracts(web3);
                
                // Check if the provided address matches our NFTMinting contract
                if (formData.tokenAddress.toLowerCase() === nftMinting._address.toLowerCase()) {
                    // Use our contract methods
                    try {
                        // Check if token exists and who owns it
                        let owner;
                        try {
                            owner = await nftMinting.methods.ownerOf(tokenId).call();
                            console.log("NFT Owner Address:", owner);
                            console.log("Your Account Address:", account);
                        } catch (ownerError) {
                            throw new Error('This token ID does not exist in the provided contract');
                        }

                        // Verify the token is owned by the connected account
                        const normalizedOwner = owner.toLowerCase();
                        const normalizedAccount = account.toLowerCase();
                        console.log("Normalized Owner:", normalizedOwner);
                        console.log("Normalized Account:", normalizedAccount);
                        
                        if (normalizedOwner !== normalizedAccount) {
                            setError(`You don't own this NFT. It's owned by ${owner}`);
                            setLoading(false);
                            return;
                        }
                        
                        // Get token metadata URI
                        let tokenURI;
                        try {
                            tokenURI = await nftMinting.methods.tokenURI(tokenId).call();
                            console.log("Raw tokenURI:", tokenURI);
                        } catch (uriError) {
                            console.warn("Error fetching tokenURI:", uriError);
                            throw new Error("Unable to retrieve token metadata");
                        }
                        
                        // Fetch metadata
                        if (tokenURI) {
                            try {
                                // Resolve the token URI (handle IPFS, etc)
                                const resolvedTokenURI = resolveIPFSUri(tokenURI);
                                console.log("Resolved tokenURI:", resolvedTokenURI);
                                
                                if (!resolvedTokenURI) {
                                    throw new Error("Cannot resolve token metadata URI");
                                }
                                
                                // Fetch metadata
                                const response = await fetch(resolvedTokenURI);
                                const metadata = await response.json();
                                console.log("NFT Metadata:", metadata);
                                
                                // Resolve image URI from metadata
                                let imageUrl = metadata.image;
                                if (!imageUrl) {
                                    throw new Error("No image found in NFT metadata");
                                }
                                
                                imageUrl = resolveIPFSUri(imageUrl);
                                console.log("Resolved Image URL:", imageUrl);
                                
                                setNftData({
                                    name: metadata.name || `Token #${tokenId}`,
                                    imageUrl: imageUrl,
                                    collection: metadata.collection || "NFT Collection",
                                    description: metadata.description || "",
                                    attributes: metadata.attributes || []
                                });
                            } catch (metadataError) {
                                console.warn("Error fetching metadata:", metadataError);
                                throw new Error(`Failed to get NFT metadata: ${metadataError.message}`);
                            }
                        } else {
                            throw new Error("No metadata URI returned from the contract");
                        }
                    } catch (error) {
                        console.warn("Failed to use our contract methods:", error);
                        throw new Error(error.message || 'Could not fetch NFT data');
                    }
                } else {
                    // Try to use a generic ERC721 interface for other contracts
                    const erc721ABI = [
                        {
                            "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
                            "name": "tokenURI",
                            "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
                            "name": "ownerOf",
                            "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                            "stateMutability": "view",
                            "type": "function"
                        }
                    ];
                    
                    const externalNFTContract = new web3.eth.Contract(erc721ABI, formData.tokenAddress);
                    
                    try {
                        // Check if token exists and who owns it
                        let owner;
                        try {
                            owner = await externalNFTContract.methods.ownerOf(tokenId).call();
                            console.log("NFT Owner Address:", owner);
                            console.log("Your Account Address:", account);
                        } catch (ownerError) {
                            throw new Error('This token ID does not exist in the provided contract');
                        }

                        // Verify the token is owned by the connected account
                        const normalizedOwner = owner.toLowerCase();
                        const normalizedAccount = account.toLowerCase();
                        console.log("Normalized Owner:", normalizedOwner);
                        console.log("Normalized Account:", normalizedAccount);
                        
                        if (normalizedOwner !== normalizedAccount) {
                            setError(`You don't own this NFT. It's owned by ${owner}`);
                            setLoading(false);
                            return;
                        }
                        
                        // Try to get token URI
                        let tokenURI;
                        try {
                            tokenURI = await externalNFTContract.methods.tokenURI(tokenId).call();
                            console.log("Raw tokenURI (external):", tokenURI);
                            
                            if (!tokenURI) {
                                throw new Error("Contract returned empty token URI");
                            }
                        } catch (err) {
                            console.warn("Contract doesn't support tokenURI method:", err);
                            throw new Error("This contract doesn't support the standard tokenURI method");
                        }
                        
                        // Fetch metadata
                        try {
                            // Resolve the token URI (handle IPFS, etc)
                            const resolvedTokenURI = resolveIPFSUri(tokenURI);
                            console.log("Resolved tokenURI (external):", resolvedTokenURI);
                            
                            if (!resolvedTokenURI) {
                                throw new Error("Cannot resolve token metadata URI");
                            }
                            
                            // Fetch metadata
                            const response = await fetch(resolvedTokenURI);
                            const metadata = await response.json();
                            console.log("External NFT Metadata:", metadata);
                            
                            // Resolve image URI from metadata
                            let imageUrl = metadata.image;
                            if (!imageUrl) {
                                throw new Error("No image found in NFT metadata");
                            }
                            
                            imageUrl = resolveIPFSUri(imageUrl);
                            console.log("Resolved External Image URL:", imageUrl);
                            
                            setNftData({
                                name: metadata.name || `Token #${tokenId}`,
                                imageUrl: imageUrl,
                                collection: metadata.collection || metadata.asset_contract?.name || "External Collection",
                                description: metadata.description || "",
                                attributes: metadata.attributes || []
                            });
                        } catch (metadataError) {
                            console.warn("Error fetching external metadata:", metadataError);
                            throw new Error(`Failed to get NFT metadata: ${metadataError.message}`);
                        }
                    } catch (error) {
                        console.error("Error interacting with external NFT contract:", error);
                        throw new Error(error.message || 'Token ID does not exist or contract is not ERC-721 compatible');
                    }
                }
            } catch (err) {
                console.error("Error fetching NFT data:", err);
                setError(err.message || 'Could not fetch NFT data. Please verify the token address and ID.');
                setNftData(null);
            }
        } catch (err) {
            console.error("Web3 connection error:", err);
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
            let durationInMinutes;

            if (formData.durationMode === 'date') {
                if (formData.endDate <= now) {
                    throw new Error('End date must be in the future');
                }
                durationInMinutes = Math.floor((formData.endDate - now) / (60 * 1000));
            } else {
                if (formData.durationMinutes <= 0) {
                    throw new Error('Duration must be greater than 0 minutes');
                }
                durationInMinutes = parseInt(formData.durationMinutes);
            }

            // Convert values for contract interaction
            const startingPriceWei = web3.utils.toWei(formData.startingPrice, 'ether');

            // Check if we're using our NFT contract or an external contract
            let nftContract;
            let tokenId = parseInt(formData.tokenId);
            
            // Determine which contract to use
            if (formData.tokenAddress.toLowerCase() === nftMinting._address.toLowerCase()) {
                nftContract = nftMinting;
            } else {
                // Create a contract instance for the external NFT
                const erc721ABI = [
                    {
                        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
                        "name": "ownerOf",
                        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                        "stateMutability": "view",
                        "type": "function"
                    },
                    {
                        "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
                        "name": "approve",
                        "outputs": [],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    },
                    {
                        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
                        "name": "getApproved",
                        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                        "stateMutability": "view",
                        "type": "function"
                    }
                ];
                nftContract = new web3.eth.Contract(erc721ABI, formData.tokenAddress);
            }

            // Check NFT ownership
            let owner;
            try {
                owner = await nftContract.methods.ownerOf(tokenId).call();
                console.log("NFT Owner Address:", owner);
                console.log("Your Account Address:", account);
            } catch (error) {
                throw new Error(`Token ID ${tokenId} does not exist in contract ${formData.tokenAddress}`);
            }
            
            // FIXED: use checksummed addresses for comparison
            const normalizedOwner = owner.toLowerCase();
            const normalizedAccount = account.toLowerCase();
            console.log("Normalized Owner:", normalizedOwner);
            console.log("Normalized Account:", normalizedAccount);
            
            if (normalizedOwner !== normalizedAccount) {
                throw new Error(`You do not own this NFT. It's owned by ${owner}`);
            }

            // Approve NFT transfer
            try {
                const approved = await nftContract.methods.getApproved(tokenId).call();
                if (approved.toLowerCase() !== nftAuction._address.toLowerCase()) {
                    setLoading(true);
                    // Hiển thị thông báo phê duyệt
                    enqueueSnackbar('Please confirm the approval transaction in your wallet', {
                        variant: 'info',
                        autoHideDuration: 5000,
                    });

                    await nftContract.methods
                        .approve(nftAuction._address, tokenId)
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
                        formData.tokenAddress,
                        tokenId,
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
        <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Create New Auction
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                    Auction your existing NFTs. Make sure you own the NFT and have approved it for auction.
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
                                        nftData.imageUrl ? (
                                            <img
                                                src={nftData.imageUrl}
                                                alt={nftData.name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'contain',
                                                }}
                                                onError={(e) => {
                                                    console.error("Image failed to load:", e);
                                                    e.target.onerror = null; 
                                                    e.target.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23f0f0f0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='monospace' font-size='24px' fill='%23999'>Image Not Available</text></svg>`;
                                                }}
                                            />
                                        ) : (
                                            <Typography color="textSecondary">
                                                Image not available in metadata
                                            </Typography>
                                        )
                                    ) : (
                                        <Typography color="textSecondary">
                                            Enter token details to preview NFT
                                        </Typography>
                                    )}
                                </NFTPreview>
                                {nftData && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="h6">{nftData.name}</Typography>
                                        <Typography color="textSecondary" sx={{ mb: 1 }}>
                                            {nftData.collection}
                                        </Typography>
                                        {nftData.description && (
                                            <Typography variant="body2" sx={{ mt: 1, fontSize: '0.9rem' }}>
                                                {nftData.description.length > 150 
                                                    ? `${nftData.description.substring(0, 150)}...` 
                                                    : nftData.description}
                                            </Typography>
                                        )}
                                        {nftData.attributes && nftData.attributes.length > 0 && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    Attributes:
                                                </Typography>
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    flexWrap: 'wrap', 
                                                    gap: 1, 
                                                    mt: 1,
                                                    maxHeight: '100px',
                                                    overflowY: 'auto' 
                                                }}>
                                                    {nftData.attributes.map((attr, idx) => (
                                                        <Box 
                                                            key={idx}
                                                            sx={{
                                                                bgcolor: 'rgba(32, 129, 226, 0.1)',
                                                                borderRadius: '4px',
                                                                padding: '4px 8px',
                                                                fontSize: '0.75rem'
                                                            }}
                                                        >
                                                            <Typography component="span" sx={{ fontWeight: 600, fontSize: 'inherit' }}>
                                                                {attr.trait_type || 'Trait'}:
                                                            </Typography>{' '}
                                                            <Typography component="span" sx={{ fontSize: 'inherit' }}>
                                                                {attr.value || attr.name || '-'}
                                                            </Typography>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}
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
                                            // Don't fetch immediately, wait for both fields to have values
                                        }}
                                        required
                                        helperText={!formData.tokenAddress ? "Please enter the NFT contract address" : ""}
                                        error={!formData.tokenAddress}
                                    />

                                    <TextField
                                        label="Token ID"
                                        fullWidth
                                        value={formData.tokenId}
                                        onChange={(e) => {
                                            setFormData({ ...formData, tokenId: e.target.value });
                                            // Don't fetch immediately, wait for both fields to have values
                                        }}
                                        required
                                        helperText={!formData.tokenId ? "Please enter the NFT token ID" : ""}
                                        error={!formData.tokenId}
                                    />

                                    <Button 
                                        variant="outlined" 
                                        color="primary"
                                        onClick={fetchNFTData}
                                        disabled={!formData.tokenAddress || !formData.tokenId}
                                        fullWidth
                                        sx={{ mt: 2 }}
                                    >
                                        Fetch NFT Data
                                    </Button>

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

                                    <FormControl component="fieldset">
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                            Auction Duration Mode
                                        </Typography>
                                        <RadioGroup
                                            row
                                            value={formData.durationMode}
                                            onChange={(e) => setFormData({ ...formData, durationMode: e.target.value })}
                                        >
                                            <FormControlLabel 
                                                value="date" 
                                                control={<Radio />} 
                                                label="End Date" 
                                            />
                                            <FormControlLabel 
                                                value="duration" 
                                                control={<Radio />} 
                                                label="Duration (minutes)" 
                                            />
                                        </RadioGroup>
                                    </FormControl>

                                    {formData.durationMode === 'date' ? (
                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                            <DateTimePicker
                                                label="End Date"
                                                value={formData.endDate}
                                                onChange={(newValue) => setFormData({ ...formData, endDate: newValue })}
                                                minDateTime={new Date()}
                                                sx={{ width: '100%' }}
                                            />
                                        </LocalizationProvider>
                                    ) : (
                                        <TextField
                                            label="Duration (minutes)"
                                            fullWidth
                                            type="number"
                                            value={formData.durationMinutes}
                                            onChange={(e) => setFormData({ 
                                                ...formData, 
                                                durationMinutes: Math.max(1, parseInt(e.target.value) || 0)
                                            })}
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
                                                inputProps: { min: 1 }
                                            }}
                                            required
                                            helperText="Minimum duration: 1 minute"
                                        />
                                    )}

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