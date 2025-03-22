import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Button, CircularProgress, Alert } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const NFTVerificationStatus = ({ verifierContract, tokenId, account, onVerificationChange }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Enum giống với smart contract để dễ đối chiếu
  const VerificationStatus = {
    NotRequested: 0,
    Pending: 1,
    Verified: 2,
    Rejected: 3
  };

  useEffect(() => {
    if (verifierContract && tokenId) {
      checkVerificationStatus();
    }
  }, [verifierContract, tokenId]);

  const checkVerificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Kiểm tra xem NFT đã được xác minh chưa
      const isVerified = await verifierContract.methods.isNFTVerified(tokenId).call();
      console.log(`NFT #${tokenId} verification status:`, isVerified);

      if (isVerified) {
        setStatus(VerificationStatus.Verified);
        if (onVerificationChange) onVerificationChange(true);
        return;
      }

      // Nếu chưa được xác minh, kiểm tra trạng thái yêu cầu
      try {
        const verificationStatus = await verifierContract.methods.getVerificationStatus(tokenId).call();
        setStatus(parseInt(verificationStatus));
        if (onVerificationChange) onVerificationChange(parseInt(verificationStatus) === VerificationStatus.Verified);
      } catch (statusError) {
        console.error("Error checking verification status:", statusError);
        setStatus(VerificationStatus.NotRequested);
        if (onVerificationChange) onVerificationChange(false);
      }
    } catch (error) {
      console.error("Error checking NFT verification:", error);
      setError("Không thể kiểm tra trạng thái xác minh NFT");
      if (onVerificationChange) onVerificationChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerification = async () => {
    try {
      setLoading(true);
      
      await verifierContract.methods.requestVerification(tokenId)
        .send({ from: account });
      
      // Cập nhật lại trạng thái sau khi yêu cầu
      checkVerificationStatus();
    } catch (error) {
      console.error("Error requesting verification:", error);
      setError("Không thể gửi yêu cầu xác minh: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <CircularProgress size={24} />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // Hiển thị trạng thái xác minh
  return (
    <Box sx={{ mt: 2 }}>
      {status === VerificationStatus.Verified && (
        <Alert 
          icon={<VerifiedIcon />}
          severity="success"
        >
          NFT này đã được xác minh và sẵn sàng để đấu giá.
        </Alert>
      )}

      {status === VerificationStatus.Pending && (
        <Alert 
          icon={<PendingIcon />}
          severity="warning"
        >
          Yêu cầu xác minh đang chờ xử lý. Vui lòng đợi người xác minh phê duyệt.
        </Alert>
      )}

      {status === VerificationStatus.Rejected && (
        <Alert 
          icon={<CancelIcon />}
          severity="error"
        >
          Yêu cầu xác minh đã bị từ chối. Bạn có thể yêu cầu xác minh lại.
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleRequestVerification}
            sx={{ ml: 2 }}
          >
            Yêu cầu lại
          </Button>
        </Alert>
      )}

      {(status === VerificationStatus.NotRequested || status === null) && (
        <Alert 
          icon={<HelpOutlineIcon />}
          severity="info"
          action={
            <Button 
              variant="contained" 
              size="small" 
              onClick={handleRequestVerification}
            >
              Yêu cầu xác minh
            </Button>
          }
        >
          NFT này chưa được xác minh. Bạn cần yêu cầu xác minh trước khi tạo đấu giá.
        </Alert>
      )}
    </Box>
  );
};

export default NFTVerificationStatus;
