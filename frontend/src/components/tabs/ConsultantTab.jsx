import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  IconButton,
  Stack,
  Chip,
  CircularProgress,
  Avatar,
  Fade,
  Paper,
  InputAdornment,
} from '@mui/material';
import {
  Send,
  SupportAgent,
  Person,
  Storage,
  Public,
  Description,
  School,
  AutoAwesome,
  TipsAndUpdates,
} from '@mui/icons-material';
import { api } from '../../api/client';

const SUGGESTED_QUESTIONS = [
  "What permit types are configured and what are the fees?",
  "What's the typical workflow for a building permit?",
  "What documents are required for a business license?",
  "How are departments and roles organized?",
  "What are the best practices for conditional logic?",
  "How does the community currently handle code enforcement?",
];

const AGENT_ICONS = {
  configuration: { icon: Storage, color: '#3b82f6', label: 'Configuration' },
  documents: { icon: Description, color: '#10b981', label: 'Documents' },
  community: { icon: Public, color: '#f59e0b', label: 'Community' },
  best_practices: { icon: School, color: '#8b5cf6', label: 'Best Practices' },
};

export default function ConsultantTab({ project, config, projectId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAgents, setActiveAgents] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeAgents]);

  const handleSend = async (question) => {
    const q = question || input.trim();
    if (!q || loading) return;

    const userMsg = { role: 'user', content: q, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate agent activation sequence
    const agentOrder = ['configuration', 'documents', 'community', 'best_practices'];
    let agentIdx = 0;
    setActiveAgents(['configuration']);
    const agentInterval = setInterval(() => {
      agentIdx++;
      if (agentIdx < agentOrder.length) {
        setActiveAgents((prev) => [...prev, agentOrder[agentIdx]]);
      }
    }, 600);

    try {
      const response = await api.askConsultant(projectId, q, messages.map(m => ({ role: m.role, content: m.content })));
      clearInterval(agentInterval);
      setActiveAgents([]);

      const assistantMsg = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources || [],
        agents_consulted: response.agents_consulted || [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      clearInterval(agentInterval);
      setActiveAgents([]);
      const errorMsg = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while researching your question. Please try again.',
        sources: [],
        agents_consulted: [],
        timestamp: new Date(),
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', maxHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'rgba(26,86,219,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SupportAgent sx={{ fontSize: 28, color: '#1a56db' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
              AI Consultant
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Ask questions about {project?.customer_name || 'this community'}'s processes, configuration, and best practices
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Chat Area */}
      <Card
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e2e8f0',
          borderRadius: 3,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            bgcolor: '#fafbfc',
          }}
        >
          {messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  bgcolor: 'rgba(26,86,219,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <AutoAwesome sx={{ fontSize: 36, color: '#1a56db' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                How can I help?
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, maxWidth: 420, mx: 'auto' }}>
                I'll search across your uploaded data, configuration, community research, and best practices to answer your questions.
              </Typography>

              {/* Suggested Questions */}
              <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                <Stack direction="row" flexWrap="wrap" justifyContent="center" sx={{ gap: 1 }}>
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <Chip
                      key={i}
                      label={q}
                      variant="outlined"
                      size="small"
                      onClick={() => handleSend(q)}
                      icon={<TipsAndUpdates sx={{ fontSize: 16 }} />}
                      sx={{
                        borderColor: '#e2e8f0',
                        bgcolor: '#fff',
                        cursor: 'pointer',
                        maxWidth: 280,
                        height: 'auto',
                        '& .MuiChip-label': {
                          whiteSpace: 'normal',
                          py: 0.75,
                          fontSize: '0.8rem',
                        },
                        '&:hover': {
                          borderColor: '#1a56db',
                          bgcolor: 'rgba(26,86,219,0.04)',
                        },
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Box>
          ) : (
            <Stack spacing={3}>
              {messages.map((msg, idx) => (
                <Fade in key={idx} timeout={300}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      gap: 1.5,
                    }}
                  >
                    {msg.role === 'assistant' && (
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: msg.error ? '#fef2f2' : 'rgba(26,86,219,0.08)',
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <SupportAgent sx={{ fontSize: 20, color: msg.error ? '#ef4444' : '#1a56db' }} />
                      </Avatar>
                    )}
                    <Box sx={{ maxWidth: '75%' }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2.5,
                          bgcolor: msg.role === 'user' ? '#1a56db' : '#fff',
                          color: msg.role === 'user' ? '#fff' : 'text.primary',
                          border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            lineHeight: 1.7,
                            whiteSpace: 'pre-wrap',
                            '& strong': { fontWeight: 700 },
                          }}
                          dangerouslySetInnerHTML={{
                            __html: msg.content
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n/g, '<br/>')
                          }}
                        />
                      </Paper>

                      {/* Source citations */}
                      {msg.sources && msg.sources.length > 0 && (
                        <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.5, mt: 1 }}>
                          {msg.agents_consulted?.map((agent, i) => {
                            const agentConfig = AGENT_ICONS[agent] || AGENT_ICONS.configuration;
                            const AgentIcon = agentConfig.icon;
                            return (
                              <Chip
                                key={i}
                                size="small"
                                icon={<AgentIcon sx={{ fontSize: 14 }} />}
                                label={agentConfig.label}
                                sx={{
                                  height: 24,
                                  fontSize: '0.7rem',
                                  bgcolor: `${agentConfig.color}10`,
                                  color: agentConfig.color,
                                  borderColor: `${agentConfig.color}30`,
                                  border: '1px solid',
                                }}
                              />
                            );
                          })}
                        </Stack>
                      )}

                      {msg.sources && msg.sources.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                            Sources:
                          </Typography>
                          {msg.sources.map((src, i) => (
                            <Typography key={i} variant="caption" sx={{ color: 'text.secondary', display: 'block', ml: 1 }}>
                              • {src}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                    {msg.role === 'user' && (
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: '#1a56db',
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <Person sx={{ fontSize: 20, color: '#fff' }} />
                      </Avatar>
                    )}
                  </Box>
                </Fade>
              ))}

              {/* Agent Activity Indicator */}
              {loading && activeAgents.length > 0 && (
                <Fade in timeout={300}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: 'rgba(26,86,219,0.08)',
                        flexShrink: 0,
                        mt: 0.5,
                      }}
                    >
                      <SupportAgent sx={{ fontSize: 20, color: '#1a56db' }} />
                    </Avatar>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: '#fff',
                        border: '1px solid #e2e8f0',
                        minWidth: 240,
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CircularProgress size={16} />
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Researching...
                          </Typography>
                        </Stack>
                        <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.5 }}>
                          {activeAgents.map((agent, i) => {
                            const agentConfig = AGENT_ICONS[agent] || AGENT_ICONS.configuration;
                            const AgentIcon = agentConfig.icon;
                            return (
                              <Fade in key={agent} timeout={400}>
                                <Chip
                                  size="small"
                                  icon={<AgentIcon sx={{ fontSize: 14 }} />}
                                  label={agentConfig.label}
                                  sx={{
                                    height: 24,
                                    fontSize: '0.7rem',
                                    bgcolor: `${agentConfig.color}15`,
                                    color: agentConfig.color,
                                    animation: 'pulse 1.5s infinite',
                                    '@keyframes pulse': {
                                      '0%, 100%': { opacity: 1 },
                                      '50%': { opacity: 0.6 },
                                    },
                                  }}
                                />
                              </Fade>
                            );
                          })}
                        </Stack>
                      </Stack>
                    </Paper>
                  </Box>
                </Fade>
              )}

              <div ref={messagesEndRef} />
            </Stack>
          )}
        </Box>

        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            bgcolor: '#fff',
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-end">
            <TextField
              inputRef={inputRef}
              placeholder="Ask about processes, configuration, best practices..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              fullWidth
              multiline
              maxRows={4}
              variant="outlined"
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  bgcolor: '#f8fafc',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#cbd5e1' },
                  '&.Mui-focused fieldset': { borderColor: '#1a56db' },
                },
              }}
            />
            <IconButton
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              sx={{
                bgcolor: '#1a56db',
                color: '#fff',
                width: 44,
                height: 44,
                borderRadius: 2,
                '&:hover': { bgcolor: '#1e40af' },
                '&.Mui-disabled': {
                  bgcolor: '#e2e8f0',
                  color: '#94a3b8',
                },
              }}
            >
              <Send sx={{ fontSize: 20 }} />
            </IconButton>
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
            AI searches your uploaded data, configuration, community research, and OpenGov best practices
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}
