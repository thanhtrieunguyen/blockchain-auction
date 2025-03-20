import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Alert,
  AlertTitle,
} from '@mui/material';
import VerificationStatus from './VerificationStatus';
import { AccountContext } from '../../context/AccountContext';

const VerificationSection = ({ tokenId, onVerificationChange }) => {
  const { contracts, account } = useContext(AccountContext);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contracts.nftVerifier && tokenId) {
      checkVerificationStatus();
    }
  }, [contracts.nftVerifier, tokenId]);

  const checkVerificationStatus = async () => {
    try {
      setLoading(true);
      const verified = await contracts.nftVerifier.methods.isNFTVerified(tokenId).call();
      setIsVerified(verified);
      
      if (onVerificationChange) {
        onVerificationChange(verified);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationChange = () => {
    // Re-check after verification status might have changed
    checkVerificationStatus();
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Xác thực NFT
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Alert severity={isVerified ? "success" : "info"} sx={{ mb: 2 }}>
        <AlertTitle>
          {isVerified ? "NFT đã được xác thực" : "Yêu cầu xác thực NFT"}
        </AlertTitle>
        {isVerified 
          ? "NFT này đã được xác thực và sẵn sàng để đấu giá."
          : "NFT cần được xác thực trước khi có thể tham gia đấu giá. Vui lòng yêu cầu xác thực."
        }
      </Alert>
      
      <Box sx={{ mt: 2 }}>
        <VerificationStatus
          verifierContract={contracts.nftVerifier}
          auctionContract={contracts.nftAuction}
          tokenId={tokenId}
          account={account}
          onRequestVerification={handleVerificationChange}
        />
      </Box>
    </Paper>
  );
};

export default VerificationSection;
