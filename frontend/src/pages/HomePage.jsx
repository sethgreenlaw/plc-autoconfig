import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  Grid,
  CircularProgress,
  Stack,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Container,
  Fade,
} from '@mui/material';
import {
  Add,
  Description,
  Delete,
  Language,
  ArrowForward,
  AutoAwesome,
  Speed,
  Security,
  TrendingUp,
} from '@mui/icons-material';
import { api } from '../api/client';

const STATUS_CONFIG = {
  setup: { variant: 'default', label: 'Setup', color: 'default' },
  uploading: { variant: 'outlined', label: 'Uploading', color: 'warning' },
  analyzing: { variant: 'filled', label: 'Analyzing', color: 'info', spinning: true },
  configured: { variant: 'filled', label: 'Configured', color: 'success' },
  error: { variant: 'filled', label: 'Error', color: 'error' },
};

const FEATURES = [
  {
    icon: AutoAwesome,
    title: 'AI-Powered',
    desc: 'Intelligent agents analyze your data and community to build configurations automatically',
  },
  {
    icon: Speed,
    title: 'Minutes, Not Months',
    desc: 'Generate complete PLC configurations in minutes instead of weeks of manual setup',
  },
  {
    icon: Security,
    title: 'Research-Backed',
    desc: 'Deep-dives into municipal codes, fee schedules, and permit processes for accuracy',
  },
];

export default function HomePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityUrl, setCityUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .listProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project?')) return;
    await api.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleGetStarted = () => {
    const encoded = encodeURIComponent(cityUrl.trim());
    navigate(cityUrl.trim() ? `/new?url=${encoded}` : '/new');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && cityUrl.trim()) {
      handleGetStarted();
    }
  };

  return (
    <Box sx={{ bgcolor: '#fafbfc', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a56db 0%, #1e40af 40%, #0f172a 100%)',
          position: 'relative',
          overflow: 'hidden',
          pb: 10,
          pt: 3,
        }}
      >
        {/* Subtle grid pattern overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
          }}
        />

        {/* Nav bar */}
        <Container maxWidth="lg">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 8 }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Description sx={{ color: '#fff', fontSize: 20 }} />
              </Box>
              <Typography
                variant="h6"
                sx={{ color: '#fff', fontWeight: 700, letterSpacing: 0.5 }}
              >
                OpenGov Auto Implementation
              </Typography>
            </Stack>
            {projects.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/new')}
                startIcon={<Add />}
                sx={{
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.3)',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#fff',
                    bgcolor: 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                New Project
              </Button>
            )}
          </Stack>

          {/* Hero Content */}
          <Box sx={{ maxWidth: 720, mx: 'auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Fade in timeout={600}>
              <Box>
                <Chip
                  label="AI-Powered Implementation Engine"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    mb: 3,
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                />
                <Typography
                  variant="h2"
                  sx={{
                    color: '#fff',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.15,
                    mb: 2,
                    fontSize: { xs: '2rem', sm: '2.75rem', md: '3.25rem' },
                  }}
                >
                  Auto-Implement in Minutes,{' '}
                  <Box
                    component="span"
                    sx={{
                      background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Not Months
                  </Box>
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 400,
                    lineHeight: 1.6,
                    mb: 5,
                    maxWidth: 560,
                    mx: 'auto',
                    fontSize: { xs: '0.95rem', md: '1.1rem' },
                  }}
                >
                  Enter your community's website and our AI agents will research local
                  ordinances, fees, and processes to auto-generate your OpenGov implementation configuration.
                </Typography>

                {/* City URL Input */}
                <Box
                  sx={{
                    maxWidth: 540,
                    mx: 'auto',
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'stretch',
                  }}
                >
                  <TextField
                    placeholder="Enter city website  e.g. springfield.gov"
                    value={cityUrl}
                    onChange={(e) => setCityUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Language sx={{ color: 'rgba(255,255,255,0.4)' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.08)',
                        borderRadius: 2,
                        color: '#fff',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.15)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#60a5fa',
                        },
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: 'rgba(255,255,255,0.4)',
                        opacity: 1,
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleGetStarted}
                    endIcon={<ArrowForward />}
                    sx={{
                      bgcolor: '#fff',
                      color: '#1a56db',
                      fontWeight: 700,
                      textTransform: 'none',
                      px: 3.5,
                      borderRadius: 2,
                      whiteSpace: 'nowrap',
                      '&:hover': {
                        bgcolor: '#f0f4ff',
                      },
                    }}
                  >
                    Get Started
                  </Button>
                </Box>
              </Box>
            </Fade>
          </Box>
        </Container>
      </Box>

      {/* Feature Cards */}
      <Container maxWidth="lg" sx={{ mt: -5, position: 'relative', zIndex: 2 }}>
        <Grid container spacing={3}>
          {FEATURES.map((feat) => (
            <Grid item xs={12} md={4} key={feat.title}>
              <Card
                sx={{
                  bgcolor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 3,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                  height: '100%',
                }}
              >
                <CardContent sx={{ p: 3.5 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: 'rgba(26,86,219,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    <feat.icon sx={{ color: '#1a56db', fontSize: 24 }} />
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}
                  >
                    {feat.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                    {feat.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Projects Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : projects.length > 0 ? (
          <>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Your Projects
              </Typography>
              <Chip label={`${projects.length} project${projects.length !== 1 ? 's' : ''}`} size="small" />
            </Stack>
            <Grid container spacing={2}>
              {projects.map((project) => {
                const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.setup;
                return (
                  <Grid item xs={12} sm={6} md={4} key={project.id}>
                    <Card
                      sx={{
                        bgcolor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 3,
                        transition: 'all 0.2s',
                        height: '100%',
                        '&:hover': {
                          borderColor: '#1a56db',
                          boxShadow: '0 4px 16px rgba(26, 86, 219, 0.12)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <CardActionArea
                        onClick={() => navigate(`/project/${project.id}/overview`)}
                        sx={{ p: 2.5, height: '100%' }}
                      >
                        <Stack spacing={2}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: 'rgba(26,86,219,0.08)',
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Description sx={{ fontSize: 22, color: '#1a56db' }} />
                            </Box>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(e, project.id);
                              }}
                              sx={{
                                color: 'text.secondary',
                                '&:hover': {
                                  color: 'error.main',
                                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                                },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Stack>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.25 }}>
                              {project.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {project.customer_name}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={statusConfig.label}
                              color={statusConfig.color}
                              variant={statusConfig.variant}
                              size="small"
                              icon={
                                statusConfig.spinning ? (
                                  <CircularProgress size={14} sx={{ ml: '4px !important' }} />
                                ) : undefined
                              }
                            />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {project.uploaded_files?.length || 0} files
                            </Typography>
                          </Stack>
                        </Stack>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        ) : null}
      </Container>
    </Box>
  );
}
