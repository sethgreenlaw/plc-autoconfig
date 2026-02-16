import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
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
  Source,
  OpenInNew,
  Article,
  FolderOpen,
  Language,
  Groups,
  Computer,
  PictureAsPdf,
} from '@mui/icons-material';
import { api } from '../../api/client';

const CommunityResearchTab = ({ project, projectId, showSnackbar }) => {
  const [research, setResearch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState(null);
  const [expandedOrdinance, setExpandedOrdinance] = useState(null);
  const [expandedProcess, setExpandedProcess] = useState(null);
  const [expandedSourceCategory, setExpandedSourceCategory] = useState(null);

  // Fetch research data and scrape status on mount
  useEffect(() => {
    fetchResearch();
    fetchScrapeStatus();
  }, [projectId]);

  const fetchResearch = async () => {
    try {
      setLoading(true);
      const data = await api.getResearch(projectId);
      // Backend returns {"status": "no_research"} when no data exists — treat as null
      if (data && data.status === 'no_research') {
        // Try sessionStorage fallback (Vercel may have lost data across instances)
        try {
          const cached = sessionStorage.getItem(`research_${projectId}`);
          if (cached) {
            setResearch(JSON.parse(cached));
            setLoading(false);
            return;
          }
        } catch {}
        setResearch(null);
      } else {
        setResearch(data);
        // Cache for cross-instance resilience
        if (data) {
          try { sessionStorage.setItem(`research_${projectId}`, JSON.stringify(data)); } catch {}
        }
      }
    } catch (err) {
      console.error('Error fetching research:', err);
      // Try sessionStorage fallback
      try {
        const cached = sessionStorage.getItem(`research_${projectId}`);
        if (cached) { setResearch(JSON.parse(cached)); return; }
      } catch {}
      setResearch(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchScrapeStatus = async () => {
    try {
      const data = await api.getScrapeStatus(projectId);
      setScrapeStatus(data);
    } catch (err) {
      console.error('Error fetching scrape status:', err);
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
          if (data && data.community_name && data.status !== 'no_research') {
            clearInterval(pollInterval);
            setResearch(data);
            try { sessionStorage.setItem(`research_${projectId}`, JSON.stringify(data)); } catch {}
            fetchScrapeStatus();
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
      <Box>
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
      <Box>
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
            {isStarting ? 'Scraping Website...' : 'Scrape Community Website'}
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
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack spacing={0.5} sx={{ mb: 2 }}>
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
          {isStarting ? 'Researching...' : 'Re-scrape Website'}
        </Button>
      </Box>

      {/* Scrape Status Indicator */}
      {scrapeStatus?.scraped && (
        <Card sx={{ mb: 3, backgroundColor: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <CardContent sx={{ py: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <CheckCircle sx={{ color: '#10b981', fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#10b981' }}>
                Website Successfully Scraped
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip
                size="small"
                label={`${scrapeStatus.pages_scraped} pages scraped`}
                sx={{ bgcolor: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', fontWeight: 500 }}
              />
              <Chip
                size="small"
                label={`${scrapeStatus.pdfs_found} PDFs found`}
                sx={{ bgcolor: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6', fontWeight: 500 }}
              />
              <Chip
                size="small"
                label={`${scrapeStatus.urls_visited} URLs visited`}
                sx={{ bgcolor: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', fontWeight: 500 }}
              />
              {scrapeStatus.scraped_at && (
                <Chip
                  size="small"
                  label={`Last scraped: ${new Date(scrapeStatus.scraped_at).toLocaleDateString()}`}
                  sx={{ bgcolor: 'rgba(100, 116, 139, 0.08)', color: '#64748b', fontWeight: 500 }}
                />
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* PDF Documents Found */}
      {scrapeStatus?.pdfs?.length > 0 && (
        <Card sx={{ mb: 3, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <PictureAsPdf sx={{ color: '#ef4444' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                PDF Documents Found
              </Typography>
              <Chip label={scrapeStatus.pdfs.length} size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', fontWeight: 600 }} />
            </Stack>
            <List disablePadding>
              {scrapeStatus.pdfs.map((pdf, index) => (
                <ListItem
                  key={index}
                  sx={{
                    px: 0,
                    py: 0.75,
                    borderBottom: index < scrapeStatus.pdfs.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <PictureAsPdf sx={{ color: '#ef4444', fontSize: 18 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        component="a"
                        href={pdf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: '#3b82f6',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        {pdf.filename || 'Document'}
                        <OpenInNew sx={{ fontSize: 12 }} />
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

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
        <Card sx={{ mb: 4, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
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

      {/* Sources Reviewed Section */}
      {research?.sources_reviewed && research.sources_reviewed.length > 0 && (
        <Card sx={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Source sx={{ color: '#3b82f6' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Sources Reviewed
              </Typography>
            </Stack>
            {research.research_depth && (
              <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  size="small"
                  label={`${research.research_depth.pages_analyzed} pages analyzed`}
                  sx={{ bgcolor: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', fontWeight: 500 }}
                />
                <Chip
                  size="small"
                  label={`${research.research_depth.documents_reviewed} documents reviewed`}
                  sx={{ bgcolor: 'rgba(16, 185, 129, 0.08)', color: '#10b981', fontWeight: 500 }}
                />
                <Chip
                  size="small"
                  label={`${research.research_depth.forms_cataloged} forms cataloged`}
                  sx={{ bgcolor: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', fontWeight: 500 }}
                />
                <Chip
                  size="small"
                  label={`${research.research_depth.fee_tables_extracted} fee tables extracted`}
                  sx={{ bgcolor: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6', fontWeight: 500 }}
                />
              </Stack>
            )}
            <Stack spacing={1}>
              {research.sources_reviewed.map((category, catIndex) => {
                const categoryIcons = {
                  'Municipal Code & Ordinances': Gavel,
                  'Permit Applications & Forms': PictureAsPdf,
                  'Fee Schedules & Rate Tables': AttachMoney,
                  'Department Pages & Staff Directories': AccountBalance,
                  'Plans, Policies & Studies': Article,
                  'Public Meeting Records': Groups,
                  'Online Services & Portals': Computer,
                };
                const CategoryIcon = categoryIcons[category.category] || FolderOpen;
                const isExpanded = expandedSourceCategory === catIndex;

                return (
                  <Paper
                    key={catIndex}
                    sx={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      onClick={() =>
                        setExpandedSourceCategory(isExpanded ? null : catIndex)
                      }
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.02)' },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
                        <CategoryIcon sx={{ color: '#64748b', fontSize: 20 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {category.category}
                        </Typography>
                        <Chip
                          label={`${category.sources.length} sources`}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            bgcolor: 'rgba(100, 116, 139, 0.08)',
                            color: '#64748b',
                          }}
                        />
                      </Stack>
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </Box>
                    <Collapse in={isExpanded}>
                      <Divider />
                      <Box sx={{ p: 0 }}>
                        {category.sources.map((source, srcIndex) => (
                          <Box
                            key={srcIndex}
                            sx={{
                              px: 2.5,
                              py: 1.5,
                              borderBottom:
                                srcIndex < category.sources.length - 1
                                  ? '1px solid #f1f5f9'
                                  : 'none',
                              '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.02)' },
                              transition: 'background-color 0.15s ease',
                            }}
                          >
                            <Stack
                              direction="row"
                              alignItems="flex-start"
                              justifyContent="space-between"
                              spacing={1}
                            >
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="body2"
                                  component="a"
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{
                                    color: '#3b82f6',
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    '&:hover': { textDecoration: 'underline' },
                                  }}
                                >
                                  {source.title}
                                  <OpenInNew sx={{ fontSize: 14 }} />
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'text.secondary',
                                    display: 'block',
                                    mt: 0.5,
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {source.description}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>
                        ))}
                      </Box>
                    </Collapse>
                  </Paper>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CommunityResearchTab;
