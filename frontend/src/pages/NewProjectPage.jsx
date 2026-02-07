import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, CreateNewFolder } from '@mui/icons-material';
import { api } from '../api/client';
import { useSnackbar } from '../context/SnackbarContext';

export default function NewProjectPage() {
  const [name, setName] = useState('');
  const [customer, setCustomer] = useState('');
  const [communityUrl, setCommunityUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !customer.trim()) return;
    setLoading(true);
    try {
      const project = await api.createProject({
        name: name.trim(),
        customer_name: customer.trim(),
        product_type: 'PLC',
        community_url: communityUrl.trim() || undefined,
      });
      showSnackbar('Project created!', 'success');
      navigate(`/project/${project.id}/upload`);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="sm">
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            Back to Projects
          </Button>
        </Box>

        <Card
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid #e2e8f0',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 4 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: 'rgba(59, 130, 246, 0.08)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CreateNewFolder
                  sx={{ fontSize: 28, color: 'primary.main' }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    mb: 0.5,
                  }}
                >
                  New PLC Project
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  Set up AI-powered configuration
                </Typography>
              </Box>
            </Stack>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="Project Name"
                  placeholder="e.g., City of Springfield PLC"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(59, 130, 246, 0.04)',
                    },
                  }}
                />

                <TextField
                  label="Customer Name"
                  placeholder="e.g., City of Springfield"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(59, 130, 246, 0.04)',
                    },
                  }}
                />

                <TextField
                  label="Community URL"
                  placeholder="e.g., https://www.springfield.gov"
                  value={communityUrl}
                  onChange={(e) => setCommunityUrl(e.target.value)}
                  fullWidth
                  variant="outlined"
                  helperText="Enter the community's government website URL for AI to research local ordinances, fees, and processes"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(59, 130, 246, 0.04)',
                    },
                  }}
                />

                <TextField
                  label="Product"
                  value="PLC (Permitting, Licensing & Code Enforcement)"
                  fullWidth
                  disabled
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(59, 130, 246, 0.04)',
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading || !name.trim() || !customer.trim()}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    mt: 2,
                  }}
                >
                  {loading ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <CircularProgress size={20} sx={{ color: 'inherit' }} />
                      <span>Creating...</span>
                    </Stack>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
