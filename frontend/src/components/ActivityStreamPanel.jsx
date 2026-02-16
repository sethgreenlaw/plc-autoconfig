import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  Stack,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Button,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Error as ErrorIcon,
  Language,
  Storage,
  Psychology,
  AutoFixHigh,
  ExpandMore,
  ExpandLess,
  Description,
  AttachMoney,
  AccountBalance,
  Article,
  PictureAsPdf,
  OpenInNew,
  Refresh,
} from '@mui/icons-material';
import LinkIcon from '@mui/icons-material/Link';

const ActivityStreamPanel = ({ steps, overallProgress, onRetryStep }) => {
  const [expandedSteps, setExpandedSteps] = useState({});
  const [elapsedTimes, setElapsedTimes] = useState({});

  // Track elapsed time for in_progress steps
  useEffect(() => {
    const stepStartTimes = {};
    steps.forEach((step) => {
      if (step.status === 'in_progress' && !stepStartTimes[step.id]) {
        stepStartTimes[step.id] = Date.now();
      }
    });

    const interval = setInterval(() => {
      setElapsedTimes((prev) => {
        const updated = { ...prev };
        steps.forEach((step) => {
          if (step.status === 'in_progress') {
            if (!updated[step.id]) {
              updated[step.id] = { startTime: Date.now(), elapsed: 0 };
            } else {
              updated[step.id].elapsed = Math.floor((Date.now() - updated[step.id].startTime) / 1000);
            }
          } else if (updated[step.id]) {
            // Clear elapsed time if step is no longer in progress
            delete updated[step.id];
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [steps]);

  const toggleExpand = (stepId) => {
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const getStepIcon = (stepId) => {
    switch (stepId) {
      case 1:
        return <Storage sx={{ fontSize: 24 }} />;
      case 2:
        return <Language sx={{ fontSize: 24 }} />;
      case 3:
        return <Psychology sx={{ fontSize: 24 }} />;
      case 4:
        return <AutoFixHigh sx={{ fontSize: 24 }} />;
      default:
        return null;
    }
  };

  const getStatusDot = (status) => {
    const baseStyles = {
      width: 12,
      height: 12,
      borderRadius: '50%',
      position: 'relative',
    };

    if (status === 'waiting') {
      return <Box sx={{ ...baseStyles, backgroundColor: '#d1d5db', border: '2px solid #9ca3af' }} />;
    }

    if (status === 'in_progress') {
      return (
        <Box
          sx={{
            ...baseStyles,
            backgroundColor: '#3b82f6',
            border: '2px solid #1e40af',
            animation: 'pulse-dot 2s ease-in-out infinite',
            '@keyframes pulse-dot': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.4 },
            },
          }}
        />
      );
    }

    if (status === 'completed') {
      return <CheckCircle sx={{ fontSize: 16, color: '#22c55e' }} />;
    }

    if (status === 'failed') {
      return <ErrorIcon sx={{ fontSize: 16, color: '#ef4444' }} />;
    }

    if (status === 'skipped') {
      return <Box sx={{ ...baseStyles, backgroundColor: '#f97316', border: '2px solid #c2410c' }} />;
    }

    return null;
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'default';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'skipped':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const renderStepDetails = (step) => {
    if (!step.activity || !step.activity.details) {
      return null;
    }

    const details = step.activity.details;

    switch (step.id) {
      case 1: // Parse CSV
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Files Parsed
            </Typography>
            {details.files && Array.isArray(details.files) && details.files.length > 0 ? (
              <Stack spacing={1}>
                {details.files.map((file, idx) => (
                  <Paper
                    key={idx}
                    sx={{
                      p: 1.5,
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Description sx={{ fontSize: 18, color: '#3b82f6' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {file.filename}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, ml: 3.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {file.rows_count} rows
                      </Typography>
                      {file.columns && file.columns.length > 0 && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {file.columns.length} columns
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                No file details available
              </Typography>
            )}
          </Box>
        );

      case 2: // Scrape Website
        return (
          <Box sx={{ mt: 2 }}>
            {details.urls && Array.isArray(details.urls) && details.urls.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Top Scraped URLs
                </Typography>
                <List disablePadding sx={{ mb: 2 }}>
                  {details.urls.slice(0, 5).map((url, idx) => (
                    <ListItem
                      key={idx}
                      sx={{
                        pl: 0,
                        py: 0.5,
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                      }}
                    >
                      <LinkIcon sx={{ fontSize: 16, color: '#3b82f6', flexShrink: 0 }} />
                      <Typography
                        variant="caption"
                        component="a"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: '#3b82f6',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' },
                          flex: 1,
                          wordBreak: 'break-word',
                        }}
                      >
                        {url}
                      </Typography>
                      <OpenInNew sx={{ fontSize: 14, color: '#3b82f6', flexShrink: 0 }} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {details.pages_found && (
                <Chip
                  size="small"
                  label={`${details.pages_found} pages`}
                  icon={<Language sx={{ fontSize: 16 }} />}
                  variant="outlined"
                />
              )}
              {details.pdfs_found && (
                <Chip
                  size="small"
                  label={`${details.pdfs_found} PDFs`}
                  icon={<PictureAsPdf sx={{ fontSize: 16 }} />}
                  variant="outlined"
                />
              )}
              {details.permits_mentioned && (
                <Chip
                  size="small"
                  label={`${details.permits_mentioned} permits mentioned`}
                  variant="outlined"
                />
              )}
              {details.departments_mentioned && (
                <Chip
                  size="small"
                  label={`${details.departments_mentioned} departments`}
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        );

      case 3: // Extract Data
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {details.permits_found && (
                <Chip
                  size="small"
                  label={`${details.permits_found} permits`}
                  icon={<Article sx={{ fontSize: 16 }} />}
                  color="primary"
                  variant="outlined"
                />
              )}
              {details.fees_found && (
                <Chip
                  size="small"
                  label={`${details.fees_found} fees`}
                  icon={<AttachMoney sx={{ fontSize: 16 }} />}
                  color="primary"
                  variant="outlined"
                />
              )}
              {details.departments_found && (
                <Chip
                  size="small"
                  label={`${details.departments_found} departments`}
                  icon={<AccountBalance sx={{ fontSize: 16 }} />}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>

            {details.ai_summary && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  AI Summary
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  {details.ai_summary}
                </Typography>
              </>
            )}
          </Box>
        );

      case 4: // Generate Config
        return (
          <Box sx={{ mt: 2 }}>
            {details.record_types_created !== undefined && (
              <Box sx={{ mb: 2 }}>
                <Chip
                  size="small"
                  label={`${details.record_types_created} record types created`}
                  icon={<AutoFixHigh sx={{ fontSize: 16 }} />}
                  color="success"
                  variant="outlined"
                />
              </Box>
            )}

            {details.data_connections && Array.isArray(details.data_connections) && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Data Connections
                </Typography>
                <Box
                  sx={{
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: 1,
                    p: 1.5,
                  }}
                >
                  {details.data_connections.map((conn, idx) => (
                    <Box key={idx} sx={{ mb: idx < details.data_connections.length - 1 ? 1 : 0 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {conn.record_type}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        Informed by: {Array.isArray(conn.sources) ? conn.sources.join(', ') : conn.sources}
                      </Typography>
                      {idx < details.data_connections.length - 1 && (
                        <Divider sx={{ my: 0.5 }} />
                      )}
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Paper
      sx={{
        mb: 3,
        p: 2.5,
        borderColor: 'primary.main',
        borderWidth: 1,
        backgroundColor: '#fafbfc',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <Psychology sx={{ color: '#3b82f6', fontSize: 28 }} />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#3b82f6' }}>
            AI Analysis in Progress
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Real-time activity stream showing analysis steps
          </Typography>
        </Box>
      </Box>

      {/* Overall Progress Bar */}
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Overall Progress
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b82f6' }}>
            {Math.round(overallProgress)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={overallProgress}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: '#e2e8f0',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#3b82f6',
              borderRadius: 4,
            },
          }}
        />
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Steps */}
      <Stack spacing={1.5}>
        {steps.map((step) => {
          const isExpanded = expandedSteps[step.id];
          const hasDetails = step.activity && step.activity.details;

          return (
            <Box key={step.id}>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  cursor: hasDetails ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  '&:hover': hasDetails
                    ? {
                        backgroundColor: '#f8fafc',
                        borderColor: '#cbd5e1',
                      }
                    : {},
                }}
                onClick={() => hasDetails && toggleExpand(step.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  {/* Timeline Dot */}
                  <Box sx={{ pt: 0.5, flexShrink: 0 }}>
                    {getStatusDot(step.status)}
                  </Box>

                  {/* Step Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Box sx={{ color: '#3b82f6' }}>
                        {getStepIcon(step.id)}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {step.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={getStatusLabel(step.status)}
                        color={getStatusBadgeColor(step.status)}
                        variant="outlined"
                      />
                      {step.status === 'in_progress' && elapsedTimes[step.id] && (
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b82f6', ml: 'auto' }}>
                          {elapsedTimes[step.id].elapsed}s
                        </Typography>
                      )}
                    </Box>

                    {step.activity && step.activity.description && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          mt: 0.5,
                          ...(step.status === 'in_progress' && {
                            animation: 'pulse 2s ease-in-out infinite',
                            '@keyframes pulse': {
                              '0%, 100%': { opacity: 1 },
                              '50%': { opacity: 0.7 },
                            },
                          }),
                        }}
                      >
                        {step.activity.description}
                      </Typography>
                    )}

                    {step.error && (
                      <Alert severity="error" sx={{ mt: 1, py: 0.5, px: 1 }}>
                        <Typography variant="caption">{step.error}</Typography>
                      </Alert>
                    )}

                    {(step.status === 'failed' || step.status === 'skipped') && onRetryStep && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetryStep(step.id);
                        }}
                        sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}
                        startIcon={<Refresh />}
                      >
                        Retry this step
                      </Button>
                    )}

                    {/* Expandable Details */}
                    {hasDetails && (
                      <>
                        <Collapse in={isExpanded} timeout="auto">
                          {renderStepDetails(step)}
                        </Collapse>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mt: 1,
                            color: '#3b82f6',
                            fontSize: 12,
                          }}
                        >
                          {isExpanded ? (
                            <>
                              <ExpandLess sx={{ fontSize: 16 }} />
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                Hide details
                              </Typography>
                            </>
                          ) : (
                            <>
                              <ExpandMore sx={{ fontSize: 16 }} />
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                Show details
                              </Typography>
                            </>
                          )}
                        </Box>
                      </>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default ActivityStreamPanel;
