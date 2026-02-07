import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  CloudUpload,
  FileDownload,
  CheckCircle,
  Close,
  AutoAwesome,
  RadioButtonUnchecked,
  Download,
  HourglassEmpty,
} from '@mui/icons-material';
import { api } from '../../api/client';

const ANALYSIS_STAGES = [
  'Parsing CSV files...',
  'Analyzing data structure...',
  'Researching community...',
  'AI analyzing record types...',
  'Extracting workflows and fees...',
  'Building configuration...',
  'Finalizing configuration...',
  'Complete',
];

const UploadTab = ({ project, projectId, onRefresh, showSnackbar }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();
  const pollRef = useRef();

  const handleFiles = (newFiles) => {
    const csvFiles = Array.from(newFiles).filter((f) =>
      f.name.endsWith('.csv') || f.name.endsWith('.txt')
    );
    if (csvFiles.length === 0) {
      showSnackbar('Please upload CSV files', 'warning');
      return;
    }
    setFiles((prev) => [...prev, ...csvFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      await api.uploadFiles(projectId, files);
      showSnackbar(`${files.length} file(s) uploaded successfully`, 'success');
      setFiles([]);
      await onRefresh();
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setProgress(0);
    setStage('Starting...');

    // Simulate progress animation while waiting for sync response
    const stages = ANALYSIS_STAGES;
    let step = 0;
    const progressTimer = setInterval(() => {
      step++;
      const pct = Math.min(90, Math.round((step / stages.length) * 90));
      setProgress(pct);
      setStage(stages[Math.min(step - 1, stages.length - 1)]);
      if (step >= stages.length) clearInterval(progressTimer);
    }, 800);

    try {
      const result = await api.startAnalysis(projectId);
      clearInterval(progressTimer);
      setProgress(100);
      setStage('Complete');

      if (result.status === 'configured') {
        showSnackbar('Configuration generated successfully!', 'success');
      } else if (result.status === 'error') {
        showSnackbar('Analysis failed', 'error');
      }
      await onRefresh();
    } catch (err) {
      clearInterval(progressTimer);
      showSnackbar(err.message, 'error');
    } finally {
      setTimeout(() => setAnalyzing(false), 500);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const data = await api.getSampleCsv(projectId);
      const blob = new Blob([data.content], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      showSnackbar('Sample CSV downloaded', 'success');
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  };

  const hasUploadedFiles = project?.uploaded_files?.length > 0;
  const canAnalyze = hasUploadedFiles && !analyzing && project?.status !== 'configured';

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Upload Data
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Upload historical CSV data from the customer's legacy system
          </Typography>
        </Box>
        <Button
          startIcon={<FileDownload />}
          variant="outlined"
          color="primary"
          onClick={handleDownloadSample}
          sx={{ textTransform: 'none' }}
        >
          Download Sample CSV
        </Button>
      </Box>

      {/* Drag-Drop Zone */}
      <Box
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          border: '2px dashed',
          borderColor: dragOver ? '#3b82f6' : '#e2e8f0',
          backgroundColor: dragOver ? 'rgba(59, 130, 246, 0.1)' : '#f1f5f9',
          borderRadius: 2,
          p: 5,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          mb: 3,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
        <CloudUpload
          sx={{
            fontSize: 48,
            color: dragOver ? '#3b82f6' : '#6b7280',
            mb: 2,
          }}
        />
        <Typography variant="body1" sx={{ mb: 1, color: 'text.primary' }}>
          Drag and drop CSV files here, or click to browse
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Supports .csv and .txt files
        </Typography>
      </Box>

      {/* Staged Files */}
      {files.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Ready to upload ({files.length})
            </Typography>
            <Stack spacing={1} sx={{ mb: 2 }}>
              {files.map((f, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1.5,
                    backgroundColor: '#f1f5f9',
                    borderRadius: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Download sx={{ color: '#3b82f6', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {f.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      ({(f.size / 1024).toFixed(1)} KB)
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => removeFile(i)}
                    sx={{ minWidth: 'auto', color: 'text.secondary' }}
                  >
                    <Close sx={{ fontSize: 20 }} />
                  </Button>
                </Box>
              ))}
            </Stack>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={uploading}
              fullWidth
              sx={{ textTransform: 'none' }}
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Previously Uploaded Files */}
      {hasUploadedFiles && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Uploaded Files
            </Typography>
            <List disablePadding>
              {project.uploaded_files.map((f, i) => (
                <ListItem
                  key={i}
                  sx={{
                    backgroundColor: '#f1f5f9',
                    mb: 1,
                    borderRadius: 1,
                    p: 1.5,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: '#22c55e' }}>
                    <CheckCircle />
                  </ListItemIcon>
                  <ListItemText
                    primary={f.filename}
                    secondary={`${f.rows_count} rows • ${f.columns?.length || 0} columns`}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Analyze Button */}
      {canAnalyze && !analyzing && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AutoAwesome />}
            onClick={handleAnalyze}
            sx={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Analyze with AI
          </Button>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
            AI will analyze your data and generate PLC configurations
          </Typography>
        </Box>
      )}

      {/* Analysis Progress */}
      {analyzing && (
        <Card sx={{ mb: 3, borderColor: 'primary.main', borderWidth: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AutoAwesome sx={{ color: '#3b82f6' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#3b82f6' }}>
                AI Analysis in Progress
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ mb: 2, height: 8, borderRadius: 4 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {stage}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {progress}%
              </Typography>
            </Box>
            <Stack spacing={1}>
              {ANALYSIS_STAGES.map((s, i) => {
                const stageProgress = ((i + 1) * 100) / ANALYSIS_STAGES.length;
                const done = progress >= stageProgress;
                const current = !done && progress >= (i * 100) / ANALYSIS_STAGES.length;
                return (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: done ? 'success.main' : current ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    {done ? (
                      <CheckCircle sx={{ fontSize: 18 }} />
                    ) : current ? (
                      <RadioButtonUnchecked
                        sx={{
                          fontSize: 18,
                          animation: 'spin 1s linear infinite',
                          '@keyframes spin': {
                            '0%': { transform: 'rotate(0deg)' },
                            '100%': { transform: 'rotate(360deg)' },
                          },
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          border: '1px solid #e2e8f0',
                        }}
                      />
                    )}
                    <Typography variant="caption">{s}</Typography>
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Configured Success Alert */}
      {project?.status === 'configured' && (
        <Alert severity="success" icon={<CheckCircle />} sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Configuration complete! Review the Record Types, Departments, and Roles tabs.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default UploadTab;
