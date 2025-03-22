import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  Snackbar,
  Paper,
  Chip,
  Divider,
  CardMedia,
  CircularProgress
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import { AccountContext } from '../context/AccountContext';
import { toSafeNumber, toSafeString, normalizeTokenId, toDate } from '../utils/bigIntUtils';

const VerificationQueue = () => {
  const { account, contracts, isVerifier } = useContext(AccountContext);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [verificationReason, setVerificationReason] = useState({});
  const [nftDetails, setNftDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (contracts?.nftVerifier && account) {
      loadPendingRequests();
    }
  }, [contracts, account]);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);

      console.log("Đang tải yêu cầu xác thực đang chờ...");

      // Lấy danh sách tokenId đang chờ xác minh
      const pendingTokenIds = await contracts.nftVerifier.methods.getPendingTokens().call();
      console.log("Pending token IDs:", pendingTokenIds);

      // Kiểm tra xem contract có sẵn không
      if (!contracts.nftVerifier || !contracts.nftVerifier.methods) {
        console.error("Contract NFTVerifier không khả dụng");
        throw new Error("Contract NFTVerifier không khả dụng");
      }

      // Chuyển đổi tất cả token ID sang string để tránh lỗi BigInt
      const normalizedIds = pendingTokenIds.map(id => id.toString());
      setPendingRequests(normalizedIds);

      // Load NFT details for each request
      const details = {};
      for (const tokenId of normalizedIds) {
        try {
          console.log("Đang tải thông tin cho token ID:", tokenId);
          // Kiểm tra xem nftMinting có sẵn không
          if (!contracts.nftMinting || !contracts.nftMinting.methods) {
            console.warn("Contract NFTMinting không khả dụng");
            details[tokenId] = { name: `Token ID: ${tokenId}`, image: '' };
            continue;
          }

          // Lấy thông tin yêu cầu xác thực
          const request = await contracts.nftVerifier.methods.getVerificationRequest(tokenId).call();

          // Lấy tokenURI - Đảm bảo sử dụng string cho tokenId
          let tokenURI;
          try {
            tokenURI = await contracts.nftMinting.methods.tokenURI(tokenId).call();
            console.log("Token URI:", tokenURI);
          } catch (uriError) {
            console.warn(`Không thể lấy tokenURI cho token ID ${tokenId}:`, uriError);
            details[tokenId] = {
              name: `Token ID: ${tokenId}`,
              image: '',
              requester: request.requester,
              requestTime: toDate(request.requestTime).toLocaleString()
            };
            continue;
          }

          if (!tokenURI) {
            console.warn("Không có tokenURI cho token ID:", tokenId);
            details[tokenId] = {
              name: `Token ID: ${tokenId}`,
              image: '',
              requester: request.requester,
              requestTime: toDate(request.requestTime).toLocaleString()
            };
            continue;
          }

          // Fetch metadata
          try {
            const response = await fetch(tokenURI);
            const metadata = await response.json();
            console.log("Metadata cho token ID", tokenId, ":", metadata);

            details[tokenId] = {
              ...metadata,
              requester: request.requester,
              requestTime: toDate(request.requestTime).toLocaleString()
            };
          } catch (metadataError) {
            console.error(`Lỗi khi tải metadata cho token ${tokenId}:`, metadataError);
            details[tokenId] = {
              name: `Token ID: ${tokenId}`,
              image: '',
              requester: request.requester,
              requestTime: toDate(request.requestTime).toLocaleString()
            };
          }
        } catch (error) {
          console.error(`Lỗi khi tải thông tin cho token ${tokenId}:`, error);
          details[tokenId] = {
            name: `Token ID: ${tokenId}`,
            image: ''
          };
        }
      }

      setNftDetails(details);
    } catch (error) {
      console.error('Lỗi khi tải yêu cầu xác thực đang chờ:', error);
      setAlert({
        open: true,
        message: 'Không thể tải yêu cầu xác thực: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Thêm vào component VerificationQueue
  const checkRequestExistence = async (tokenId) => {
    try {
      console.log("Kiểm tra yêu cầu xác thực cho token ID:", tokenId);

      // Đảm bảo tokenId là string khi gọi contract
      const tokenIdNormalized = normalizeTokenId(tokenId);

      // Gọi getVerificationRequest để kiểm tra
      const request = await contracts.nftVerifier.methods.getVerificationRequest(tokenIdNormalized).call();
      console.log("Kết quả getVerificationRequest:", request);

      // Kiểm tra xem yêu cầu có tồn tại không
      if (request.requester && request.requester !== '0x0000000000000000000000000000000000000000') {
        console.log("Tìm thấy yêu cầu xác thực:", {
          requester: request.requester,
          status: request.status,
          requestTime: toDate(request.requestTime).toLocaleString()
        });

        setAlert({
          open: true,
          message: `Tìm thấy yêu cầu xác thực cho token ID ${tokenId}. Người yêu cầu: ${request.requester}`,
          severity: 'success'
        });

        return true;
      } else {
        console.log("Không tìm thấy yêu cầu xác thực cho token ID này");

        setAlert({
          open: true,
          message: `Không tìm thấy yêu cầu xác thực cho token ID ${tokenId}`,
          severity: 'warning'
        });

        return false;
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra yêu cầu xác thực:", error);

      setAlert({
        open: true,
        message: `Lỗi khi kiểm tra: ${error.message}`,
        severity: 'error'
      });

      return false;
    }
  };

  // Thêm nút này vào UI của VerificationQueue
  <Box sx={{ mt: 2, mb: 3 }}>
    <Button
      variant="outlined"
      onClick={() => {
        const tokenId = prompt("Nhập token ID cần kiểm tra:");
        if (tokenId) {
          checkRequestExistence(tokenId);
        }
      }}
    >
      Kiểm tra yêu cầu theo ID
    </Button>
  </Box>


  const handleVerify = async (tokenId) => {
    if (!verificationReason[tokenId]) {
      setAlert({
        open: true,
        message: 'Vui lòng nhập lý do xác thực',
        severity: 'warning'
      });
      return;
    }

    try {
      // Đảm bảo tokenId là string khi gọi contract
      const tokenIdNormalized = normalizeTokenId(tokenId);

      await contracts.nftVerifier.methods
        .verifyNFT(tokenIdNormalized, verificationReason[tokenId])
        .send({ from: account });

      loadPendingRequests();
      setAlert({
        open: true,
        message: 'Xác thực NFT thành công',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error verifying NFT:', error);
      setAlert({
        open: true,
        message: 'Lỗi khi xác thực: ' + (error.message || ''),
        severity: 'error'
      });
    }
  };

  const handleReject = async (tokenId) => {
    if (!verificationReason[tokenId]) {
      setAlert({
        open: true,
        message: 'Vui lòng nhập lý do từ chối',
        severity: 'warning'
      });
      return;
    }

    try {
      // Đảm bảo tokenId là string khi gọi contract
      const tokenIdNormalized = normalizeTokenId(tokenId);

      await contracts.nftVerifier.methods
        .rejectNFT(tokenIdNormalized, verificationReason[tokenId])
        .send({ from: account });

      loadPendingRequests();
      setAlert({
        open: true,
        message: 'Đã từ chối NFT thành công',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error rejecting NFT:', error);
      setAlert({
        open: true,
        message: 'Lỗi khi từ chối: ' + (error.message || ''),
        severity: 'error'
      });
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isVerifier) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Bạn không phải là người xác thực được ủy quyền. Vui lòng liên hệ với quản trị viên để được cấp quyền.
        </Alert>
        <Typography sx={{ mt: 2 }}>
          Địa chỉ tài khoản hiện tại: {account}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Yêu cầu xác thực đang chờ xử lý
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : pendingRequests.length === 0 ? (
          <Alert severity="info">
            Không có yêu cầu xác thực nào đang chờ xử lý
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {pendingRequests.map((tokenId) => (
              <Grid item xs={12} sm={6} md={4} key={tokenId}>
                <Card elevation={2}>
                  {nftDetails[tokenId]?.image && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={nftDetails[tokenId].image}
                      alt={nftDetails[tokenId]?.name || `Token ${toSafeString(tokenId)}`}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {nftDetails[tokenId]?.name || `Token ID: ${toSafeString(tokenId)}`}
                    </Typography>

                    <Chip
                      icon={<PendingIcon />}
                      label="Đang chờ xác thực"
                      color="warning"
                      sx={{ mb: 2 }}
                    />

                    {nftDetails[tokenId]?.requester && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Người yêu cầu: {
                          nftDetails[tokenId].requester.substring(0, 6) +
                          '...' +
                          nftDetails[tokenId].requester.substring(38)
                        }
                      </Typography>
                    )}

                    {nftDetails[tokenId]?.requestTime && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Thời gian yêu cầu: {toSafeString(nftDetails[tokenId].requestTime)}
                      </Typography>
                    )}

                    <TextField
                      fullWidth
                      label="Lý do xác thực/từ chối"
                      multiline
                      rows={2}
                      value={verificationReason[tokenId] || ''}
                      onChange={(e) => setVerificationReason({
                        ...verificationReason,
                        [tokenId]: e.target.value
                      })}
                      sx={{ my: 2 }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<VerifiedIcon />}
                        onClick={() => handleVerify(tokenId)}
                        disabled={!verificationReason[tokenId]}
                      >
                        Xác thực
                      </Button>

                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleReject(tokenId)}
                        disabled={!verificationReason[tokenId]}
                      >
                        Từ chối
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VerificationQueue;
