import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CloudUpload,
  FileDownload,
  CheckCircle,
  Close,
  AutoAwesome,
  Download,
} from '@mui/icons-material';
import { api } from '../../api/client';
import ActivityStreamPanel from '../ActivityStreamPanel';

const UploadTab = ({ project, projectId, onRefresh, showSnackbar }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null); // { type: 'success'|'error', message }
  const [dragOver, setDragOver] = useState(false);
  const [showActivityStream, setShowActivityStream] = useState(false);
  const [activitySteps, setActivitySteps] = useState([
    { id: 1, title: 'Parsing Uploaded Data', status: 'waiting', activity: null, error: null },
    { id: 2, title: 'Deep-Scanning Community Website', status: 'waiting', activity: null, error: null },
    { id: 3, title: 'AI Extraction & Analysis', status: 'waiting', activity: null, error: null },
    { id: 4, title: 'AI Configuration Synthesis', status: 'waiting', activity: null, error: null },
  ]);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef();
  const pollRef = useRef();
  const lastCsvData = useRef(null);
  const lastScrapeData = useRef(null);
  const lastResearchData = useRef(null);

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

  const ensureProjectExists = async () => {
    // If the backend lost the project (Vercel cold start / no KV), re-create it
    try {
      await api.getProject(projectId);
      return true; // Project exists
    } catch {
      // Project not found — re-create it from frontend state
      if (project?.name && project?.customer_name) {
        console.log('[Upload] Project not found on backend, re-creating...');
        try {
          await api.createProject({
            id: projectId,
            name: project.name,
            customer_name: project.customer_name,
            product_type: project.product_type || 'PLC',
            community_url: project.community_url || '',
          });
          return true;
        } catch (createErr) {
          console.error('[Upload] Failed to re-create project:', createErr);
          return false;
        }
      }
      return false;
    }
  };

  const updateStep = (stepId, status, activity = null, error = null) => {
    setActivitySteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, status, activity: activity || s.activity, error }
          : s
      )
    );
  };

  // Read a File object as text
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsText(file);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const useTextUpload = totalSize > 3.5 * 1024 * 1024; // 3.5MB threshold

    const doUpload = async () => {
      if (useTextUpload) {
        // Large files: read as text and send via JSON endpoint
        const fileData = [];
        for (const f of files) {
          const content = await readFileAsText(f);
          fileData.push({ filename: f.name, content });
        }
        return api.uploadFilesAsText(projectId, { files: fileData });
      } else {
        return api.uploadFiles(projectId, files);
      }
    };

    try {
      await doUpload();
      showSnackbar(`${files.length} file(s) uploaded successfully`, 'success');
      setFiles([]);
      await onRefresh();
    } catch (err) {
      // If project not found, re-create it and retry the upload
      if (err.message?.includes('not found') || err.message?.includes('404')) {
        console.log('[Upload] Project not found, ensuring it exists...');
        const exists = await ensureProjectExists();
        if (exists) {
          try {
            await doUpload();
            showSnackbar(`${files.length} file(s) uploaded successfully`, 'success');
            setFiles([]);
            await onRefresh();
            return;
          } catch (retryErr) {
            showSnackbar(retryErr.message, 'error');
          }
        } else {
          showSnackbar('Could not restore project. Please go back and re-create it.', 'error');
        }
      } else if (err.message?.includes('413') || err.message?.includes('payload') || err.message?.includes('too large')) {
        // Multipart hit Vercel limit — retry as text
        try {
          const fileData = [];
          for (const f of files) {
            const content = await readFileAsText(f);
            fileData.push({ filename: f.name, content });
          }
          await api.uploadFilesAsText(projectId, { files: fileData });
          showSnackbar(`${files.length} file(s) uploaded successfully`, 'success');
          setFiles([]);
          await onRefresh();
        } catch (retryErr) {
          showSnackbar(retryErr.message, 'error');
        }
      } else {
        showSnackbar(err.message, 'error');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysisResult(null);
    setShowActivityStream(true);
    setOverallProgress(0);

    // Reset steps
    setActivitySteps([
      { id: 1, title: 'Parsing Uploaded Data', status: 'waiting', activity: null, error: null },
      { id: 2, title: 'Deep-Scanning Community Website', status: 'waiting', activity: null, error: null },
      { id: 3, title: 'AI Extraction & Analysis', status: 'waiting', activity: null, error: null },
      { id: 4, title: 'AI Configuration Synthesis', status: 'waiting', activity: null, error: null },
    ]);

    await ensureProjectExists();

    let step2IntervalId = null;

    // Track data through the pipeline
    let csvData = null;
    let scrapeData = null;
    let researchData = null;

    try {
      // Step 1: Parse CSV
      updateStep(1, 'in_progress', {
        title: 'Parsing Uploaded Data',
        description: 'Reading and parsing uploaded CSV files...',
        details: {},
      });
      setOverallProgress(5);
      const step1Result = await api.analyzeStep1(projectId);
      csvData = step1Result.csv_data;
      lastCsvData.current = csvData;
      updateStep(1, 'completed', step1Result.activity);
      setOverallProgress(15);

      // Step 2: Multi-pass deep scraping
      let continuation = null;
      let totalPages = 0;
      let totalPdfs = 0;
      let passNumber = 1;
      const MAX_PASSES = 8; // Up to ~240 pages across 8 passes
      let step2Result;

      try {
        while (passNumber <= MAX_PASSES) {
          // Update activity with current pass info
          updateStep(2, 'in_progress', {
            title: 'Deep-Scanning Community Website',
            description: passNumber === 1
              ? 'Connecting to community website... Scanning for permits, fees, ordinances, municipal codes...'
              : `Pass ${passNumber}: Continuing deep scan... Found ${totalPages} pages and ${totalPdfs} PDFs so far...`,
            details: { pass: passNumber, pages_so_far: totalPages, pdfs_so_far: totalPdfs },
          });

          const passData = continuation ? { continuation } : {};
          step2Result = await api.analyzeStep2(projectId, passData);

          if (step2Result.status === 'step_2_skipped' || step2Result.status === 'step_2_error') {
            if (passNumber === 1) {
              // First pass failed/skipped - no data at all
              updateStep(2, step2Result.status === 'step_2_skipped' ? 'skipped' : 'failed', step2Result.activity);
              scrapeData = null;
            }
            break;
          }

          // Accumulate results
          scrapeData = step2Result.scrape_data || null;
          lastScrapeData.current = scrapeData;
          continuation = step2Result.continuation;
          totalPages = continuation?.pages?.length || step2Result.activity?.details?.pages_scraped || totalPages;
          totalPdfs = continuation?.pdfs?.length || step2Result.activity?.details?.pdfs_found || totalPdfs;

          // Update progress within step 2 (15% to 45%)
          const scrapeProgress = 15 + Math.min(30, (passNumber / MAX_PASSES) * 30);
          setOverallProgress(Math.round(scrapeProgress));

          // Check if there's more to scrape
          if (!continuation?.has_more) {
            break;
          }

          passNumber++;
        }

        if (scrapeData) {
          updateStep(2, 'completed', {
            title: 'Deep Scan Complete',
            description: `Completed ${passNumber} pass${passNumber > 1 ? 'es' : ''}: Found ${totalPages} pages and ${totalPdfs} PDFs across the community website`,
            details: scrapeData ? {
              pages_scraped: totalPages,
              pdfs_found: totalPdfs,
              passes: passNumber,
              ...(step2Result?.activity?.details || {})
            } : {},
          });
        }
      } catch (scrapeErr) {
        if (!scrapeData) {
          // Only mark as failed if we got NO data
          const errMsg = scrapeErr.message || 'Unknown error';
          console.error('[Step 2] Scrape failed:', errMsg);
          updateStep(2, 'failed', {
            title: 'Website Scrape Failed',
            description: `Error: ${errMsg}`,
            details: { error: errMsg },
          });
        } else {
          // We got some data before failing - mark as completed with what we have
          updateStep(2, 'completed', {
            title: 'Partial Scan Complete',
            description: `Scraped ${totalPages} pages before timeout. Continuing with available data.`,
            details: { pages_scraped: totalPages, pdfs_found: totalPdfs, passes: passNumber },
          });
        }
      }
      setOverallProgress(45);

      // Step 3: AI Extract Data
      updateStep(3, 'in_progress', {
        title: 'AI Extraction & Analysis',
        description: 'AI is analyzing scraped content... Identifying permits, fees, departments, workflows, and municipal code references...',
        details: {},
      });
      setOverallProgress(45);
      try {
        const step3Result = await api.analyzeStep3(projectId, { scrape_data: scrapeData });
        researchData = step3Result.research_data || null;
        lastResearchData.current = researchData;
        if (step3Result.status === 'step_3_skipped') {
          updateStep(3, 'skipped', step3Result.activity);
        } else {
          updateStep(3, 'completed', step3Result.activity);
          // Cache research data for Community Research tab
          if (researchData) {
            try {
              sessionStorage.setItem(`research_${projectId}`, JSON.stringify(researchData));
            } catch {}
          }
        }
      } catch (extractErr) {
        researchData = null;
        updateStep(3, 'skipped', {
          title: 'Extraction Skipped',
          description: 'AI extraction unavailable — continuing with available data',
          details: {},
        });
      }
      setOverallProgress(65);

      // Step 4: Generate Config
      updateStep(4, 'in_progress', {
        title: 'AI Configuration Synthesis',
        description: 'AI is synthesizing all data sources... Building record types, mapping fee structures, generating workflow recommendations...',
        details: {},
      });
      setOverallProgress(65);
      try {
        const step4Result = await api.analyzeStep4(projectId, {
          csv_data: csvData,
          research_data: researchData,
          scrape_data: scrapeData,
        });

        if (!step4Result) {
          throw new Error('No response from configuration generation');
        }

        updateStep(4, 'completed', step4Result.activity);
        setOverallProgress(95);

        // Cache intelligence data for Intelligence tab
        if (step4Result.intelligence) {
          try {
            sessionStorage.setItem(`intel_${projectId}`, JSON.stringify({ status: 'available', report: step4Result.intelligence }));
          } catch {}
        }

        setOverallProgress(100);
        setAnalysisResult({ type: 'success', message: 'Configuration generated successfully! Check the other tabs to review.' });
        setAnalyzing(false);
        try {
          await onRefresh();
        } catch {}
      } catch (genErr) {
        updateStep(4, 'failed', null, genErr.message || 'Configuration generation failed');
        setAnalysisResult({ type: 'error', message: genErr.message || 'Configuration generation failed. Please try again.' });
        setAnalyzing(false);
      }
    } catch (err) {
      clearInterval(step2IntervalId);
      // Check if backend finished despite timeout
      try {
        const statusData = await api.getAnalysisStatus(projectId);
        if (statusData.status === 'configured') {
          setOverallProgress(100);
          setAnalysisResult({ type: 'success', message: 'Configuration generated successfully!' });
          setAnalyzing(false);
          try {
            await onRefresh();
          } catch {}
          return;
        }
      } catch {}

      setAnalysisResult({ type: 'error', message: err.message || 'Analysis failed. Please try again.' });
      setAnalyzing(false);
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
  const canAnalyze = hasUploadedFiles && !analyzing;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Upload Data
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Upload historical CSV data from the customer's legacy system
          </Typography>
        </Box>
        <Button
          startIcon={<FileDownload />}
          variant="outlined"
          size="small"
          onClick={handleDownloadSample}
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
              sx={{ maxWidth: 200 }}
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

      {/* Activity Stream */}
      {showActivityStream && (
        <ActivityStreamPanel
          steps={activitySteps}
          overallProgress={overallProgress}
          onRetryStep={(stepId) => {
            setAnalyzing(true);
            const doRetry = async () => {
              try {
                if (stepId === 1) {
                  updateStep(1, 'in_progress', { title: 'Parsing Uploaded Data', description: 'Retrying CSV parse...', details: {} });
                  const result = await api.analyzeStep1(projectId);
                  lastCsvData.current = result.csv_data;
                  updateStep(1, 'completed', result.activity);
                } else if (stepId === 2) {
                  updateStep(2, 'in_progress', { title: 'Deep-Scanning Community Website', description: 'Retrying website scan...', details: {} });
                  const result = await api.analyzeStep2(projectId, {});
                  lastScrapeData.current = result.scrape_data || null;
                  updateStep(2, result.status === 'step_2_skipped' ? 'skipped' : 'completed', result.activity);
                } else if (stepId === 3) {
                  updateStep(3, 'in_progress', { title: 'AI Extraction & Analysis', description: 'Retrying AI extraction...', details: {} });
                  const result = await api.analyzeStep3(projectId, { scrape_data: lastScrapeData.current });
                  lastResearchData.current = result.research_data || null;
                  updateStep(3, result.status === 'step_3_skipped' ? 'skipped' : 'completed', result.activity);
                } else if (stepId === 4) {
                  updateStep(4, 'in_progress', { title: 'AI Configuration Synthesis', description: 'Retrying configuration generation...', details: {} });
                  const result = await api.analyzeStep4(projectId, {
                    csv_data: lastCsvData.current,
                    research_data: lastResearchData.current,
                    scrape_data: lastScrapeData.current,
                  });
                  updateStep(4, 'completed', result.activity);
                  setAnalysisResult({ type: 'success', message: 'Configuration generated successfully!' });
                  try { await onRefresh(); } catch {}
                }
              } catch (err) {
                updateStep(stepId, 'failed', null, err.message || 'Retry failed');
              } finally {
                setAnalyzing(false);
              }
            };
            doRetry();
          }}
        />
      )}

      {/* Analysis Result */}
      {analysisResult && (
        <Alert
          severity={analysisResult.type === 'success' ? 'success' : 'error'}
          icon={analysisResult.type === 'success' ? <CheckCircle /> : undefined}
          sx={{ mb: 3 }}
          onClose={() => setAnalysisResult(null)}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {analysisResult.type === 'success' ? 'Analysis Complete!' : 'Analysis Failed'}
          </Typography>
          <Typography variant="body2">
            {analysisResult.message}
          </Typography>
        </Alert>
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
