import React from 'react';
import { Card, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
import MintNFTDialog from './MintNFTDialog';

const StyledCard = styled(Card)(({ theme }) => ({
    display: 'block',
    position: 'relative',
    cursor: 'pointer',
    height: '100%',
    minHeight: '280px',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
        transform: 'translateY(-4px)',
    },
}));

const ImageWrapper = styled(Box)({
    position: 'relative',
    paddingTop: '100%',
    '& img': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '60%',
        objectFit: 'cover',
    },
});

const InfoBadge = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 200, 83, 0.9)',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    opacity: 0.9,
    transition: 'all 0.3s ease',
    '&:hover': {
        opacity: 1,
        transform: 'scale(1.05)',
    },
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    color: 'black',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
}));

const MintNFTCard = ({ nft }) => {
    const { title, imageUrl, price } = nft;

    const [dialogOpen, setDialogOpen] = useState(false);

    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
    };

    return (
        <>
            <StyledCard onClick={handleOpenDialog}>
                <ImageWrapper>
                    <img src={imageUrl} alt={title} />
                    <InfoBadge>
                        Available to Mint
                    </InfoBadge>
                </ImageWrapper>

                <ContentWrapper>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            marginBottom: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {title}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography
                                variant="caption"
                                sx={{ color: 'rgba(0, 0, 0, 0.7)' }}
                            >
                                Mint Price
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 600
                                }}
                            >
                                {price} ETH
                            </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'right' }}>
                            <Typography
                                variant="caption"
                                sx={{ color: 'rgba(0, 0, 0, 0.7)' }}
                            >
                                Collection
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 600
                                }}
                            >
                                NFT Collection
                            </Typography>
                        </Box>
                    </Box>
                </ContentWrapper>
            </StyledCard><MintNFTDialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                nft={nft}
            />
        </>
    );
};

export default MintNFTCard;