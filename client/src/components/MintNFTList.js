import React from 'react';
import { Grid, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import MintNFTCard from './MintNFTCard';

const StyledGrid = styled(Grid)(({ theme }) => ({
    padding: theme.spacing(2),
    gap: theme.spacing(3),
}));

const MintNFTList = ({ nfts }) => {
    return (
        <Box sx={{ flexGrow: 1 }}>
            <StyledGrid container>
                {nfts.map((nft, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={2.2} key={nft.id || index}>
                        <MintNFTCard nft={nft} />
                    </Grid>
                ))}
            </StyledGrid>
        </Box>
    );
};

export default MintNFTList;