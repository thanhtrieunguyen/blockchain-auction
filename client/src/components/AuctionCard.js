import React from 'react';
import { Card, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';

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
    paddingTop: '100%', // 3:2 aspect ratio
    backgroundColor: '',
    '& img': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '60%',
        objectFit: 'cover',
    },
});

const InfoBadge = styled(Box)(({ theme, status }) => ({
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: status === 'live' ? 'rgba(1, 80, 255, 0.9)' : 'rgba(128, 128, 128, 0.9)',
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
    // background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))',
    color: 'black !important',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
}));

const AuctionCard = ({ auction }) => {
    const {
        id,
        title,
        imageUrl,
        currentPrice,
        endTime,
        status
    } = auction;

    return (
        <StyledCard component={Link} to={`/auctions/${id}`} style={{ textDecoration: 'none' }}>
            <ImageWrapper>
                <img src={imageUrl} alt={title} />
                <InfoBadge status={status}>
                    {status === 'live' ? 'Live Auction' : 'Ended'}
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
                            Current Price
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 600
                            }}
                        >
                            {currentPrice} ETH
                        </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                        <Typography
                            variant="caption"
                            sx={{ color: 'rgba(0, 0, 0, 0.7)' }}
                        >
                            Ends in
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 600
                            }}
                        >
                            {endTime}
                        </Typography>
                    </Box>
                </Box>
            </ContentWrapper>
        </StyledCard>
    );
};

export default AuctionCard;