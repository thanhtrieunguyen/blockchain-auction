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
import { initWeb3, getContracts, executeContractMethod } from '../web3';
import { useSnackbar } from 'notistack';
import NFTVerifier from '../contracts/NFTVerifier.json';
import { toSafeString, toSafeNumber, calculateGasLimit, debugBigIntParams } from '../utils/bigIntUtils';
import erc721ABI from '../abis/erc721ABI.json';
import { Web3 } from 'web3';
import BN from 'bn.js';
// import connectDB from '../utils/db';
// import Auction from '../models/Auction';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4), // Increased padding from 3 to 4
    borderRadius: '16px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
}));

const NFTPreview = styled(Box)(({ theme }) => ({
    width: '100%',
    height: 450, // Increased height from 400 to 450
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
    // Add state to track which fields have been touched by the user
    const [touched, setTouched] = useState({
        tokenAddress: false,
        tokenId: false,
        startingPrice: false
    });
    const [loading, setLoading] = useState(false);
    const [nftData, setNftData] = useState(null);
    const [error, setError] = useState('');
    const { enqueueSnackbar } = useSnackbar();

    // Handler for field blur to mark fields as touched
    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    //    const we await initWeb3(); Hàm này sẽ gọi API để lấy thông tin NFT
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
                throw new Error('Không thể khởi tạo Web3');
            }

            // Validate token address format
            if (!web3.utils.isAddress(formData.tokenAddress)) {
                setError('Vui lòng nhập địa chỉ token hợp lệ');
                setLoading(false);
                return;
            }

            // Validate token ID is a positive number
            const tokenId = parseInt(formData.tokenId);
            if (isNaN(tokenId) || tokenId < 0) {
                setError('Token ID phải là số nguyên dương');
                setLoading(false);
                return;
            }

            console.log("Current connected account:", account);

            try {
                const { nftAuction, nftMinting } = await getContracts(web3);

                if (formData.tokenAddress.toLowerCase() === nftMinting._address.toLowerCase()) {
                    try {
                        let owner;
                        try {
                            owner = await nftMinting.methods.ownerOf(tokenId).call();
                            console.log("NFT Owner Address:", owner);
                            console.log("Your Account Address:", account);
                        } catch (ownerError) {
                            throw new Error('Token ID này không tồn tại trong hợp đồng đã cung cấp');
                        }

                        // Verify the token is owned by the connected account
                        const normalizedOwner = owner.toLowerCase();
                        const normalizedAccount = account.toLowerCase();
                        console.log("Normalized Owner:", normalizedOwner);
                        console.log("Normalized Account:", normalizedAccount);

                        if (normalizedOwner !== normalizedAccount) {
                            setError(`Bạn không sở hữu NFT này. Nó thuộc về ${owner}`);
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
                            throw new Error("Không thể lấy thông tin metadata của token");
                        }

                        // Fetch metadata
                        if (tokenURI) {
                            try {
                                // Resolve the token URI (handle IPFS, etc)
                                const resolvedTokenURI = resolveIPFSUri(tokenURI);
                                console.log("Resolved tokenURI:", resolvedTokenURI);

                                if (!resolvedTokenURI) {
                                    throw new Error("Không thể giải quyết URI metadata của token");
                                }

                                // Fetch metadata
                                const response = await fetch(resolvedTokenURI);
                                const metadata = await response.json();
                                console.log("NFT Metadata:", metadata);

                                // Resolve image URI from metadata
                                let imageUrl = metadata.image;
                                if (!imageUrl) {
                                    throw new Error("Không tìm thấy hình ảnh trong metadata của NFT");
                                }

                                imageUrl = resolveIPFSUri(imageUrl);
                                console.log("Resolved Image URL:", imageUrl);

                                setNftData({
                                    name: metadata.name || `Token #${tokenId}`,
                                    imageUrl: imageUrl,
                                    collection: metadata.collection || "Bộ Sưu Tập NFT",
                                    description: metadata.description || "",
                                    attributes: metadata.attributes || []
                                });
                            } catch (metadataError) {
                                console.warn("Error fetching metadata:", metadataError);
                                throw new Error(`Không thể lấy metadata của NFT: ${metadataError.message}`);
                            }
                        } else {
                            throw new Error("Không có URI metadata được trả về từ hợp đồng");
                        }
                    } catch (error) {
                        console.warn("Failed to use our contract methods:", error);
                        throw new Error(error.message || 'Không thể lấy dữ liệu NFT');
                    }
                } else {
                    // Try to use a generic ERC721 interface for other contracts
                    const erc721ABI = [
                        {
                            "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
                            "name": "tokenURI",
                            "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
                            "stateMutability": "view",
                            "type": "function"
                        },
                        {
                            "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
                            "name": "ownerOf",
                            "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
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
                setError(err.message || 'Không thể lấy dữ liệu NFT. Vui lòng kiểm tra địa chỉ token và ID.');
                setNftData(null);
            }
        } catch (err) {
            console.error("Web3 connection error:", err);
            setError('Không thể kết nối với blockchain. Vui lòng thử lại.');
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
            const { nftAuction, nftMinting, nftVerifier } = await getContracts(web3);

            // Validate inputs
            if (!formData.tokenAddress || !formData.tokenId || !formData.startingPrice || !formData.endDate) {
                throw new Error('Vui lòng điền đầy đủ thông tin');
            }

            // Đảm bảo tokenId là string hợp lệ
            let tokenId;
            try {
                const parsedId = parseInt(formData.tokenId, 10);
                if (isNaN(parsedId) || parsedId < 0 || parsedId.toString() !== formData.tokenId.trim()) {
                    throw new Error('Token ID phải là số nguyên không âm');
                }
                tokenId = formData.tokenId.trim();
                console.log("Xử lý token ID:", tokenId);
            } catch (err) {
                console.error("Invalid token ID format:", err);
                throw new Error('Token ID không hợp lệ. Vui lòng nhập một số nguyên hợp lệ.');
            }

            // Lấy instance của NFT contract
            let nftContract;
            if (formData.tokenAddress.toLowerCase() === nftMinting._address.toLowerCase()) {
                nftContract = nftMinting;
                console.log("Sử dụng contract NFT của chúng ta");
            } else {
                nftContract = new web3.eth.Contract(erc721ABI, formData.tokenAddress);
                console.log("Sử dụng contract NFT bên ngoài:", formData.tokenAddress);
            }

            // Kiểm tra quyền sở hữu NFT
            const owner = await nftContract.methods.ownerOf(tokenId).call();
            console.log("Chủ sở hữu NFT:", owner);

            if (owner.toLowerCase() !== account.toLowerCase()) {
                throw new Error(`Bạn không sở hữu NFT này. Nó thuộc về ${owner}`);
            }

            // Kiểm tra NFT đã được xác thực chưa
            const isVerified = await nftVerifier.methods.isNFTVerified(tokenId).call();
            console.log("NFT đã được xác thực:", isVerified);

            if (!isVerified) {
                enqueueSnackbar('NFT này chưa được xác thực. Bạn cần xác thực NFT trước khi đấu giá.', {
                    variant: 'warning',
                    autoHideDuration: 5000,
                });
                localStorage.setItem('createAuctionFormData', JSON.stringify(formData));
                navigate('/my-nfts');
                return;
            }

            // Kiểm tra và phê duyệt NFT nếu cần
            const approved = await nftContract.methods.getApproved(tokenId).call();
            console.log("NFT được phê duyệt cho:", approved);
            console.log("Địa chỉ contract đấu giá:", nftAuction._address);

            if (approved.toLowerCase() !== nftAuction._address.toLowerCase()) {
                enqueueSnackbar('Vui lòng xác nhận giao dịch phê duyệt trong ví của bạn', {
                    variant: 'info',
                    autoHideDuration: 5000,
                });

                try {
                    await nftContract.methods
                        .approve(nftAuction._address, tokenId)
                        .send({
                            from: account,
                            gas: 200000  // Sử dụng gas limit cố định
                        });

                    console.log('Phê duyệt NFT thành công!');

                    enqueueSnackbar('NFT đã được phê duyệt thành công! Vui lòng xác nhận việc tạo đấu giá', {
                        variant: 'success',
                        autoHideDuration: 3000,
                    });
                } catch (approveError) {
                    console.error('Lỗi khi phê duyệt NFT:', approveError);
                    throw new Error('Không thể phê duyệt NFT: ' + approveError.message);
                }
            }

            // Tính toán thời gian đấu giá và giá khởi điểm
            let auctionDuration;
            if (formData.durationMode === 'date') {
                const now = new Date();
                const endDate = new Date(formData.endDate);
                auctionDuration = Math.max(1, Math.ceil((endDate - now) / (60 * 1000)));
            } else {
                auctionDuration = Math.max(1, parseInt(formData.durationMinutes));
            }

            console.log("Thời gian đấu giá (phút):", auctionDuration);

            const startingPriceWei = web3.utils.toWei(formData.startingPrice.toString(), 'ether');
            console.log("Giá khởi điểm (Wei):", startingPriceWei);

            // Chuẩn bị tham số
            /* global BigInt */

            const tokenIdBN = BigInt(tokenId);
            const startingPriceBN = BigInt(startingPriceWei);
            const durationBN = BigInt(auctionDuration);

            console.log("Tham số đã định dạng:", {
                nftContract: formData.tokenAddress,
                tokenId: tokenIdBN.toString(),
                startingPrice: startingPriceBN.toString(),
                duration: durationBN.toString()
            });

            // Hiển thị thông báo tạo đấu giá
            enqueueSnackbar('Vui lòng xác nhận giao dịch tạo đấu giá trong ví của bạn', {
                variant: 'info',
                autoHideDuration: 5000,
            });

            try {
                const gasEstimate = await nftAuction.methods
                    .createAuction(
                        formData.tokenAddress,
                        tokenIdBN,
                        startingPriceBN,
                        durationBN
                    )
                    .estimateGas({ from: account });

                // Thêm 50% buffer để đảm bảo đủ gas
                const gasLimit = Math.ceil(gasEstimate * 1.5);

                // Cũng cần đặt giá gas phù hợp
                const gasPrice = await web3.eth.getGasPrice();
                const adjustedGasPrice = Math.ceil(Number(gasPrice) * 1.1); // thêm 10% buffer

                // Gọi hàm createAuction với 4 tham số đúng
                await nftAuction.methods
                    .createAuction(
                        formData.tokenAddress,
                        tokenIdBN,
                        startingPriceBN,
                        durationBN
                    )
                    .send({
                        from: account,
                        gas: gasLimit,
                        gasPrice: adjustedGasPrice.toString()
                    });

                console.log('Tạo đấu giá thành công!');

                enqueueSnackbar('Đã tạo đấu giá thành công!', {
                    variant: 'success',
                    autoHideDuration: 3000,
                });
                navigate('/my-auctions');
            } catch (createError) {
                console.error('Lỗi khi tạo đấu giá:', createError);

                // Xử lý lỗi chi tiết
                let errorMessage = 'Không thể tạo đấu giá';

                if (createError.message) {
                    if (createError.message.includes('NFT must be verified')) {
                        errorMessage = 'NFT chưa được xác thực. Vui lòng xác thực NFT trước khi đấu giá.';
                    } else if (createError.message.includes('Must be the owner')) {
                        errorMessage = 'Bạn không phải là chủ sở hữu của NFT này.';
                    } else if (createError.message.includes('must be approved')) {
                        errorMessage = 'NFT chưa được phê duyệt cho contract đấu giá.';
                    } else if (createError.message.includes('User denied')) {
                        errorMessage = 'Bạn đã từ chối giao dịch trong ví.';
                    } else if (createError.message.includes('gas')) {
                        errorMessage = 'Ước tính gas thất bại. Mạng có thể đang bị tắc nghẽn.';
                    } else if (createError.code === -32603) {
                        errorMessage = 'Lỗi JSON-RPC nội bộ. Vui lòng thử lại hoặc khởi động lại trình duyệt.';
                    } else {
                        errorMessage = 'Lỗi: ' + createError.message.split('\n')[0];
                    }
                }

                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Lỗi tạo đấu giá:", error);
            setError(error.message || 'Không thể tạo đấu giá. Vui lòng thử lại.');
            enqueueSnackbar(error.message || 'Không thể tạo đấu giá', {
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
                state: { message: 'Vui lòng kết nối ví của bạn để tạo một đấu giá' }
            });
        }
    }, [account, navigate]);

    useEffect(() => {
        // Check if there's saved form data from a previous verification redirect
        const savedFormData = localStorage.getItem('createAuctionFormData');
        if (savedFormData) {
            try {
                const parsedFormData = JSON.parse(savedFormData);
                setFormData(parsedFormData);

                // Immediately clear the saved data to prevent it from being used again
                localStorage.removeItem('createAuctionFormData');

                // Automatically fetch NFT data 
                if (parsedFormData.tokenAddress && parsedFormData.tokenId) {
                    fetchNFTData(parsedFormData.tokenAddress, parsedFormData.tokenId);
                }

                // Show notification
                enqueueSnackbar('Form data restored from your previous attempt. Please continue after verification.', {
                    variant: 'info',
                });
            } catch (e) {
                console.error("Error parsing saved form data:", e);
                localStorage.removeItem('createAuctionFormData');
            }
        }
    }, []);

    if (!account) {
        return null;
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 5 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Tạo Đấu Giá Mới
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                    Đấu giá NFT hiện có của bạn. Đảm bảo rằng bạn sở hữu NFT và đã phê duyệt nó cho đấu giá.
                </Typography>

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={5}>
                        {/* Left Column - NFT Preview */}
                        <Grid item xs={12} md={6}>
                            <StyledPaper>
                                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                                    Xem Trước NFT
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
                                                    e.target.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23f0f0f0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='monospace' font-size='24px' fill='%23999'>Hình Ảnh Không Có Sẵn</text></svg>`;
                                                }}
                                            />
                                        ) : (
                                            <Typography color="textSecondary">
                                                Hình ảnh không có sẵn trong metadata
                                            </Typography>
                                        )
                                    ) : (
                                        <Typography color="textSecondary">
                                            Nhập thông tin token để xem trước NFT
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
                                                    Thuộc tính:
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
                                                                {attr.trait_type || 'Đặc điểm'}:
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
                                    Chi Tiết Đấu Giá
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <TextField
                                        label="Địa Chỉ Token"
                                        fullWidth
                                        value={formData.tokenAddress}
                                        onChange={(e) => {
                                            setFormData({ ...formData, tokenAddress: e.target.value });
                                        }}
                                        onBlur={() => handleBlur('tokenAddress')}
                                        required
                                        helperText={touched.tokenAddress && !formData.tokenAddress ? "Vui lòng nhập địa chỉ hợp đồng NFT" : ""}
                                        error={touched.tokenAddress && !formData.tokenAddress}
                                    />

                                    <TextField
                                        label="Token ID"
                                        fullWidth
                                        type="number"
                                        inputProps={{ min: "0", step: "1" }}
                                        value={formData.tokenId}
                                        onChange={(e) => {
                                            setFormData({ ...formData, tokenId: e.target.value });
                                        }}
                                        onBlur={() => handleBlur('tokenId')}
                                        required
                                        helperText={touched.tokenId && !formData.tokenId ? "Vui lòng nhập ID của NFT" : ""}
                                        error={touched.tokenId && !formData.tokenId}
                                    />

                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={fetchNFTData}
                                        disabled={!formData.tokenAddress || !formData.tokenId}
                                        fullWidth
                                        sx={{ mt: 2 }}
                                    >
                                        Lấy Dữ Liệu NFT
                                    </Button>

                                    <TextField
                                        label="Giá Khởi Điểm"
                                        fullWidth
                                        type="number"
                                        value={formData.startingPrice}
                                        onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                                        onBlur={() => handleBlur('startingPrice')}
                                        InputProps={{
                                            endAdornment: <InputAdornment position="end">ETH</InputAdornment>,
                                        }}
                                        required
                                        helperText={touched.startingPrice && !formData.startingPrice ? "Vui lòng nhập giá khởi điểm" : ""}
                                        error={touched.startingPrice && !formData.startingPrice}
                                    />

                                    <FormControl component="fieldset">
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                            Chế Độ Thời Gian Đấu Giá
                                        </Typography>
                                        <RadioGroup
                                            row
                                            value={formData.durationMode}
                                            onChange={(e) => setFormData({ ...formData, durationMode: e.target.value })}
                                        >
                                            <FormControlLabel
                                                value="date"
                                                control={<Radio />}
                                                label="Ngày Kết Thúc"
                                            />
                                            <FormControlLabel
                                                value="duration"
                                                control={<Radio />}
                                                label="Thời Lượng (phút)"
                                            />
                                        </RadioGroup>
                                    </FormControl>

                                    {formData.durationMode === 'date' ? (
                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                            <DateTimePicker
                                                label="Ngày Kết Thúc"
                                                value={formData.endDate}
                                                onChange={(newValue) => setFormData({ ...formData, endDate: newValue })}
                                                minDateTime={new Date()}
                                                sx={{ width: '100%' }}
                                            />
                                        </LocalizationProvider>
                                    ) : (
                                        <TextField
                                            label="Thời Lượng (phút)"
                                            fullWidth
                                            type="number"
                                            value={formData.durationMinutes}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                durationMinutes: Math.max(1, parseInt(e.target.value) || 0)
                                            })}
                                            InputProps={{
                                                endAdornment: <InputAdornment position="end">phút</InputAdornment>,
                                                inputProps: { min: 1 }
                                            }}
                                            required
                                            helperText="Thời lượng tối thiểu: 1 phút"
                                        />
                                    )}

                                    <Web3Button
                                        type="submit"
                                        fullWidth
                                        size="large"
                                        disabled={!nftData || loading}
                                        sx={{
                                            py: 2.0,
                                            mt: 2
                                        }}
                                    >
                                        {loading ? 'Đang Tạo Đấu Giá...' : 'Tạo Đấu Giá'}
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