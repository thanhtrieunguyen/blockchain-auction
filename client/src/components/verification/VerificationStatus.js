import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Tooltip
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useSnackbar } from 'notistack';
import { sendTransaction, initWeb3 } from '../../web3'; // Import the utility functions

// This component handles displaying and requesting NFT verification
const VerificationStatus = ({ verifierContract, auctionContract, tokenId, contractAddress, account, onRequestVerification }) => {
  const [status, setStatus] = useState(0); // 0=not requested, 1=pending, 2=verified, 3=rejected
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Check verification status when component mounts or when tokenId/contract changes
  useEffect(() => {
    if (verifierContract && tokenId !== undefined) {
      checkVerificationStatus();
    }
  }, [verifierContract, tokenId]);

  const checkVerificationStatus = async () => {
    try {
        setLoading(true);
        setError(null);

        // Đảm bảo tokenId là số
        const tokenIdValue = typeof tokenId === 'string' ? parseInt(tokenId, 10) : tokenId;
        
        // Kiểm tra xem NFT đã được xác thực chưa
        const isVerified = await verifierContract.methods.isNFTVerified(tokenIdValue).call();
        
        if (isVerified) {
            setStatus(2); // verified
            const verificationReason = await verifierContract.methods.verificationReasons(tokenIdValue).call();
            setReason(verificationReason);
        } else {
            // Kiểm tra xem có yêu cầu đang chờ không
            try {
                const request = await verifierContract.methods.getVerificationRequest(tokenIdValue).call();
                
                // Kiểm tra xem requester có phải là địa chỉ 0 không (không có yêu cầu)
                if (request.requester !== '0x0000000000000000000000000000000000000000') {
                    if (parseInt(request.status) === 1) {
                        setStatus(1); // pending
                    } else if (parseInt(request.status) === 3) {
                        setStatus(3); // rejected
                        setReason(request.reason);
                    } else {
                        setStatus(0); // not verified
                    }
                } else {
                    setStatus(0); // not verified
                }
            } catch (error) {
                console.log("Không tìm thấy yêu cầu xác thực:", error);
                setStatus(0); // not verified or request doesn't exist
            }
        }
    } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái xác thực:', error);
        setError('Không thể kiểm tra trạng thái xác thực');
        setStatus(0);
    } finally {
        setLoading(false);
    }
};

  const handleRequestVerification = async () => {
    if (!verifierContract || !account) {
        enqueueSnackbar('Vui lòng kết nối ví của bạn trước', { variant: 'error' });
        return;
    }

    setLoading(true);
    try {
        // Đảm bảo tokenId là số
        const tokenIdValue = typeof tokenId === 'string' ? parseInt(tokenId, 10) : tokenId;
        console.log('Đang yêu cầu xác thực cho token ID:', tokenIdValue);

        // Kiểm tra xem token đã có yêu cầu xác thực chưa
        try {
            const request = await verifierContract.methods.getVerificationRequest(tokenIdValue).call();
            // Kiểm tra xem requester có phải là địa chỉ 0 không (không có yêu cầu)
            if (request.requester !== '0x0000000000000000000000000000000000000000') {
                if (parseInt(request.status) === 1) {
                    enqueueSnackbar('NFT này đã có yêu cầu xác thực đang chờ xử lý', { 
                        variant: 'warning' 
                    });
                    setLoading(false);
                    return;
                }
            }
        } catch (error) {
            console.log('Không tìm thấy yêu cầu xác thực hiện tại, tiếp tục với yêu cầu mới');
        }

        // Khởi tạo Web3
        const web3 = await initWeb3();
        
        // Tăng gas limit để đảm bảo giao dịch có đủ gas
        const options = {
            from: account,
            gas: 500000  // Tăng gas limit lên cao hơn
        };

        // Ước tính gas price với buffer
        try {
            const gasPrice = await web3.eth.getGasPrice();
            // Thêm 20% buffer cho gas price
            options.gasPrice = Math.floor(parseInt(gasPrice) * 1.2).toString();
            console.log('Gas price đã đặt:', options.gasPrice);
        } catch (gasPriceError) {
            console.warn('Không thể ước tính gas price:', gasPriceError);
        }

        console.log('Yêu cầu xác thực với options:', options);
        
        // Sử dụng direct method call thay vì utility function
        await verifierContract.methods.requestVerification(tokenIdValue)
            .send(options)
            .then(receipt => {
                console.log('Giao dịch thành công:', receipt);
                enqueueSnackbar('Yêu cầu xác thực đã được gửi thành công!', { 
                    variant: 'success' 
                });
                if (onRequestVerification) {
                    onRequestVerification();
                }
            });
    } catch (error) {
        console.error('Lỗi khi yêu cầu xác thực:', error);
        
        // Xử lý lỗi chi tiết hơn
        let errorMessage = 'Không thể gửi yêu cầu xác thực';
        
        if (error.message && error.message.includes('already requested')) {
            errorMessage = 'NFT này đã có yêu cầu xác thực';
        } else if (error.message && error.message.includes('User denied')) {
            errorMessage = 'Giao dịch đã bị từ chối trong MetaMask';
        } else if (error.message && error.message.includes('gas')) {
            errorMessage = 'Ước tính gas thất bại. Mạng có thể đang bị tắc nghẽn.';
        } else if (error.code === -32603) {
            errorMessage = 'Lỗi JSON-RPC nội bộ. Vui lòng thử lại hoặc khởi động lại trình duyệt.';
        } else if (error.message) {
            // Trích xuất phần liên quan của thông báo lỗi
            errorMessage = error.message.split('\n')[0].substring(0, 100);
        }
        
        enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
        setLoading(false);
    }
};

  const renderStatusChip = () => {
    if (loading) {
      return <CircularProgress size={20} />;
    }

    switch (status) {
      case 1:
        return (
          <Tooltip title="NFT này đang chờ được xác thực">
            <Chip 
              icon={<PendingIcon />} 
              label="Đang chờ xác thực" 
              color="warning" 
              size="small"
              onClick={() => setDialogOpen(true)}
            />
          </Tooltip>
        );
      case 2:
        return (
          <Tooltip title={`Đã xác thực: ${reason}`}>
            <Chip 
              icon={<VerifiedIcon />} 
              label="Đã xác thực" 
              color="success" 
              size="small"
              onClick={() => setDialogOpen(true)}
            />
          </Tooltip>
        );
      case 3:
        return (
          <Tooltip title={`Bị từ chối: ${reason}`}>
            <Chip 
              icon={<CancelIcon />} 
              label="Bị từ chối" 
              color="error" 
              size="small"
              onClick={() => setDialogOpen(true)}
            />
          </Tooltip>
        );
      default:
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="NFT này chưa được xác thực">
              <Chip 
                icon={<HelpOutlineIcon />} 
                label="Chưa xác thực" 
                color="default" 
                size="small"
                onClick={() => setDialogOpen(true)}
              />
            </Tooltip>
            <Button 
              variant="outlined" 
              size="small" 
              sx={{ ml: 1 }}
              onClick={handleRequestVerification}
            >
              Yêu cầu xác thực
            </Button>
          </Box>
        );
    }
  };

  return (
    <Box>
      {error && <Typography color="error" variant="body2">{error}</Typography>}
      
      {renderStatusChip()}
      
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {status === 0 && "NFT chưa được xác thực"}
          {status === 1 && "Đang chờ xác thực"}
          {status === 2 && "NFT đã được xác thực"}
          {status === 3 && "Yêu cầu xác thực đã bị từ chối"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {status === 0 && (
              "NFT này chưa được xác thực. Hãy yêu cầu xác thực để có thể sử dụng trong đấu giá."
            )}
            {status === 1 && (
              "Yêu cầu xác thực của bạn đang được xem xét. Vui lòng đợi người xác thực phản hồi."
            )}
            {status === 2 && (
              <>
                <strong>Lý do xác thực:</strong> {reason || "NFT hợp lệ"}
              </>
            )}
            {status === 3 && (
              <>
                <strong>Lý do từ chối:</strong> {reason || "Không đủ điều kiện"}
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Bạn có thể yêu cầu xác thực lại nếu đã khắc phục vấn đề.
                </Typography>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Đóng</Button>
          {(status === 0 || status === 3) && (
            <Button 
              onClick={() => {
                setDialogOpen(false);
                handleRequestVerification();
              }} 
              color="primary"
            >
              Yêu cầu xác thực
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VerificationStatus;
