import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';
import { styled } from '@mui/material/styles';

const FooterContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  marginTop: 'auto',
  padding: theme.spacing(2, 0),
  borderTop: `3px solid ${theme.palette.secondary.main}`,
}));

const FooterContent = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
  [theme.breakpoints.up('sm')]: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
}));

const BrandLink = styled(Link)(({ theme }) => ({
  color: theme.palette.secondary.main,
  textDecoration: 'none',
  fontWeight: 600,
  '&:hover': {
    textDecoration: 'underline',
    color: theme.palette.secondary.light,
  },
}));

const ContactLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.contrastText,
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
    color: theme.palette.secondary.light,
  },
}));

function Footer() {
  return (
    <FooterContainer component="footer">
      <FooterContent maxWidth="lg">
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <BrandLink 
              href="https://tridentsys.ca" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              HydrantHub by Trident Systems
            </BrandLink>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Professional Fire Flow Testing | NFPA 291 Certified
          </Typography>
        </Box>
        
        <Box sx={{ textAlign: { xs: 'center', sm: 'right' } }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <ContactLink 
              href="mailto:info@tridentsys.ca"
            >
              info@tridentsys.ca
            </ContactLink>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Serving GTA, Hamilton & Niagara Regions
          </Typography>
        </Box>
      </FooterContent>
    </FooterContainer>
  );
}

export default Footer;