import React from 'react';
import {
  Box,
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
} from '@mui/material';
import {
  Description,
  Home,
  CreateNewFolder,
  Dashboard,
  CloudUpload,
  Business,
  People,
  Preview,
  Public,
  RocketLaunch,
  School,
  SupportAgent,
  AutoAwesome,
} from '@mui/icons-material';
import { Link, useLocation, useParams } from 'react-router-dom';
import { DRAWER_WIDTH } from '../../theme';

const navItems = [
  { label: 'All Projects', icon: Home, id: 'all-projects', href: '/' },
  { label: 'New Project', icon: CreateNewFolder, id: 'new-project', href: '/new' },
];

const projectNavItems = [
  { label: 'Overview', icon: Dashboard, tab: 'overview' },
  { label: 'Upload Data', icon: CloudUpload, tab: 'upload' },
  { label: 'Record Types', icon: Description, tab: 'record-types' },
  { label: 'Departments', icon: Business, tab: 'departments' },
  { label: 'User Roles', icon: People, tab: 'roles' },
  { label: 'Intelligence', icon: AutoAwesome, tab: 'data-sources' },
  { label: 'Community Research', icon: Public, tab: 'community' },
  { label: 'Learning Materials', icon: School, tab: 'lms' },
  { label: 'AI Consultant', icon: SupportAgent, tab: 'consultant' },
  { label: 'Review', icon: Preview, tab: 'review' },
  { label: 'Deploy', icon: RocketLaunch, tab: 'deploy' },
];

export default function Sidebar({ project }) {
  const location = useLocation();
  const { id: projectId } = useParams();

  const getActiveTab = () => {
    const pathParts = location.pathname.split('/');
    return pathParts[pathParts.length - 1] || 'overview';
  };

  const activeTab = getActiveTab();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: '#fafbfc',
          borderRight: '1px solid #e5e7eb',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          px: 1.5,
          py: 2,
        }}
      >
        {/* Top Section: Logo and Branding */}
        <Box sx={{ mb: 2, px: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Description
              sx={{
                fontSize: 22,
                color: 'primary.main',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                letterSpacing: 0.3,
                fontSize: '0.813rem',
              }}
            >
              OpenGov Auto-Implement
            </Typography>
          </Stack>
          <Typography
            variant="caption"
            sx={{
              color: 'text.disabled',
              display: 'block',
              fontSize: '0.688rem',
              pl: 3.5,
            }}
          >
            AI Implementation Engine
          </Typography>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Navigation Links */}
        <List disablePadding>
          {navItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                component={Link}
                to={item.href}
                sx={{
                  borderRadius: 1.5,
                  py: 0.75,
                  '&:hover': {
                    bgcolor: 'rgba(59, 130, 246, 0.06)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 32,
                    color: 'text.secondary',
                  }}
                >
                  <item.icon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: 500,
                    fontSize: '0.813rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* Project Section */}
        {project && (
          <>
            <Divider sx={{ my: 1.5 }} />

            <Typography
              variant="overline"
              sx={{
                color: 'text.disabled',
                fontWeight: 600,
                mb: 1,
                px: 1,
                fontSize: '0.625rem',
                display: 'block',
              }}
            >
              {project.name || 'Project'}
            </Typography>

            <List disablePadding sx={{ flex: 1 }}>
              {projectNavItems.map((item) => {
                const isActive = activeTab === item.tab;
                return (
                  <ListItem key={item.tab} disablePadding sx={{ mb: 0.25 }}>
                    <ListItemButton
                      component={Link}
                      to={`/project/${projectId}/${item.tab}`}
                      selected={isActive}
                      sx={{
                        borderRadius: 1.5,
                        py: 0.625,
                        bgcolor: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        '&:hover': {
                          bgcolor: isActive ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.04)',
                        },
                        '&.Mui-selected': {
                          bgcolor: 'rgba(59, 130, 246, 0.08)',
                        },
                        '&.Mui-selected:hover': {
                          bgcolor: 'rgba(59, 130, 246, 0.12)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 32,
                          color: isActive ? 'primary.main' : 'text.secondary',
                        }}
                      >
                        <item.icon sx={{ fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? 'primary.main' : 'text.primary',
                          fontSize: '0.813rem',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </>
        )}

        {/* Footer */}
        <Box sx={{ mt: 'auto' }}>
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="caption"
            sx={{
              color: 'text.disabled',
              display: 'block',
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            v2.0
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}
