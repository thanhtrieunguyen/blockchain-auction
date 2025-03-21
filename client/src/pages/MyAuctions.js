import React from 'react';
import { Container, Typography } from '@mui/material';

const MyAuction = () => {
  return (
    <Container maxWidth="md" style={{ marginTop: '50px' }}>
      <Typography 
        variant="h2" 
        component="h1" 
        gutterBottom
        sx={{
          color: '#04111d',
          fontWeight: 600,
          fontSize: '2.5rem',
          textAlign: 'center'
        }}
      >
        My Auctions
      </Typography>
    </Container>
  );
};

export default MyAuction;