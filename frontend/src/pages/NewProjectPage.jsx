import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  CircularProgress,
  Fade,
  Chip,
  InputAdornment,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Language,
  ArrowForward,
  LocationCity,
  CheckCircle,
} from '@mui/icons-material';
import { api } from '../api/client';
import { useSnackbar } from '../context/SnackbarContext';

export default function NewProjectPage() {
  const [searchParams] = useSearchParams();
  const initialUrl = searchParams.get('url') || '';

  const [step, setStep] = useState(initialUrl ? 2 : 1);
  const [cityUrl, setCityUrl] = useState(initialUrl);
  const [cityPreview, setCityPreview] = useState(null);
  const [fetchingCity, setFetchingCity] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const [name, setName] = useState('');
  const [customer, setCustomer] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  // Auto-fetch city preview if URL provided via query param
  useEffect(() => {
    if (initialUrl) {
      fetchCityPreview(initialUrl);
    }
  }, []);

  const fetchCityPreview = async (url) => {
    if (!url.trim()) return;
    setFetchingCity(true);
    setFetchError('');
    try {
      const preview = await api.getCityPreview(url.trim());
      setCityPreview(preview);
      // Auto-fill fields from city data
      if (preview.city_name) {
        setCustomer(preview.city_name);
        setName(`${preview.city_name} Implementation`);
      }
      setStep(2);
    } catch (err) {
      setFetchError('Could not fetch city details, but you can continue manually.');
      setStep(2);
    } finally {
      setFetchingCity(false);
    }
  };

  const handleUrlSubmit = (e) => {
    e?.preventDefault();
    fetchCityPreview(cityUrl);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !customer.trim()) return;
    setLoading(true);
    try {
      const project = await api.createProject({
        name: name.trim(),
        customer_name: customer.trim(),
        product_type: 'PLC',
        community_url: cityUrl.trim() || undefined,
      });
      showSnackbar('Project created!', 'success');
      navigate(`/project/${project.id}/upload`, { state: { project } });
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#fafbfc', minHeight: '100vh' }}>
      {/* Top bar */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', py: 1.5, px: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
          >
            Back
          </Button>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label="Step 1"
              size="small"
              variant={step >= 1 ? 'filled' : 'outlined'}
              color={step >= 1 ? 'primary' : 'default'}
              sx={{ fontWeight: 600 }}
            />
            <Box sx={{ width: 24, height: 2, bgcolor: step >= 2 ? 'primary.main' : '#e2e8f0', borderRadius: 1 }} />
            <Chip
              label="Step 2"
              size="small"
              variant={step >= 2 ? 'filled' : 'outlined'}
              color={step >= 2 ? 'primary' : 'default'}
              sx={{ fontWeight: 600 }}
            />
          </Stack>
          <Box sx={{ width: 80 }} />
        </Stack>
      </Box>

      <Container maxWidth="md" sx={{ py: 5 }}>
        {/* Step 1: City URL */}
        {step === 1 && (
          <Fade in timeout={400}>
            <Box sx={{ maxWidth: 560, mx: 'auto', textAlign: 'center' }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 3,
                  bgcolor: 'rgba(26,86,219,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <Language sx={{ fontSize: 32, color: '#1a56db' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1.5 }}>
                Which community?
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.6 }}>
                Enter the community's government website and we'll pull in local context
                to personalize your implementation project.
              </Typography>

              <form onSubmit={handleUrlSubmit}>
                <Stack spacing={2}>
                  <TextField
                    placeholder="e.g. springfield.gov"
                    value={cityUrl}
                    onChange={(e) => setCityUrl(e.target.value)}
                    fullWidth
                    variant="outlined"
                    autoFocus
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Language sx={{ color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#fff',
                        borderRadius: 2,
                        fontSize: '1.05rem',
                      },
                    }}
                  />
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={!cityUrl.trim() || fetchingCity}
                      endIcon={fetchingCity ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 1.5,
                        borderRadius: 2,
                        fontSize: '1rem',
                      }}
                    >
                      {fetchingCity ? 'Looking up city...' : 'Continue'}
                    </Button>
                  </Stack>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setStep(2)}
                    sx={{ textTransform: 'none', color: 'text.secondary' }}
                  >
                    Skip — I'll enter details manually
                  </Button>
                </Stack>
              </form>
            </Box>
          </Fade>
        )}

        {/* Step 2: City Preview + Project Details */}
        {step === 2 && (
          <Fade in timeout={400}>
            <Box>
              {/* City Preview Banner */}
              {(cityPreview || fetchingCity) && (
                <Card
                  sx={{
                    mb: 4,
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Banner image or gradient */}
                  <Box
                    sx={{
                      height: 160,
                      background: cityPreview?.og_image
                        ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${cityPreview.og_image}) center/cover`
                        : 'linear-gradient(135deg, #1a56db 0%, #1e40af 50%, #0f172a 100%)',
                      display: 'flex',
                      alignItems: 'flex-end',
                      p: 3,
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      {fetchingCity ? (
                        <Skeleton variant="circular" width={48} height={48} />
                      ) : cityPreview?.favicon ? (
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          <Box
                            component="img"
                            src={cityPreview.favicon}
                            alt=""
                            sx={{ width: 32, height: 32, objectFit: 'contain' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <LocationCity sx={{ color: '#fff', fontSize: 28 }} />
                        </Box>
                      )}
                      <Box>
                        {fetchingCity ? (
                          <>
                            <Skeleton width={200} height={28} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                            <Skeleton width={300} height={18} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                          </>
                        ) : (
                          <>
                            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700 }}>
                              {cityPreview?.city_name || 'Community'}
                            </Typography>
                            {cityPreview?.description && (
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: 500 }} noWrap>
                                {cityPreview.description}
                              </Typography>
                            )}
                          </>
                        )}
                      </Box>
                    </Stack>
                  </Box>

                  {cityPreview && (
                    <Box sx={{ px: 3, py: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <CheckCircle sx={{ color: 'success.main', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Community detected from <strong>{cityPreview?.url}</strong>
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => { setStep(1); setCityPreview(null); }}
                          sx={{ textTransform: 'none', ml: 'auto', fontSize: '0.75rem' }}
                        >
                          Change
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </Card>
              )}

              {fetchError && (
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                  {fetchError}
                </Alert>
              )}

              {/* Project Details Form */}
              <Card
                sx={{
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                    Project Details
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
                    Review and complete the information below to create your implementation project.
                  </Typography>

                  <form onSubmit={handleCreate}>
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
                            bgcolor: '#fff',
                            borderRadius: 2,
                          },
                        }}
                      />

                      <TextField
                        label="Customer / Community Name"
                        placeholder="e.g., City of Springfield"
                        value={customer}
                        onChange={(e) => setCustomer(e.target.value)}
                        fullWidth
                        required
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#fff',
                            borderRadius: 2,
                          },
                        }}
                      />

                      <TextField
                        label="Community Website"
                        value={cityUrl}
                        onChange={(e) => setCityUrl(e.target.value)}
                        fullWidth
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Language sx={{ color: 'text.disabled' }} />
                            </InputAdornment>
                          ),
                        }}
                        helperText="Used by AI agents to research local ordinances, fees, and permit processes"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#fff',
                            borderRadius: 2,
                          },
                        }}
                      />

                      <TextField
                        label="Product"
                        value="OpenGov Implementation Suite"
                        fullWidth
                        disabled
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#f8fafc',
                            borderRadius: 2,
                          },
                        }}
                      />

                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={loading || !name.trim() || !customer.trim()}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          py: 1.5,
                          mt: 1,
                          borderRadius: 2,
                          fontSize: '1rem',
                        }}
                      >
                        {loading ? (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CircularProgress size={20} sx={{ color: 'inherit' }} />
                            <span>Creating Project...</span>
                          </Stack>
                        ) : (
                          'Create Project'
                        )}
                      </Button>
                    </Stack>
                  </form>
                </CardContent>
              </Card>
            </Box>
          </Fade>
        )}
      </Container>
    </Box>
  );
}
