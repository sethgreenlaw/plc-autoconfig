import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Stack,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Slideshow,
  QuestionAnswer,
  Quiz,
  MenuBook,
  Download,
  Refresh,
  CheckCircle,
} from '@mui/icons-material';
import { api } from '../../api/client';

const CONTENT_TYPES = [
  {
    id: 'training-deck',
    title: 'Training Deck',
    description: 'Professional slide deck covering current vs. new processes, record types, fees, workflows, and roles. Compatible with Google Slides.',
    icon: Slideshow,
    color: '#3b82f6',
    fileExt: '.pptx',
    fileLabel: 'PowerPoint',
  },
  {
    id: 'faq',
    title: 'FAQ Document',
    description: 'Comprehensive FAQ guide organized by audience - applicants, staff, administrators, and troubleshooting. Branded with community details.',
    icon: QuestionAnswer,
    color: '#10b981',
    fileExt: '.pdf',
    fileLabel: 'PDF',
  },
  {
    id: 'quiz',
    title: 'Knowledge Quiz',
    description: 'Staff knowledge assessment with questions generated from your specific configuration - record types, fees, workflows, and roles.',
    icon: Quiz,
    color: '#f59e0b',
    fileExt: '.pdf',
    fileLabel: 'PDF',
  },
  {
    id: 'handbook',
    title: 'Process Handbook',
    description: 'Complete reference handbook with table of contents, all record types, fee schedules, workflows, departments, and best practices.',
    icon: MenuBook,
    color: '#8b5cf6',
    fileExt: '.pdf',
    fileLabel: 'PDF',
  },
];

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function downloadBase64File(base64, filename, mimeType) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const MIME_TYPES = {
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf': 'application/pdf',
};

const LmsTab = ({ project, config, projectId, showSnackbar }) => {
  const [generating, setGenerating] = useState({});
  const [generated, setGenerated] = useState({});
  const [errors, setErrors] = useState({});

  const hasConfig = config && config.record_types && config.record_types.length > 0;

  const handleGenerate = async (typeId) => {
    setGenerating((prev) => ({ ...prev, [typeId]: true }));
    setErrors((prev) => ({ ...prev, [typeId]: null }));

    try {
      const result = await api.generateLms(projectId, typeId);
      setGenerated((prev) => ({
        ...prev,
        [typeId]: {
          filename: result.filename,
          content_base64: result.content_base64,
          size_bytes: result.size_bytes,
          generated_at: result.generated_at,
        },
      }));
      showSnackbar(`${CONTENT_TYPES.find((t) => t.id === typeId)?.title} generated!`, 'success');
    } catch (err) {
      setErrors((prev) => ({ ...prev, [typeId]: err.message }));
      showSnackbar(`Failed to generate: ${err.message}`, 'error');
    } finally {
      setGenerating((prev) => ({ ...prev, [typeId]: false }));
    }
  };

  const handleDownload = (typeId) => {
    const data = generated[typeId];
    if (!data) return;
    const contentType = CONTENT_TYPES.find((t) => t.id === typeId);
    const mime = MIME_TYPES[contentType.fileExt] || 'application/octet-stream';
    downloadBase64File(data.content_base64, data.filename, mime);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Learning Materials
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Generate training content based on your project configuration. Each document is tailored to{' '}
          {project?.customer_name || 'your community'}'s specific setup.
        </Typography>
      </Box>

      {!hasConfig && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No configuration found. Upload data and run analysis first to generate learning materials.
        </Alert>
      )}

      <Grid container spacing={3}>
        {CONTENT_TYPES.map((type) => {
          const isGenerating = generating[type.id];
          const data = generated[type.id];
          const error = errors[type.id];
          const Icon = type.icon;

          return (
            <Grid item xs={12} sm={6} lg={3} key={type.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: data ? `2px solid ${type.color}22` : '1px solid #e2e8f0',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      bgcolor: `${type.color}12`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    <Icon sx={{ fontSize: 28, color: type.color }} />
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {type.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary', mb: 2, flex: 1, lineHeight: 1.6 }}
                  >
                    {type.description}
                  </Typography>

                  <Chip
                    label={type.fileLabel}
                    size="small"
                    sx={{
                      alignSelf: 'flex-start',
                      mb: 2,
                      bgcolor: `${type.color}12`,
                      color: type.color,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  />

                  {error && (
                    <Alert severity="error" sx={{ mb: 2, py: 0.5 }}>
                      {error}
                    </Alert>
                  )}

                  {data && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {formatBytes(data.size_bytes)} generated
                      </Typography>
                    </Stack>
                  )}

                  <Stack spacing={1} sx={{ mt: 'auto' }}>
                    {data ? (
                      <>
                        <Button
                          variant="contained"
                          startIcon={<Download />}
                          onClick={() => handleDownload(type.id)}
                          fullWidth
                          sx={{
                            bgcolor: type.color,
                            '&:hover': { bgcolor: type.color, filter: 'brightness(0.9)' },
                          }}
                        >
                          Download
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={isGenerating ? <CircularProgress size={16} /> : <Refresh />}
                          onClick={() => handleGenerate(type.id)}
                          disabled={isGenerating || !hasConfig}
                          fullWidth
                        >
                          {isGenerating ? 'Regenerating...' : 'Regenerate'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        startIcon={
                          isGenerating ? <CircularProgress size={18} color="inherit" /> : <Icon />
                        }
                        onClick={() => handleGenerate(type.id)}
                        disabled={isGenerating || !hasConfig}
                        fullWidth
                        sx={{
                          bgcolor: type.color,
                          '&:hover': { bgcolor: type.color, filter: 'brightness(0.9)' },
                        }}
                      >
                        {isGenerating ? 'Generating...' : 'Generate'}
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default LmsTab;
