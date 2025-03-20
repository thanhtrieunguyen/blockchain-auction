import React from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  IconButton, 
  Link, 
  Divider,
  Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import GitHubIcon from '@mui/icons-material/GitHub';
import TelegramIcon from '@mui/icons-material/Telegram';
import { Link as RouterLink } from 'react-router-dom';

const FooterLink = styled(Link)({
  color: 'inherit',
  textDecoration: 'none',
  '&:hover': {
    color: '#2196f3',
    textDecoration: 'none',
  },
});

const SocialButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.common.white,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  '&:hover': {
    backgroundColor: '#2196f3',
  },
  marginRight: theme.spacing(1),
}));

const Footer = () => {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        color: 'text.secondary',
        py: 6,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Giới Thiệu Đấu Giá NFT
            </Typography>
            <Typography variant="body2" mb={2}>
              Khám phá, sưu tầm và bán các NFT độc đáo trên sàn giao dịch NFT lớn nhất và đầu tiên trên thế giới
            </Typography>
            <Stack direction="row" spacing={1}>
              <SocialButton aria-label="twitter">
                <TwitterIcon />
              </SocialButton>
              <SocialButton aria-label="facebook">
                <FacebookIcon />
              </SocialButton>
              <SocialButton aria-label="instagram">
                <InstagramIcon />
              </SocialButton>
              <SocialButton aria-label="github">
                <GitHubIcon />
              </SocialButton>
              <SocialButton aria-label="telegram">
                <TelegramIcon />
              </SocialButton>
            </Stack>
          </Grid>

          <Grid item xs={12} md={2}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Thị Trường
            </Typography>
            <Stack spacing={2}>
              <FooterLink component={RouterLink} to="/auctions">Tất Cả NFT</FooterLink>
              <FooterLink component={RouterLink} to="/art">Nghệ Thuật</FooterLink>
              <FooterLink component={RouterLink} to="/collectibles">Bộ Sưu Tập</FooterLink>
              <FooterLink component={RouterLink} to="/photography">Nhiếp Ảnh</FooterLink>
            </Stack>
          </Grid>

          <Grid item xs={12} md={2}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Tài Nguyên
            </Typography>
            <Stack spacing={2}>
              <FooterLink component={RouterLink} to="/help">Trung Tâm Trợ Giúp</FooterLink>
              <FooterLink component={RouterLink} to="/partners">Đối Tác</FooterLink>
              <FooterLink component={RouterLink} to="/suggestions">Đề Xuất</FooterLink>
              <FooterLink component={RouterLink} to="/blog">Blog</FooterLink>
            </Stack>
          </Grid>

          <Grid item xs={12} md={2}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Công Ty
            </Typography>
            <Stack spacing={2}>
              <FooterLink component={RouterLink} to="/about">Giới Thiệu</FooterLink>
              <FooterLink component={RouterLink} to="/careers">Tuyển Dụng</FooterLink>
              <FooterLink component={RouterLink} to="/contact">Liên Hệ</FooterLink>
              <FooterLink component={RouterLink} to="/privacy">Chính Sách Bảo Mật</FooterLink>
            </Stack>
          </Grid>

          <Grid item xs={12} md={2}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Hỗ Trợ
            </Typography>
            <Stack spacing={2}>
              <FooterLink href="mailto:support@nftauction.com">Liên Hệ Hỗ Trợ</FooterLink>
              <FooterLink component={RouterLink} to="/faq">Câu Hỏi Thường Gặp</FooterLink>
              <FooterLink component={RouterLink} to="/docs">Tài Liệu</FooterLink>
              <FooterLink component={RouterLink} to="/status">Trạng Thái Hệ Thống</FooterLink>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ mt: 6, mb: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">
            © {new Date().getFullYear()} Đấu Giá NFT. Đã đăng ký bản quyền.
          </Typography>
          <Stack direction="row" spacing={3}>
            <FooterLink component={RouterLink} to="/terms">Điều Khoản</FooterLink>
            <FooterLink component={RouterLink} to="/privacy">Quyền Riêng Tư</FooterLink>
            <FooterLink component={RouterLink} to="/security">Bảo Mật</FooterLink>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;