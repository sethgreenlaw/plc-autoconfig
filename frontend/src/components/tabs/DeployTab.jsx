import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
} from '@mui/material';
import {
  Rocket,
  Lock,
  DataObject,
  Business,
  Shield,
} from '@mui/icons-material';
import { api } from '../../api/client';

const DeployTab = ({ config, projectId, showSnackbar }) => {
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState(null);

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const res = await api.deploy(projectId);
      setResult(res);
      if (res.success) {
        showSnackbar('Deployed successfully!', 'success');
      } else {
        showSnackbar(res.message, 'warning');
      }
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setDeploying(false);
    }
  };

  const statCards = [
    {
      label: 'Record Types',
      value: config?.record_types?.length || 0,
      icon: DataObject,
      color: '#3b82f6',
    },
    {
      label: 'Departments',
      value: config?.departments?.length || 0,
      icon: Business,
      color: '#a855f7',
    },
    {
      label: 'User Roles',
      value: config?.user_roles?.length || 0,
      icon: Shield,
      color: '#22c55e',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Deploy to PLC
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Push generated configurations to the PLC system via API
        </Typography>
      </Box>

      {/* Main Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {/* Warning Alert */}
          <Alert
            severity="warning"
            icon={<Lock />}
            sx={{ mb: 3 }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              API Integration Pending
            </Typography>
            <Typography variant="body2">
              PLC API integration is not yet configured. Once connected, this will push all configurations directly to the customer's PLC environment, creating record types, departments, user roles, forms, workflows, and fee schedules automatically.
            </Typography>
          </Alert>

          {/* Stats Grid */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box
                    sx={{
                      backgroundColor: '#f1f5f9',
                      p: 2,
                      borderRadius: 1,
                      textAlign: 'center',
                    }}
                  >
                    <Icon sx={{ color: stat.color, fontSize: 32, mb: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          {/* Deploy Button */}
          <Button
            variant="contained"
            size="large"
            startIcon={<Rocket />}
            onClick={handleDeploy}
            disabled={deploying || !config}
            fullWidth
            sx={{
              background: deploying || !config
                ? 'rgba(0, 0, 0, 0.3)'
                : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {deploying ? 'Deploying...' : 'Deploy to PLC'}
          </Button>
        </CardContent>
      </Card>

      {/* Result Alert */}
      {result && (
        <Alert severity={result.success ? 'success' : 'warning'}>
          <Typography variant="body2">{result.message}</Typography>
        </Alert>
      )}
    </Box>
  );
};

export default DeployTab;
