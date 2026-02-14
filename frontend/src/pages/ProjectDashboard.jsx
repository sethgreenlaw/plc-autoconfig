import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { DRAWER_WIDTH } from '../theme';
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
import LmsTab from '../components/tabs/LmsTab';
import ConsultantTab from '../components/tabs/ConsultantTab';
import DataSourcesTab from '../components/tabs/DataSourcesTab';

export default function ProjectDashboard() {
  const { id: projectId, tab } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSnackbar } = useSnackbar();
  const [project, setProject] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const retryCount = useRef(0);
  const initialLoadDone = useRef(false);

  const currentTab = tab || 'overview';

  const recoverProject = useCallback(async (projectData) => {
    // Re-create project on backend with the same ID (cold-start recovery)
    if (!projectData?.name) return false;
    try {
      console.log(`[Dashboard] Re-creating project ${projectId} on backend...`);
      await api.createProject({
        id: projectId,
        name: projectData.name,
        customer_name: projectData.customer_name,
        product_type: projectData.product_type || 'PLC',
        community_url: projectData.community_url || '',
      });
      return true;
    } catch {
      return false;
    }
  }, [projectId]);

  const loadProject = useCallback(async () => {
    // On very first mount, use navigation state if available (avoids cold-start delay)
    if (!initialLoadDone.current && location.state?.project) {
      initialLoadDone.current = true;
      const p = location.state.project;
      setProject(p);
      if (p.configuration) setConfig(p.configuration);
      setLoading(false);
      // Ensure the project exists on the backend (handles Vercel cold starts)
      api.getProject(projectId).then((fresh) => {
        setProject(fresh);
        if (fresh.configuration) setConfig(fresh.configuration);
      }).catch(async () => {
        // Backend lost the project — re-create it
        await recoverProject(p);
      });
      return;
    }
    initialLoadDone.current = true;

    try {
      const p = await api.getProject(projectId);
      setProject(p);
      if (p.configuration) setConfig(p.configuration);
      retryCount.current = 0;
    } catch (err) {
      // Retry up to 3 times with increasing delay (handles serverless cold starts)
      if (retryCount.current < 3) {
        retryCount.current += 1;
        const delay = retryCount.current * 1500;
        console.log(`Project load failed, retrying in ${delay}ms (attempt ${retryCount.current}/3)...`);
        setTimeout(() => loadProject(), delay);
        return;
      }
      // Last resort: try to recover from navigation state if available
      if (location.state?.project) {
        const recovered = await recoverProject(location.state.project);
        if (recovered) {
          setProject(location.state.project);
          showSnackbar('Project restored. You may need to re-upload files.', 'info');
          setLoading(false);
          return;
        }
      }
      showSnackbar('Failed to load project. Please refresh the page.', 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, showSnackbar, location.state, recoverProject]);

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
      case 'data-sources':
        return <DataSourcesTab {...tabProps} />;
      case 'community':
        return <CommunityResearchTab {...tabProps} />;
      case 'lms':
        return <LmsTab {...tabProps} />;
      case 'consultant':
        return <ConsultantTab {...tabProps} />;
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
          minHeight: '100vh',
        }}
      >
        <Box
          sx={{
            maxWidth: 1200,
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 },
          }}
        >
          {renderTab()}
        </Box>
      </Box>
    </Box>
  );
}
