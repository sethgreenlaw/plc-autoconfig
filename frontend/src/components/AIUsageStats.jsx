import { Box, Typography, Paper, Grid, LinearProgress, Tooltip } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

export default function AIUsageStats({ usageStats, project }) {
  // Compute data points from project config as fallback
  const cfg = project?.configuration || {};
  const dataPoints = (cfg.record_types?.length || 0) +
    (cfg.departments?.length || 0) +
    (cfg.user_roles?.length || 0) +
    cfg.record_types?.reduce((sum, rt) => sum + (rt.form_fields?.length || 0) + (rt.fees?.length || 0) + (rt.workflow_steps?.length || 0) + (rt.required_documents?.length || 0), 0) || 0;

  const totalCalls = usageStats?.total_calls || (project?.status === 'configured' ? 1 : 0);
  const totalTokens = usageStats?.total_tokens || 0;
  const successRate = usageStats?.success_rate || (totalCalls > 0 ? 100 : 0);
  const sourcesProcessed = project?.uploaded_files?.length || 0;

  return (
    <Paper sx={{ p: 3, mb: 4, border: '1px solid #e2e8f0' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <span style={{ fontSize: 18 }}>{'\u{26A1}'}</span>
        AI Engine Performance
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, bgcolor: '#f0f9ff', border: '1px solid #bfdbfe', textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#3b82f6' }}>{totalCalls}</Typography>
            <Typography variant="caption" color="text.secondary">AI Calls Made</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, bgcolor: '#fffbeb', border: '1px solid #fcd34d', textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#f59e0b' }}>
              {totalTokens > 0 ? `${(totalTokens / 1000).toFixed(1)}k` : dataPoints}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalTokens > 0 ? 'Tokens Used' : 'Data Points'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, bgcolor: '#ecfdf5', border: '1px solid #a7f3d0', textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#16a34a' }}>{sourcesProcessed}</Typography>
            <Typography variant="caption" color="text.secondary">Files Processed</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, bgcolor: '#f3f4f6', border: '1px solid #d1d5db', textAlign: 'center', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <CheckCircle sx={{ fontSize: 18, color: successRate >= 90 ? '#16a34a' : '#f59e0b' }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: successRate >= 90 ? '#16a34a' : '#f59e0b' }}>
                {Math.round(successRate)}%
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">Success Rate</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Reliability Bar */}
      <Box sx={{ mt: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>AI Reliability</Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color: successRate >= 90 ? '#16a34a' : '#f59e0b' }}>
            {Math.round(successRate)}%
          </Typography>
        </Box>
        <Tooltip title={`${usageStats?.success_count || totalCalls} successful out of ${totalCalls} total calls`}>
          <LinearProgress
            variant="determinate"
            value={successRate}
            sx={{
              height: 6, borderRadius: 3, bgcolor: '#e5e7eb',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                bgcolor: successRate >= 90 ? '#16a34a' : successRate >= 75 ? '#f59e0b' : '#dc2626',
              },
            }}
          />
        </Tooltip>
      </Box>
    </Paper>
  );
}
