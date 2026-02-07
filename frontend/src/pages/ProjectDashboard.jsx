import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { api } from '../api/client';
import { useSnackbar } from '../context/SnackbarContext';
import Sidebar from '../components/layout/Sidebar';
import OverviewTab from '../components/tabs/OverviewTab';
import UploadTab from '../components/tabs/UploadTab';
import RecordTypesTab from '../components/tabs/RecordTypesTab';
import DepartmentsTab from '../components/tabs/DepartmentsTab';
import RolesTab from '../components/tabs/RolesTab';
import ReviewTab from '../components/tabs/ReviewTab';
import CommunityResearchTab from '../components/tabs/CommunityResearchTab';
import DeployTab from '../components/tabs/DeployTab';

const DRAWER_WIDTH = 280;

export default function ProjectDashboard() {
  const { id: projectId, tab } = useParams();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [project, setProject] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentTab = tab || 'overview';

  const loadProject = useCallback(async () => {
    try {
      const p = await api.getProject(projectId);
      setProject(p);
      if (p.configuration) setConfig(p.configuration);
    } catch (err) {
      showSnackbar('Failed to load project', 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, showSnackbar]);

  const loadConfig = useCallback(async () => {
    try {
      const c = await api.getConfiguration(projectId);
      setConfig(c);
    } catch {
      // No config yet
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Project not found
        </Typography>
      </Box>
    );
  }

  const tabProps = {
    project,
    config,
    projectId,
    onRefresh: loadProject,
    onConfigRefresh: loadConfig,
    showSnackbar,
  };

  const renderTab = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewTab {...tabProps} />;
      case 'upload':
        return <UploadTab {...tabProps} />;
      case 'record-types':
        return <RecordTypesTab {...tabProps} />;
      case 'departments':
        return <DepartmentsTab {...tabProps} />;
      case 'roles':
        return <RolesTab {...tabProps} />;
      case 'community':
        return <CommunityResearchTab {...tabProps} />;
      case 'review':
        return <ReviewTab {...tabProps} />;
      case 'deploy':
        return <DeployTab {...tabProps} />;
      default:
        return <OverviewTab {...tabProps} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar project={project} />
      <Box
        component="main"
        sx={{
          flex: 1,
          ml: `${DRAWER_WIDTH}px`,
          overflow: 'auto',
          p: 4,
        }}
      >
        {renderTab()}
      </Box>
    </Box>
  );
}
