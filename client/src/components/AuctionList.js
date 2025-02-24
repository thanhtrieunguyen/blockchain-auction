import React from 'react';
import { Grid, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import AuctionCard from './AuctionCard';

const StyledGrid = styled(Grid)(({ theme }) => ({
  padding: theme.spacing(2),
  gap: theme.spacing(3),
}));

const AuctionList = ({ auctions }) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <StyledGrid container>
        {auctions.map((auction, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2.2} key={auction.id || index}>
            <AuctionCard auction={auction} />
          </Grid>
        ))}
      </StyledGrid>
    </Box>
  );
};

export default AuctionList;