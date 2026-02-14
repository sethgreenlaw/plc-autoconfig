import { useState } from 'react';
import { Box, Typography, Avatar, Paper, Grid, Tooltip } from '@mui/material';
import { AI_AGENT_PERSONAS } from '../constants/agents';
import AgentDetailDialog from './AgentDetailDialog';

export default function AITeamSection({ agentStats, projectId, onDeepScrapeComplete }) {
  const [selectedAgent, setSelectedAgent] = useState(null);

  return (
    <>
      <Paper sx={{ p: 3, mb: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ fontSize: 20 }}>{'\u{1F465}'}</span>
          Your AI Specialist Team
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Meet the AI agents analyzing and configuring your permit system. Click any agent for details.
        </Typography>

        <Grid container spacing={2}>
          {AI_AGENT_PERSONAS.map((agent) => {
            const stats = (agentStats && agentStats[agent.statsKey]) || {};
            const primaryStat = agent.statFields[0];
            const primaryValue = stats[primaryStat?.key] || 0;
            const isActive = Object.values(stats).some(v => v > 0);

            return (
              <Grid item xs={6} sm={4} md={2.4} key={agent.id}>
                <Tooltip title={`${agent.name} - ${agent.title}`} arrow>
                  <Paper
                    onClick={() => setSelectedAgent(agent)}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      bgcolor: isActive ? agent.bgColor : '#f9fafb',
                      border: `2px solid ${isActive ? agent.color : '#e5e7eb'}`,
                      borderRadius: 3,
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: `0 4px 20px ${agent.color}30`,
                        transform: 'translateY(-3px)',
                      },
                      opacity: isActive ? 1 : 0.7,
                    }}
                  >
                    <Avatar
                      src={agent.avatar}
                      sx={{
                        width: 56, height: 56, mx: 'auto', mb: 1,
                        border: `3px solid ${agent.color}`,
                        boxShadow: `0 2px 10px ${agent.color}30`,
                      }}
                    >
                      {agent.emoji}
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: agent.color, fontSize: '0.8rem', lineHeight: 1.2, mb: 0.5 }}>
                      {agent.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', mb: 1 }}>
                      {agent.title}
                    </Typography>
                    {isActive && primaryStat && (
                      <Box sx={{ bgcolor: '#fff', borderRadius: 1, p: 0.5, border: `1px solid ${agent.borderColor}` }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: agent.color, fontSize: '0.75rem' }}>
                          {primaryStat.format === 'currency' ? `$${Number(primaryValue).toLocaleString()}` : primaryValue}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem' }}>
                          {primaryStat.label}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      <AgentDetailDialog
        open={!!selectedAgent}
        agent={selectedAgent}
        agentStats={agentStats}
        projectId={projectId}
        onDeepScrapeComplete={onDeepScrapeComplete}
        onClose={() => setSelectedAgent(null)}
      />
    </>
  );
}
