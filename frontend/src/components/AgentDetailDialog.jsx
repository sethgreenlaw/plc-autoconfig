import { useState } from 'react';
import {
  Dialog, DialogContent, DialogTitle, Box, Typography, Avatar,
  Chip, Paper, Grid, IconButton, Button, LinearProgress, Alert, Divider,
} from '@mui/material';
import { Close, TravelExplore, CheckCircle, Description } from '@mui/icons-material';
import { api } from '../api/client';

export default function AgentDetailDialog({ open, agent, agentStats, projectId, onDeepScrapeComplete, onClose }) {
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [scrapeError, setScrapeError] = useState('');

  if (!agent) return null;

  const stats = (agentStats && agentStats[agent.statsKey]) || {};

  const handleDeepScrape = async () => {
    if (!projectId) return;
    setScraping(true);
    setScrapeError('');
    setScrapeResult(null);
    try {
      const result = await api.deepScrape(projectId, agent.id);
      setScrapeResult(result);
      if (onDeepScrapeComplete) onDeepScrapeComplete(result);
    } catch (err) {
      setScrapeError(err.message || 'Deep analysis failed. Please try again.');
    } finally {
      setScraping(false);
    }
  };

  const handleClose = () => {
    setScrapeResult(null);
    setScrapeError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={agent.avatar}
            sx={{
              width: 64, height: 64,
              border: `3px solid ${agent.color}`,
              boxShadow: `0 4px 14px ${agent.color}30`,
            }}
          >
            {agent.emoji}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{agent.name}</Typography>
            <Typography variant="caption" color="text.secondary">{agent.title}</Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small"><Close /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Status */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#16a34a' }} />
          <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>Active</Typography>
          <Chip label={agent.domain} size="small" sx={{ ml: 1, bgcolor: agent.bgColor, color: agent.color, fontWeight: 600, fontSize: '0.7rem' }} />
        </Box>

        {/* Description */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>About</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{agent.description}</Typography>
        </Box>

        {/* Expertise */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Key Competencies</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {agent.expertise.map((exp, i) => (
              <Chip key={i} label={exp} size="small" variant="outlined"
                sx={{ borderColor: agent.color, color: agent.color, bgcolor: `${agent.color}08` }} />
            ))}
          </Box>
        </Box>

        {/* Stats */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Activity Summary</Typography>
          <Grid container spacing={1.5}>
            {agent.statFields.map((field, i) => {
              let value = stats[field.key] || 0;
              let display = field.format === 'currency' ? `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : typeof value === 'number' ? Math.round(value * 10) / 10 : value;
              return (
                <Grid item xs={6} key={i}>
                  <Paper sx={{ p: 2, bgcolor: agent.bgColor, border: `1px solid ${agent.borderColor}`, textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: agent.color }}>{display}</Typography>
                    <Typography variant="caption" color="text.secondary">{field.label}</Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Deep Analysis Section */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Deep Website Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
            Run a comprehensive scrape of the community website. {agent.name} will crawl every accessible page,
            review PDFs, and extract {agent.domain.toLowerCase()}-related data to refine the configuration.
          </Typography>

          {!scraping && !scrapeResult && (
            <Button
              variant="contained"
              fullWidth
              startIcon={<TravelExplore />}
              onClick={handleDeepScrape}
              disabled={!projectId}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                py: 1.5,
                borderRadius: 2,
                bgcolor: agent.color,
                '&:hover': { bgcolor: agent.color, filter: 'brightness(0.9)' },
              }}
            >
              Run Deep Analysis
            </Button>
          )}

          {/* Scraping in progress */}
          {scraping && (
            <Paper sx={{ p: 3, bgcolor: agent.bgColor, border: `1px solid ${agent.borderColor}`, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  src={agent.avatar}
                  sx={{ width: 36, height: 36, border: `2px solid ${agent.color}` }}
                >
                  {agent.emoji}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: agent.color }}>
                    {agent.name} is analyzing...
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Crawling pages, reviewing PDFs, extracting {agent.domain.toLowerCase()} data
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                sx={{
                  borderRadius: 1,
                  height: 6,
                  bgcolor: `${agent.color}20`,
                  '& .MuiLinearProgress-bar': { bgcolor: agent.color },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                This may take 30-60 seconds depending on the website size
              </Typography>
            </Paper>
          )}

          {/* Scrape Error */}
          {scrapeError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {scrapeError}
              <Button size="small" onClick={handleDeepScrape} sx={{ ml: 1, textTransform: 'none' }}>
                Retry
              </Button>
            </Alert>
          )}

          {/* Scrape Results */}
          {scrapeResult && (
            <Paper sx={{ p: 3, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CheckCircle sx={{ color: '#16a34a' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#16a34a' }}>
                  Deep Analysis Complete
                </Typography>
              </Box>

              {scrapeResult.deep_scrape_stats && (
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fff', border: '1px solid #d1fae5', borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#16a34a' }}>
                        {scrapeResult.deep_scrape_stats.pages_scraped || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Pages Crawled</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fff', border: '1px solid #d1fae5', borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#16a34a' }}>
                        {scrapeResult.deep_scrape_stats.pdfs_found || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">PDFs Found</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fff', border: '1px solid #d1fae5', borderRadius: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#16a34a' }}>
                        {scrapeResult.deep_scrape_stats.data_points || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Data Points</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {scrapeResult.summary && (
                <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 1, border: '1px solid #d1fae5' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5, color: '#15803d' }}>
                    Analysis Summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {scrapeResult.summary}
                  </Typography>
                </Box>
              )}

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                Configuration has been updated with the new data. Refresh the Intelligence Hub to see changes.
              </Typography>
            </Paper>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
