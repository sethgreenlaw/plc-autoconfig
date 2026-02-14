import React from 'react';
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
} from '@mui/material';
import {
  FileUpload,
  DataObject,
  Business,
  Shield,
} from '@mui/icons-material';

const OverviewTab = ({ project, config }) => {
  const getStatusAlert = () => {
    if (!project || !config) return null;

    const status = project.status || 'unknown';
    const alertConfig = {
      configured: {
        severity: 'success',
        title: 'Project Configured',
        message: 'This project has been successfully configured and is ready for use.',
      },
      analyzing: {
        severity: 'info',
        title: 'Analysis in Progress',
        message: 'Configuration analysis is currently running.',
      },
      error: {
        severity: 'error',
        title: 'Configuration Error',
        message: 'An error occurred during configuration. Please review and try again.',
      },
    };

    const alert = alertConfig[status] || { severity: 'info', title: 'Configuration Pending', message: 'No configuration data available yet.' };

    return (
      <Alert severity={alert.severity} sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          {alert.title}
        </Typography>
        <Typography variant="body2">{alert.message}</Typography>
      </Alert>
    );
  };

  const stats = [
    {
      label: 'Files Uploaded',
      value: project?.uploaded_files?.length || 0,
      icon: FileUpload,
      bgColor: 'rgba(251, 191, 36, 0.1)',
      iconColor: '#fbbf24',
    },
    {
      label: 'Record Types',
      value: config?.record_types?.length || 0,
      icon: DataObject,
      bgColor: 'rgba(59, 130, 246, 0.1)',
      iconColor: '#3b82f6',
    },
    {
      label: 'Departments',
      value: config?.departments?.length || 0,
      icon: Business,
      bgColor: 'rgba(139, 92, 246, 0.1)',
      iconColor: '#a855f7',
    },
    {
      label: 'User Roles',
      value: config?.user_roles?.length || 0,
      icon: Shield,
      bgColor: 'rgba(34, 197, 94, 0.1)',
      iconColor: '#22c55e',
    },
  ];

  return (
    <Box>
      {/* Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          {project?.name || 'Project Overview'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {project?.customer_name && project?.product_type
            ? `${project.customer_name} • ${project.product_type}`
            : 'No customer or product type specified'}
        </Typography>
      </Box>

      {/* Status Alert */}
      {getStatusAlert()}

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  backgroundColor: stat.bgColor,
                  border: 'none',
                  height: '100%',
                }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Icon sx={{ color: stat.iconColor, fontSize: 28 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {stat.value}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Summary Section */}
      {config?.summary && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Configuration Summary
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
              {config.summary}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files Section */}
      {project?.uploaded_files && project.uploaded_files.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Uploaded Files
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'text.secondary' }}>Filename</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }} align="right">
                      Rows
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }} align="right">
                      Columns
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }} align="right">
                      Size
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {project.uploaded_files.map((file, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ color: 'text.primary' }}>{file.filename}</TableCell>
                      <TableCell sx={{ color: 'text.primary' }} align="right">
                        {file.rows_count || '-'}
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }} align="right">
                        {file.columns?.length || '-'}
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }} align="right">
                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default OverviewTab;
