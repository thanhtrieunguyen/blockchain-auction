import React from 'react';
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(Button)(({ theme }) => ({
    background: 'linear-gradient(to right, #2081E2, #80B4E8)',
    color: 'white',
    padding: '10px 24px',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '0.95rem',
    textTransform: 'none',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 12px rgba(32, 129, 226, 0.2)',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 16px rgba(32, 129, 226, 0.3)',
        background: 'linear-gradient(to right, #1569BD, #6AA2E2)',
    },
    '&:active': {
        transform: 'translateY(0)',
        boxShadow: '0 4px 12px rgba(32, 129, 226, 0.2)',
    },
    '& .MuiButton-startIcon': {
        marginRight: '8px',
    },
}));

const Web3Button = ({ children, startIcon, ...props }) => {
    return (
        <StyledButton
            variant="contained"
            startIcon={startIcon}
            {...props}
        >
            {children}
        </StyledButton>
    );
};

export default Web3Button;