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
} from '@mui/icons-material';
import { Link, useLocation, useParams } from 'react-router-dom';

const DRAWER_WIDTH = 280;

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
  { label: 'Community Research', icon: Public, tab: 'community' },
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
          bgcolor: 'background.paper',
          borderRight: '1px solid #e2e8f0',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          p: 2,
        }}
      >
        {/* Top Section: Logo and Branding */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Description
              sx={{
                fontSize: 28,
                color: 'primary.main',
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                letterSpacing: 0.5,
              }}
            >
              PLC AutoConfig
            </Typography>
          </Stack>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
            }}
          >
            AI Configuration Engine
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Navigation Links */}
        <List sx={{ flex: 1 }}>
          {navItems.map((item) => (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.href}
                sx={{
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'rgba(59, 130, 246, 0.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: 'text.secondary',
                  }}
                >
                  <item.icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* Project Section */}
        {project && (
          <>
            <Divider sx={{ my: 2 }} />

            <Typography
              variant="caption"
              sx={{
                textTransform: 'uppercase',
                color: 'text.secondary',
                fontWeight: 700,
                mb: 1.5,
                letterSpacing: 1,
              }}
            >
              {project.name || 'Project'}
            </Typography>

            <List disablePadding sx={{ flex: 1 }}>
              {projectNavItems.map((item) => (
                <ListItem key={item.tab} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    component={Link}
                    to={`/project/${projectId}/${item.tab}`}
                    selected={activeTab === item.tab}
                    sx={{
                      borderRadius: 1,
                      borderLeft:
                        activeTab === item.tab
                          ? '3px solid'
                          : '3px solid transparent',
                      borderLeftColor:
                        activeTab === item.tab ? 'primary.main' : 'transparent',
                      bgcolor:
                        activeTab === item.tab
                          ? 'rgba(59, 130, 246, 0.08)'
                          : 'transparent',
                      pl: activeTab === item.tab ? '14px' : '16px',
                      '&:hover': {
                        bgcolor: 'rgba(59, 130, 246, 0.04)',
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
                        minWidth: 40,
                        color:
                          activeTab === item.tab ? 'primary.main' : 'text.secondary',
                      }}
                    >
                      <item.icon />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: activeTab === item.tab ? 600 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
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
