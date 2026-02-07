import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Public,
  Search,
  AttachMoney,
  AccountBalance,
  Gavel,
  Assignment,
  Description,
  Phone,
  Schedule,
  CheckCircle,
  Refresh,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { api } from '../../api/client';

const CommunityResearchTab = ({ project, projectId, showSnackbar }) => {
  const [research, setResearch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [expandedOrdinance, setExpandedOrdinance] = useState(null);
  const [expandedProcess, setExpandedProcess] = useState(null);

  // Fetch research data on mount
  useEffect(() => {
    fetchResearch();
  }, [projectId]);

  const fetchResearch = async () => {
    try {
      setLoading(true);
      const data = await api.getResearch(projectId);
      setResearch(data);
    } catch (err) {
      console.error('Error fetching research:', err);
      showSnackbar('Failed to load research data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartResearch = async () => {
    try {
      setIsStarting(true);
      await api.startResearch(projectId);
      showSnackbar('Research started. This may take a few minutes.', 'info');

      // Poll for results
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5-second intervals
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const data = await api.getResearch(projectId);
          if (data && data.community_name) {
            clearInterval(pollInterval);
            setResearch(data);
            showSnackbar('Research completed successfully!', 'success');
            setIsStarting(false);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            showSnackbar('Research timeout. Please try again.', 'warning');
            setIsStarting(false);
          }
        } catch (err) {
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            showSnackbar('Error during research polling', 'error');
            setIsStarting(false);
          }
        }
      }, 5000);
    } catch (err) {
      console.error('Error starting research:', err);
      showSnackbar('Failed to start research', 'error');
      setIsStarting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Loading research data...
          </Typography>
        </Stack>
      </Box>
    );
  }

  // Empty state - no research and no community URL
  if (!research && !project?.community_url) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            No Community URL Set
          </Typography>
          <Typography variant="body2">
            Please set a community URL in the project settings to enable community research.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Empty state - no research but has community URL
  if (!research && project?.community_url) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            No Research Data Available
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Community research has not been performed yet. Click the button below to start scraping
            data from {project.community_url}.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleStartResearch}
            disabled={isStarting}
            sx={{ mt: 1 }}
          >
            {isStarting ? 'Starting Research...' : 'Start Community Research'}
          </Button>
        </Alert>
      </Box>
    );
  }

  // Group fee schedule by permit type
  const groupedFees = {};
  if (research.fee_schedule) {
    research.fee_schedule.forEach((fee) => {
      if (!groupedFees[fee.permit_type]) {
        groupedFees[fee.permit_type] = [];
      }
      groupedFees[fee.permit_type].push(fee);
    });
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Community Research
          </Typography>
          {research?.community_name && (
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#3b82f6' }}>
              {research.community_name}
            </Typography>
          )}
          {research?.website_url && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Public sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography
                variant="body2"
                component="a"
                href={research.website_url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {research.website_url}
              </Typography>
            </Stack>
          )}
        </Stack>
        <Button
          startIcon={<Refresh />}
          onClick={handleStartResearch}
          disabled={isStarting}
          variant="outlined"
          size="small"
        >
          {isStarting ? 'Researching...' : 'Refresh Research'}
        </Button>
      </Box>

      {/* Research Summary */}
      {research?.research_summary && (
        <Alert
          severity="info"
          sx={{
            mb: 4,
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
            {research.research_summary}
          </Typography>
        </Alert>
      )}

      {/* Permits Found Section */}
      {research?.permits_found && research.permits_found.length > 0 && (
        <Card sx={{ mb: 4, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Assignment sx={{ color: '#3b82f6' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Permits Found
              </Typography>
            </Stack>
            <Grid container spacing={2}>
              {research.permits_found.map((permit, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      {permit.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                      {permit.description}
                    </Typography>
                    {permit.typical_timeline && (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Schedule sx={{ fontSize: 16, color: '#666' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {permit.typical_timeline}
                        </Typography>
                      </Stack>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Fee Schedule Section */}
      {research?.fee_schedule && research.fee_schedule.length > 0 && (
        <Card sx={{ mb: 4, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <AttachMoney sx={{ color: '#3b82f6' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Fee Schedule
              </Typography>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Permit Type</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Fee Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {research.fee_schedule.map((fee, index) => (
                    <TableRow key={index} sx={{ '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.02)' } }}>
                      <TableCell sx={{ color: 'text.primary' }}>{fee.permit_type}</TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>{fee.fee_name}</TableCell>
                      <TableCell sx={{ color: 'text.primary', fontWeight: 500 }}>{fee.amount}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {fee.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Departments Section */}
      {research?.departments && research.departments.length > 0 && (
        <Card sx={{ mb: 4, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <AccountBalance sx={{ color: '#3b82f6' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Departments
              </Typography>
            </Stack>
            <Stack spacing={2}>
              {research.departments.map((dept, index) => (
                <Paper
                  key={index}
                  sx={{
                    p: 2,
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    {dept.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                    {dept.description}
                  </Typography>
                  {dept.phone && (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Phone sx={{ fontSize: 16, color: '#666' }} />
                      <Typography
                        variant="caption"
                        component="a"
                        href={`tel:${dept.phone}`}
                        sx={{ color: '#3b82f6', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {dept.phone}
                      </Typography>
                    </Stack>
                  )}
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Ordinances Section */}
      {research?.ordinances && research.ordinances.length > 0 && (
        <Card sx={{ mb: 4, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Gavel sx={{ color: '#3b82f6' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Ordinances
              </Typography>
            </Stack>
            <Stack spacing={1}>
              {research.ordinances.map((ordinance, index) => (
                <Paper
                  key={index}
                  sx={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    onClick={() =>
                      setExpandedOrdinance(expandedOrdinance === index ? null : index)
                    }
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.02)',
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <Stack spacing={0.5} sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {ordinance.code}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {ordinance.summary}
                      </Typography>
                    </Stack>
                    {expandedOrdinance === index ? <ExpandLess /> : <ExpandMore />}
                  </Box>
                  <Collapse in={expandedOrdinance === index}>
                    <Divider />
                    <Box sx={{ p: 2, backgroundColor: 'rgba(59, 130, 246, 0.02)' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', display: 'block', mb: 1 }}>
                        Key Provisions:
                      </Typography>
                      <Stack spacing={0.5}>
                        {ordinance.key_provisions && ordinance.key_provisions.map((provision, pIndex) => (
                          <Typography key={pIndex} variant="body2" sx={{ color: 'text.secondary', ml: 2 }}>
                            • {provision}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  </Collapse>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Processes Section */}
      {research?.processes && research.processes.length > 0 && (
        <Card sx={{ mb: 4, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <Assignment sx={{ color: '#3b82f6' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Processes
              </Typography>
            </Stack>
            <Stack spacing={2}>
              {research.processes.map((process, index) => (
                <Paper
                  key={index}
                  sx={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    onClick={() =>
                      setExpandedProcess(expandedProcess === index ? null : index)
                    }
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.02)',
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {process.name}
                    </Typography>
                    {expandedProcess === index ? <ExpandLess /> : <ExpandMore />}
                  </Box>
                  <Collapse in={expandedProcess === index}>
                    <Divider />
                    <Box sx={{ p: 2, backgroundColor: 'rgba(59, 130, 246, 0.02)' }}>
                      <Stack spacing={1.5}>
                        {process.steps && process.steps.map((step, stepIndex) => (
                          <Stack key={stepIndex} direction="row" alignItems="flex-start" spacing={1.5}>
                            <Box
                              sx={{
                                minWidth: 28,
                                height: 28,
                                borderRadius: '50%',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            >
                              {stepIndex + 1}
                            </Box>
                            <Typography variant="body2" sx={{ pt: 0.5, color: 'text.primary' }}>
                              {step}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  </Collapse>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Documents Commonly Required Section */}
      {research?.documents_commonly_required && research.documents_commonly_required.length > 0 && (
        <Card sx={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Description sx={{ color: '#3b82f6' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Documents Commonly Required
              </Typography>
            </Stack>
            <List disablePadding>
              {research.documents_commonly_required.map((doc, index) => (
                <ListItem
                  key={index}
                  sx={{
                    px: 0,
                    py: 1,
                    borderBottom: index < research.documents_commonly_required.length - 1 ? '1px solid #e2e8f0' : 'none',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle sx={{ color: '#22c55e', fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={doc}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CommunityResearchTab;
