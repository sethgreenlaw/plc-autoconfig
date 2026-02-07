import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Container,
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
} from '@mui/material';
import {
  Add,
  Description,
  Delete,
  Refresh,
} from '@mui/icons-material';
import { api } from '../api/client';

const STATUS_CONFIG = {
  setup: { variant: 'default', label: 'Setup', color: 'default' },
  uploading: { variant: 'outlined', label: 'Uploading', color: 'warning' },
  analyzing: { variant: 'filled', label: 'Analyzing', color: 'info', spinning: true },
  configured: { variant: 'filled', label: 'Configured', color: 'success' },
  error: { variant: 'filled', label: 'Error', color: 'error' },
};

export default function HomePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const handleCardClick = (projectId) => {
    navigate(`/project/${projectId}/overview`);
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="static"
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Toolbar>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
            <Description sx={{ fontSize: 28, color: 'primary.main' }} />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  letterSpacing: 0.5,
                }}
              >
                PLC AutoConfig
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  display: 'block',
                  mt: -0.5,
                }}
              >
                AI-Powered Configuration Engine
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => navigate('/new')}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            New Project
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 12,
            }}
          >
            <CircularProgress />
          </Box>
        ) : projects.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'rgba(59, 130, 246, 0.08)',
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <Description
                sx={{ fontSize: 48, color: 'text.secondary' }}
              />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                mb: 1,
              }}
            >
              No projects yet
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mb: 3,
                maxWidth: 400,
              }}
            >
              Upload historical customer data and let AI generate PLC configurations.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={() => navigate('/new')}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Create First Project
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {projects.map((project) => {
              const statusConfig = STATUS_CONFIG[project.status] || STATUS_CONFIG.setup;
              return (
                <Grid item xs={12} key={project.id}>
                  <Card
                    sx={{
                      bgcolor: 'background.paper',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.12)',
                      },
                    }}
                  >
                    <CardActionArea
                      onClick={() => handleCardClick(project.id)}
                      sx={{ p: 2.5 }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              bgcolor: 'rgba(59, 130, 246, 0.08)',
                              borderRadius: 1.5,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Description
                              sx={{ fontSize: 24, color: 'primary.main' }}
                            />
                          </Box>
                          <Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                              }}
                            >
                              {project.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                              }}
                            >
                              {project.customer_name} • {project.product_type}
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          sx={{ ml: 'auto' }}
                        >
                          <Chip
                            label={statusConfig.label}
                            color={statusConfig.color}
                            variant={statusConfig.variant}
                            size="small"
                            icon={
                              statusConfig.spinning ? (
                                <CircularProgress
                                  size={16}
                                  sx={{ ml: '4px !important' }}
                                />
                              ) : undefined
                            }
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              minWidth: 60,
                            }}
                          >
                            {project.uploaded_files?.length || 0} files
                          </Typography>
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
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
