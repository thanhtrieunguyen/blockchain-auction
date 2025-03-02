import React, { forwardRef } from 'react';
import { styled } from '@mui/material/styles';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSnackbar } from 'notistack';
import '../css/Toast.css';

const StyledSnackbar = styled('div')(({ theme, variant }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    minWidth: '300px',
    color: '#fff',
    gap: '12px',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1.5,
    backgroundColor: variant === 'success' ? 'rgba(0, 150, 255, 0.95)' :
        variant === 'error' ? 'rgba(231, 76, 60, 0.95)' :
            variant === 'warning' ? 'rgba(241, 196, 15, 0.95)' :
                'rgba(52, 152, 219, 0.95)',
    border: variant === 'success' ? '1px solid rgba(46, 204, 113, 0.2)' :
        variant === 'error' ? '1px solid rgba(231, 76, 60, 0.2)' :
            variant === 'warning' ? '1px solid rgba(241, 196, 15, 0.2)' :
                '1px solid rgba(52, 152, 219, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',

    '& .message': {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },

    '& .close-button': {
        color: 'inherit',
        opacity: 0.8,
        padding: '4px',
        transition: 'opacity 0.2s',

        '&:hover': {
            opacity: 1,
            backgroundColor: 'transparent'
        }
    }
}));

const SnackbarContentWrapper = forwardRef((props, ref) => {
    const { id, message, variant } = props;
    const { closeSnackbar } = useSnackbar();

    const handleDismiss = () => {
        closeSnackbar(id);
    };

    return (
        <StyledSnackbar ref={ref} variant={variant} className="SnackbarContent-root">
            <div className="message">
                {message}
            </div>
            <IconButton
                size="small"
                className="close-button"
                color="inherit"
                onClick={handleDismiss}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </StyledSnackbar>
    );
});

SnackbarContentWrapper.displayName = 'SnackbarContentWrapper';

export default SnackbarContentWrapper;