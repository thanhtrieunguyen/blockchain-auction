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
              About NFT Auction
            </Typography>
            <Typography variant="body2" mb={2}>
              Discover, collect, and sell extraordinary NFTs on the world's first & largest NFT marketplace
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
              Marketplace
            </Typography>
            <Stack spacing={2}>
              <FooterLink component={RouterLink} to="/auctions">All NFTs</FooterLink>
              <FooterLink component={RouterLink} to="/art">Art</FooterLink>
              <FooterLink component={RouterLink} to="/collectibles">Collectibles</FooterLink>
              <FooterLink component={RouterLink} to="/photography">Photography</FooterLink>
            </Stack>
          </Grid>

          <Grid item xs={12} md={2}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Resources
            </Typography>
            <Stack spacing={2}>
              <FooterLink component={RouterLink} to="/help">Help Center</FooterLink>
              <FooterLink component={RouterLink} to="/partners">Partners</FooterLink>
              <FooterLink component={RouterLink} to="/suggestions">Suggestions</FooterLink>
              <FooterLink component={RouterLink} to="/blog">Blog</FooterLink>
            </Stack>
          </Grid>

          <Grid item xs={12} md={2}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Company
            </Typography>
            <Stack spacing={2}>
              <FooterLink component={RouterLink} to="/about">About</FooterLink>
              <FooterLink component={RouterLink} to="/careers">Careers</FooterLink>
              <FooterLink component={RouterLink} to="/contact">Contact</FooterLink>
              <FooterLink component={RouterLink} to="/privacy">Privacy Policy</FooterLink>
            </Stack>
          </Grid>

          <Grid item xs={12} md={2}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Support
            </Typography>
            <Stack spacing={2}>
              <FooterLink href="mailto:support@nftauction.com">Contact Support</FooterLink>
              <FooterLink component={RouterLink} to="/faq">FAQ</FooterLink>
              <FooterLink component={RouterLink} to="/docs">Documentation</FooterLink>
              <FooterLink component={RouterLink} to="/status">System Status</FooterLink>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ mt: 6, mb: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">
            © {new Date().getFullYear()} NFT Auction. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={3}>
            <FooterLink component={RouterLink} to="/terms">Terms</FooterLink>
            <FooterLink component={RouterLink} to="/privacy">Privacy</FooterLink>
            <FooterLink component={RouterLink} to="/security">Security</FooterLink>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;