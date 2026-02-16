import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Chip, Alert,
  Accordion, AccordionSummary, AccordionDetails,
  CircularProgress, Grid,
} from '@mui/material';
import {
  ExpandMore, Warning, Error as ErrorIcon, Info, Refresh, AutoFixHigh,
  CheckCircle, TipsAndUpdates, Lightbulb, Storage, SchemaOutlined,
  AttachMoney, Psychology,
} from '@mui/icons-material';
import { api } from '../../api/client';
import AITeamSection from '../AITeamSection';
import AIUsageStats from '../AIUsageStats';

const SEVERITY_CONFIG = {
  critical: { color: '#dc2626', bg: '#fef2f2', icon: <ErrorIcon fontSize="small" />, label: 'Critical' },
  warning: { color: '#d97706', bg: '#fffbeb', icon: <Warning fontSize="small" />, label: 'Warning' },
  info: { color: '#2563eb', bg: '#eff6ff', icon: <Info fontSize="small" />, label: 'Info' },
  success: { color: '#16a34a', bg: '#f0fdf4', icon: <CheckCircle fontSize="small" />, label: 'Good' },
};

export default function DataSourcesTab({ project, onProjectUpdate }) {
  const [intelligenceData, setIntelligenceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [validationFindings, setValidationFindings] = useState([]);
  const [additionalContext, setAdditionalContext] = useState('');
  const [reAnalyzeExpanded, setReAnalyzeExpanded] = useState(false);

  const projectId = project?.id;

  const loadIntelligence = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await api.getIntelligence(projectId);

      // If backend lost the data (no KV), fall back to sessionStorage cache
      if (!data || data.status === 'not_available') {
        try {
          const cached = sessionStorage.getItem(`intel_${projectId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed?.status === 'available') {
              setIntelligenceData(parsed);
              setLoading(false);
              return;
            }
          }
        } catch {}
      }

      // Cache successful backend responses for future use
      if (data?.status === 'available') {
        try { sessionStorage.setItem(`intel_${projectId}`, JSON.stringify(data)); } catch {}
      }

      setIntelligenceData(data);
    } catch (e) {
      console.error('Failed to load intelligence:', e);
      // Try sessionStorage fallback on network error too
      try {
        const cached = sessionStorage.getItem(`intel_${projectId}`);
        if (cached) {
          setIntelligenceData(JSON.parse(cached));
          return;
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadIntelligence();
  }, [loadIntelligence]);

  const loadValidation = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await api.validateConfig(projectId);
      setValidationFindings(data.findings || []);
    } catch (e) {
      console.error('Failed to load validation:', e);
    }
  }, [projectId]);

  useEffect(() => {
    loadValidation();
  }, [loadValidation]);

  const handleReAnalyze = async () => {
    if (!additionalContext.trim()) return;
    setActionLoading('reanalyze');
    try {
      const result = await api.reAnalyze(projectId, additionalContext);
      setIntelligenceData(result);
      setAdditionalContext('');
      setReAnalyzeExpanded(false);
    } catch (e) {
      console.error('Re-analysis failed:', e);
    } finally {
      setActionLoading('');
    }
  };

  const autoFix = async (findingId) => {
    setActionLoading(findingId);
    try {
      await api.autoFixFinding(projectId, findingId);
      setValidationFindings(validationFindings.filter(f => f.id !== findingId));
      loadValidation();
      if (onProjectUpdate) onProjectUpdate();
    } catch (e) {
      console.error('Auto-fix failed:', e);
    } finally {
      setActionLoading('');
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return '#16a34a';
    if (score >= 60) return '#d97706';
    return '#dc2626';
  };

  const getHealthGradient = (score) => {
    const color = getHealthColor(score);
    if (score >= 80) return 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)';
    if (score >= 60) return 'linear-gradient(135deg, #fffbeb 0%, #fefce8 100%)';
    return 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!intelligenceData || intelligenceData.status === 'not_available') {
    return (
      <Box>
        <Alert severity="info">
          {intelligenceData?.message || 'No intelligence data available. Please complete an analysis first.'}
        </Alert>
      </Box>
    );
  }

  const report = intelligenceData.report || {};
  const completenessScore = report.completeness_score || 0;

  // Pull config stats directly from the project's configuration (live data)
  const cfg = project?.configuration || {};
  const recordTypesCount = cfg.record_types?.length || 0;
  const departmentsCount = cfg.departments?.length || 0;
  const userRolesCount = cfg.user_roles?.length || 0;
  const totalFees = cfg.record_types?.reduce((sum, rt) => sum + (rt.fees?.length || 0), 0) || 0;

  return (
    <Box>
      {/* HEADER */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Intelligence Hub
        </Typography>
        <Typography variant="body2" color="text.secondary">
          AI-powered analysis of your permit processes and configuration
        </Typography>
      </Box>

      {/* AI MODE WARNING */}
      {report.ai_mode === 'mock' && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            Running in Demo Mode — Mock Data Shown
          </Typography>
          <Typography variant="body2">
            {report.ai_error || 'The AI engine is not connected.'}
            {' '}To enable real AI analysis, ensure the <strong>ANTHROPIC_API_KEY</strong> environment variable is configured in your Vercel project settings, then re-run the analysis.
          </Typography>
        </Alert>
      )}

      {/* COMPLETENESS SCORE SECTION */}
      <Paper sx={{ p: 3, mb: 4, background: getHealthGradient(completenessScore), border: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
            <CircularProgress
              variant="determinate"
              value={completenessScore}
              size={120}
              thickness={4}
              sx={{
                color: getHealthColor(completenessScore),
                position: 'absolute',
              }}
            />
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: getHealthColor(completenessScore) }}>
                {completenessScore}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Configuration Completeness
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {report.analysis_summary || 'AI analysis shows your configuration readiness score based on all data sources analyzed.'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => loadIntelligence()}
                disabled={actionLoading === 'refresh'}
              >
                Refresh
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* AI USAGE STATS */}
      <AIUsageStats usageStats={report.ai_usage_stats} project={project} />

      {/* YOUR AI TEAM */}
      <AITeamSection
        agentStats={report.agent_stats}
        projectId={projectId}
        onDeepScrapeComplete={() => loadIntelligence()}
      />

      {/* SOURCES USED SECTION */}
      <Paper sx={{ p: 3, mb: 4, border: '1px solid #e2e8f0' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Storage sx={{ fontSize: 20 }} />
          Sources Analyzed
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          The following data sources were automatically gathered and analyzed
        </Typography>
        <Grid container spacing={2}>
          {report.sources_used && report.sources_used.length > 0 ? (
            report.sources_used.map((source, idx) => (
              <Grid item xs={12} sm={6} key={idx}>
                <Paper sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {source.type === 'csv_data' && <Storage sx={{ fontSize: 18, color: '#3b82f6' }} />}
                    {source.type === 'community_research' && <Lightbulb sx={{ fontSize: 18, color: '#f59e0b' }} />}
                    {source.type === 'peer_template' && <Psychology sx={{ fontSize: 18, color: '#8b5cf6' }} />}
                    {source.type === 'ai_best_practices' && <Lightbulb sx={{ fontSize: 18, color: '#10b981' }} />}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                      {source.name || source.type}
                    </Typography>
                    <Chip
                      label="Analyzed"
                      size="small"
                      color="success"
                      variant="filled"
                      icon={<CheckCircle />}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {source.description || 'Data source analyzed and integrated'}
                  </Typography>
                  {source.data_points && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {source.data_points} data points extracted
                    </Typography>
                  )}
                </Paper>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                No sources analyzed yet
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* AUTO-ENHANCEMENTS SECTION */}
      <Paper sx={{ p: 3, mb: 4, border: '1px solid #e2e8f0' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lightbulb sx={{ fontSize: 20, color: '#f59e0b' }} />
          Auto-Enhancements Applied
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          AI-generated enhancements beyond the raw CSV data
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {report.auto_enhancements && report.auto_enhancements.length > 0 ? (
            report.auto_enhancements.map((enhancement, idx) => (
              <Box key={idx} sx={{ p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <CheckCircle sx={{ fontSize: 18, color: '#16a34a', mt: 0.25, flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {enhancement.title || enhancement.type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {enhancement.description || 'AI-generated enhancement'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No auto-enhancements available
            </Typography>
          )}
        </Box>
      </Paper>

      {/* CONFIGURATION OVERVIEW */}
      <Paper sx={{ p: 3, mb: 4, border: '1px solid #e2e8f0' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchemaOutlined sx={{ fontSize: 20 }} />
          Configuration Quick Stats
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: '#f0f9ff', border: '1px solid #bfdbfe', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                {recordTypesCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Record Types
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: '#fdf2f8', border: '1px solid #fbcfe8', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#ec4899' }}>
                {departmentsCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Departments
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: '#f3f4f6', border: '1px solid #d1d5db', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#6b7280' }}>
                {userRolesCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                User Roles
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: '#ecfdf5', border: '1px solid #a7f3d0', textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#16a34a' }}>
                {totalFees}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Fees
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* RE-ANALYZE SECTION */}
      <Accordion
        expanded={reAnalyzeExpanded}
        onChange={() => setReAnalyzeExpanded(!reAnalyzeExpanded)}
        sx={{ mb: 4, border: '1px solid #e2e8f0' }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Lightbulb sx={{ mr: 1.5, color: '#f59e0b' }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Re-Analyze with More Context
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Provide additional municipal code, fee schedules, or other data to refine the analysis
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Alert severity="info" sx={{ mb: 2 }}>
            Paste additional municipal code sections, updated fee schedules, ordinance changes, or any other relevant documentation to improve the analysis.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={6}
            size="small"
            placeholder="Paste additional context here..."
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleReAnalyze}
            disabled={!additionalContext.trim() || actionLoading === 'reanalyze'}
            startIcon={actionLoading === 'reanalyze' ? <CircularProgress size={16} /> : <Refresh />}
          >
            {actionLoading === 'reanalyze' ? 'Re-Analyzing...' : 'Re-Analyze'}
          </Button>
        </AccordionDetails>
      </Accordion>

      {/* VALIDATION SECTION */}
      <Paper sx={{ p: 3, border: '1px solid #e2e8f0' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle sx={{ fontSize: 20, color: '#16a34a' }} />
          Configuration Health & Validation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Results from automated configuration validation
        </Typography>

        {validationFindings && validationFindings.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {validationFindings.map((finding) => {
              const sev = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.info;
              return (
                <Paper
                  key={finding.id}
                  sx={{
                    p: 2,
                    borderLeft: `4px solid ${sev.color}`,
                    bgcolor: sev.bg,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ color: sev.color, mt: 0.25 }}>{sev.icon}</Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {finding.title}
                        </Typography>
                        <Chip label={finding.category} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {finding.description}
                      </Typography>
                      {finding.recommendation && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                          <TipsAndUpdates sx={{ fontSize: 16, color: '#d97706', mt: 0.25, flexShrink: 0 }} />
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#92400e' }}>
                            {finding.recommendation}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    {finding.auto_fixable && finding.severity !== 'success' && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={actionLoading === finding.id ? <CircularProgress size={14} /> : <AutoFixHigh />}
                        onClick={() => autoFix(finding.id)}
                        disabled={actionLoading === finding.id}
                        sx={{
                          minWidth: 100,
                          borderColor: sev.color,
                          color: sev.color,
                          flexShrink: 0,
                        }}
                      >
                        {actionLoading === finding.id ? 'Fixing...' : 'Auto-Fix'}
                      </Button>
                    )}
                  </Box>
                </Paper>
              );
            })}
          </Box>
        ) : (
          <Paper sx={{ p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ color: '#16a34a' }} />
              <Typography variant="body2" color="text.secondary">
                No validation issues found. Your configuration is in good health.
              </Typography>
            </Box>
          </Paper>
        )}
      </Paper>
    </Box>
  );
}
