import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Stack,
  Chip,
} from '@mui/material';
import {
  Shield,
  Edit,
  Save,
  Close,
} from '@mui/icons-material';
import { api } from '../../api/client';

const RoleCard = ({ role, departments, projectId, onRefresh, showSnackbar }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description);

  const deptNames =
    role.department_ids
      ?.map((id) => departments?.find((d) => d.id === id)?.name)
      .filter(Boolean) || [];

  const handleSave = async () => {
    try {
      await api.updateRole(projectId, role.id, { name, description });
      showSnackbar('Role updated', 'success');
      setEditing(false);
      await onRefresh();
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  };

  return (
    <Card>
      <CardContent>
        {editing ? (
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Role Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              variant="outlined"
              size="small"
            />
            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              variant="outlined"
              multiline
              rows={2}
              size="small"
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Save />}
                onClick={handleSave}
                size="small"
              >
                Save
              </Button>
              <Button
                variant="outlined"
                startIcon={<Close />}
                onClick={() => setEditing(false)}
                size="small"
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Shield sx={{ color: '#22c55e' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {role.name}
                </Typography>
              </Box>
              <Button
                size="small"
                startIcon={<Edit />}
                onClick={() => setEditing(true)}
                sx={{ minWidth: 'auto' }}
              >
              </Button>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              {role.description}
            </Typography>
            {role.permissions?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Permissions:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {role.permissions.map((p, i) => (
                    <Chip
                      key={i}
                      label={p}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(34, 197, 94, 0.08)',
                        color: 'success.main',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            {deptNames.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Departments:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {deptNames.map((n, i) => (
                    <Chip key={i} label={n} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

const RolesTab = ({ config, projectId, onRefresh, onConfigRefresh, showSnackbar }) => {
  if (!config?.user_roles?.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Shield sx={{ fontSize: 48, color: 'text.secondary', mx: 'auto', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
          No user roles yet
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Upload data and run AI analysis to generate configurations.
        </Typography>
      </Box>
    );
  }

  const refresh = async () => {
    await onRefresh();
    await onConfigRefresh();
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          User Roles
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {config.user_roles.length} roles configured
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {config.user_roles.map((r) => (
          <Grid item xs={12} sm={6} key={r.id}>
            <RoleCard
              role={r}
              departments={config.departments}
              projectId={projectId}
              onRefresh={refresh}
              showSnackbar={showSnackbar}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default RolesTab;
