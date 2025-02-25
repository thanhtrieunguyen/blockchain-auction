import React, { useState, useContext } from 'react'; // Add useContext
import { AccountContext } from '../context/AccountContext'; // Add this import
import { useNavigate } from 'react-router-dom'; // Add this import
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    IconButton,
    Button,
    Paper,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    }
}));

const QuantityControl = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2),
    margin: theme.spacing(3, 0),
    padding: theme.spacing(2),
    backgroundColor: 'rgba(32, 129, 226, 0.08)',
    borderRadius: '12px',
}));

const QuantityButton = styled(IconButton)(({ theme }) => ({
    backgroundColor: 'white',
    border: '2px solid #2081E2',
    borderRadius: '8px',
    padding: theme.spacing(1),
    color: '#2081E2',
    '&:hover': {
        backgroundColor: 'rgba(32, 129, 226, 0.08)',
    },
    '&.Mui-disabled': {
        borderColor: theme.palette.action.disabledBackground,
        color: theme.palette.action.disabled,
    }
}));

const QuantityDisplay = styled(Typography)(({ theme }) => ({
    minWidth: '80px',
    textAlign: 'center',
    fontWeight: 600,
    fontSize: '1.5rem',
    color: '#2081E2',
}));

const NFTImage = styled(Paper)(({ theme }) => ({
    width: 240,
    height: 240,
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease',
    '&:hover': {
        transform: 'scale(1.02)',
    }
}));

const TotalPrice = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: 'rgba(32, 129, 226, 0.08)',
    borderRadius: '12px',
    marginBottom: theme.spacing(2),
}));

const MintNFTDialog = ({ open, onClose, nft }) => {
    const [quantity, setQuantity] = useState(1);
    const { account } = useContext(AccountContext);
    const navigate = useNavigate();
    const isFree = nft.price === 0;

    const handleDecrease = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    const handleIncrease = () => {
        if (!isFree) {
            setQuantity(prev => prev + 1);
        }
    };

    const totalPrice = (nft.price * quantity).toFixed(3);

    const handleMint = () => {
        if (!account) {
            // If no wallet connected, redirect to connect wallet page
            onClose();
            navigate('/connect-wallet', {
                state: { message: 'Please connect your wallet to mint NFTs' }
            });
            return;
        }
        
        console.log(`Minting ${quantity} NFTs for ${totalPrice} ETH`);
        onClose();
    };

    const MintButton = styled(Button)(({ theme, disabled }) => ({
        background: disabled ? 
            'rgba(0, 0, 0, 0.12)' : 
            'linear-gradient(to right, #2081E2,rgb(82, 156, 230))',
        padding: theme.spacing(1.5),
        borderRadius: '12px',
        fontSize: '1.1rem',
        fontWeight: 600,
        color: 'white',
        textTransform: 'none',
        '&:hover': {
            background: disabled ? 
                'rgba(0, 0, 0, 0.12)' : 
                'linear-gradient(to right, #1569BD, #6AA2E2)',
        },
        cursor: disabled ? 'not-allowed' : 'pointer',
    }));

    return (
        <StyledDialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 1,
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
            }}>
                {/* Changed from Typography to div to avoid heading nesting issues */}
                <Box sx={{
                    typography: 'h5',
                    fontWeight: 700
                }}>
                    Mint NFT
                </Box>
                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        color: 'rgba(0, 0, 0, 0.54)',
                        '&:hover': { color: 'rgba(0, 0, 0, 0.87)' }
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                    <NFTImage elevation={0}>
                        <img
                            src={nft.imageUrl}
                            alt={nft.title}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    </NFTImage>
                    <Box>
                        {/* Changed from Typography to Box */}
                        <Box sx={{
                            typography: 'h5',
                            fontWeight: 700,
                            mb: 1
                        }}>
                            {nft.title}
                        </Box>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                        >
                            {nft.description}
                        </Typography>
                        <Box sx={{
                            p: 1.5,
                            bgcolor: 'rgba(32, 129, 226, 0.08)',
                            borderRadius: 2,
                            display: 'inline-block'
                        }}>
                            <Typography
                                sx={{
                                    typography: 'h6',
                                    fontWeight: 600,
                                    color: '#2081E2'
                                }}
                            >
                                {nft.price} ETH
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <QuantityControl>
                    <QuantityButton
                        onClick={handleDecrease}
                        disabled={quantity === 1}
                    >
                        <RemoveIcon />
                    </QuantityButton>
                    <QuantityDisplay>
                        {quantity}
                    </QuantityDisplay>
                    <QuantityButton
                        onClick={handleIncrease}
                        disabled={isFree}
                    >
                        <AddIcon />
                    </QuantityButton>
                </QuantityControl>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Box sx={{ width: '100%' }}>
                    <TotalPrice>
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Typography variant="body1" color="text.secondary">
                                Total Price
                            </Typography>
                            <Box sx={{ 
                                typography: 'h5',
                                fontWeight: 700,
                                color: '#2081E2'
                            }}>
                                {totalPrice} ETH
                            </Box>
                        </Box>
                    </TotalPrice>
                    <MintButton
                        fullWidth
                        onClick={handleMint}
                        disabled={!account}
                    >
                        {!account ? 'Connect Wallet to Mint' : 
                         (isFree ? 'Mint NFT' : `Mint ${quantity} NFT${quantity > 1 ? 's' : ''}`)}
                    </MintButton>
                </Box>
            </DialogActions>
        </StyledDialog>
    );
};

export default MintNFTDialog;