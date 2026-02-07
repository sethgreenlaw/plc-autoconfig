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
  Business,
  Edit,
  Save,
  Close,
} from '@mui/icons-material';
import { api } from '../../api/client';

const DepartmentCard = ({ dept, recordTypes, projectId, onRefresh, showSnackbar }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(dept.name);
  const [description, setDescription] = useState(dept.description);

  const linkedRTs = recordTypes?.filter((rt) => rt.department_id === dept.id) || [];

  const handleSave = async () => {
    try {
      await api.updateDepartment(projectId, dept.id, { name, description });
      showSnackbar('Department updated', 'success');
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
              label="Department Name"
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
                <Business sx={{ color: '#a855f7' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {dept.name}
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
              {dept.description}
            </Typography>
            {linkedRTs.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Record Types:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {linkedRTs.map((rt) => (
                    <Chip key={rt.id} label={rt.name} size="small" variant="outlined" />
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

const DepartmentsTab = ({ config, projectId, onRefresh, onConfigRefresh, showSnackbar }) => {
  if (!config?.departments?.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Business sx={{ fontSize: 48, color: 'text.secondary', mx: 'auto', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
          No departments yet
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Departments
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {config.departments.length} departments configured
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {config.departments.map((d) => (
          <Grid item xs={12} sm={6} key={d.id}>
            <DepartmentCard
              dept={d}
              recordTypes={config.record_types}
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

export default DepartmentsTab;
