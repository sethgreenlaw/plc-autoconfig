import React, { useState } from 'react';
import {
  Box,
  Stack,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  Checkbox,
  Paper,
  Grid,
  FormControlLabel,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as AttachMoneyIcon,
  FilePresent as FilePresentIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledStepConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderColor: '#374151',
  },
}));

const StyledStep = styled(Step)(({ theme }) => ({
  '& .MuiStepLabel-root': {
    padding: '0',
  },
}));

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`review-tabpanel-${index}`}
      aria-labelledby={`review-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `review-tab-${index}`,
    'aria-controls': `review-tabpanel-${index}`,
  };
}

// Form Field Renderer
const FormFieldRenderer = ({ field }) => {
  const getFieldIcon = () => {
    switch (field.type) {
      case 'email':
        return <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />;
      case 'phone':
        return <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />;
      case 'date':
        return <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />;
      default:
        return null;
    }
  };

  const getFieldComponent = () => {
    const commonProps = {
      fullWidth: true,
      disabled: true,
      size: 'small',
      variant: 'outlined',
      label: field.name + (field.required ? ' *' : ''),
      helperText: field.description || '',
    };

    switch (field.type) {
      case 'text':
        return <TextField {...commonProps} placeholder="Sample text" />;
      case 'email':
        return <TextField {...commonProps} type="email" placeholder="example@mail.com" />;
      case 'phone':
        return <TextField {...commonProps} placeholder="(123) 456-7890" />;
      case 'date':
        return <TextField {...commonProps} type="date" />;
      case 'number':
        return <TextField {...commonProps} type="number" placeholder="0.00" />;
      case 'select':
        return (
          <Select {...commonProps} value="">
            <MenuItem value="">Select an option</MenuItem>
            {(field.options || []).map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        );
      case 'textarea':
        return <TextField {...commonProps} multiline rows={3} placeholder="Enter details here..." />;
      case 'checkbox':
        return (
          <FormControlLabel
            disabled
            control={<Checkbox />}
            label={field.name + (field.required ? ' *' : '')}
          />
        );
      case 'file':
        return <TextField {...commonProps} type="file" inputProps={{ disabled: true }} />;
      case 'address':
        return <TextField {...commonProps} placeholder="123 Main Street, City, State 12345" />;
      default:
        return <TextField {...commonProps} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
      {getFieldIcon()}
      <Box sx={{ flex: 1 }}>{getFieldComponent()}</Box>
    </Box>
  );
};

// Workflow Step Renderer
const WorkflowStepRenderer = ({ step, index, assignedRoles }) => {
  return (
    <StyledStep>
      <StepLabel
        sx={{
          '& .MuiStepLabel-label': {
            color: 'text.primary',
            fontSize: '0.875rem',
          },
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
            {step.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {step.assigned_role && (
              <Chip
                label={`Role: ${step.assigned_role}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {step.status_transition && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Status: {step.status_transition}
              </Typography>
            )}
          </Box>
          {step.actions && step.actions.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Actions:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2, color: 'text.secondary', fontSize: '0.75rem' }}>
                {step.actions.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </StepLabel>
    </StyledStep>
  );
};

// Main ReviewTab Component
const ReviewTab = ({ config, project, showSnackbar }) => {
  const [selectedRecordTypeIndex, setSelectedRecordTypeIndex] = useState(0);

  if (!config?.record_types?.length) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: 'center',
          background: 'background.default',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'text.primary', mb: 1 }}>
          No Configuration Yet
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Create and configure record types to see the preview here.
        </Typography>
      </Box>
    );
  }

  const recordTypes = config.record_types;
  const selectedRT = recordTypes[selectedRecordTypeIndex];
  const departmentName = config.departments?.find((d) => d.id === selectedRT.department_id)?.name || 'Unknown';

  // Extract unique roles from workflow steps
  const rolesInRecord = [
    ...new Set(
      selectedRT.workflow_steps?.map((s) => s.assigned_role).filter(Boolean) || []
    ),
  ];

  // Calculate total fees
  const totalFees = (selectedRT.fees || []).reduce((sum, fee) => sum + (fee.amount || 0), 0);

  return (
    <Box sx={{ minHeight: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Configuration Preview
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Preview how the configuration will look in PLC
        </Typography>
      </Box>

      {/* Record Type Selector */}
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ background: 'background.paper', border: '1px solid #e2e8f0' }}>
          <Tabs
            value={selectedRecordTypeIndex}
            onChange={(e, newValue) => setSelectedRecordTypeIndex(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#3b82f6',
              },
              '& .MuiTab-root': {
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: 'primary.main',
                },
              },
            }}
          >
            {recordTypes.map((rt, idx) => (
              <Tab
                key={rt.id}
                label={rt.name}
                {...a11yProps(idx)}
              />
            ))}
          </Tabs>
        </Paper>
      </Box>

      {/* Preview Content */}
      <TabPanel value={selectedRecordTypeIndex} index={selectedRecordTypeIndex}>
        <Stack spacing={3}>
          {/* Section 1: Application Form Preview */}
          <Card sx={{ background: 'background.paper', border: '1px solid #e2e8f0' }}>
            <CardHeader
              title="Application Form Preview"
              sx={{
                borderBottom: '1px solid #e2e8f0',
                '& .MuiCardHeader-title': {
                  fontSize: '1rem',
                  fontWeight: 600,
                },
              }}
            />
            <CardContent>
              <Grid container spacing={2}>
                {(selectedRT.form_fields || []).length === 0 ? (
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                      No form fields defined
                    </Typography>
                  </Grid>
                ) : (
                  (selectedRT.form_fields || []).map((field, idx) => (
                    <Grid item xs={12} sm={6} key={idx}>
                      <FormFieldRenderer field={field} />
                    </Grid>
                  ))
                )}
              </Grid>
              <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e5e7eb' }}>
                <Button variant="contained" disabled sx={{ maxWidth: 240 }}>
                  Submit Application
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Section 2: Workflow Process */}
          <Card sx={{ background: 'background.paper', border: '1px solid #e2e8f0' }}>
            <CardHeader
              title="Workflow Process"
              sx={{
                borderBottom: '1px solid #e2e8f0',
                '& .MuiCardHeader-title': {
                  fontSize: '1rem',
                  fontWeight: 600,
                },
              }}
            />
            <CardContent>
              {(selectedRT.workflow_steps || []).length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                  No workflow steps defined
                </Typography>
              ) : (
                <Stepper
                  orientation="vertical"
                  connector={<StyledStepConnector />}
                  sx={{
                    '& .MuiStepLabel-iconContainer': {
                      paddingRight: 2,
                    },
                  }}
                >
                  {(selectedRT.workflow_steps || []).map((step, idx) => (
                    <WorkflowStepRenderer
                      key={idx}
                      step={step}
                      index={idx}
                      assignedRoles={rolesInRecord}
                    />
                  ))}
                </Stepper>
              )}
            </CardContent>
          </Card>

          {/* Section 3: Fee Schedule */}
          <Card sx={{ background: 'background.paper', border: '1px solid #e2e8f0' }}>
            <CardHeader
              title="Fee Schedule"
              sx={{
                borderBottom: '1px solid #e2e8f0',
                '& .MuiCardHeader-title': {
                  fontSize: '1rem',
                  fontWeight: 600,
                },
              }}
            />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: '#f1f5f9' }}>
                      <TableCell>Fee Name</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>When Applied</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedRT.fees || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ textAlign: 'center', color: 'text.secondary', py: 2 }}>
                          No fees defined
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {(selectedRT.fees || []).map((fee, idx) => (
                          <TableRow key={idx} sx={{ '&:hover': { background: '#f1f5f9' } }}>
                            <TableCell>{fee.name}</TableCell>
                            <TableCell align="right" sx={{ color: 'success.main', fontWeight: 500 }}>
                              ${fee.amount?.toFixed(2) || '0.00'}
                            </TableCell>
                            <TableCell>
                              <Chip label={fee.type} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>{fee.when_applied || '-'}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow
                          sx={{
                            background: '#f1f5f9',
                            fontWeight: 600,
                            '& .MuiTableCell-root': {
                              fontWeight: 600,
                            },
                          }}
                        >
                          <TableCell colSpan={2}>Total</TableCell>
                          <TableCell align="right" sx={{ color: 'success.main' }}>
                            ${totalFees.toFixed(2)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Section 4: Required Documents Checklist */}
          <Card sx={{ background: 'background.paper', border: '1px solid #e2e8f0' }}>
            <CardHeader
              title="Required Documents Checklist"
              sx={{
                borderBottom: '1px solid #e2e8f0',
                '& .MuiCardHeader-title': {
                  fontSize: '1rem',
                  fontWeight: 600,
                },
              }}
            />
            <CardContent>
              <Stack spacing={1}>
                {(selectedRT.required_documents || []).length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                    No documents required
                  </Typography>
                ) : (
                  (selectedRT.required_documents || []).map((doc, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'flex-start',
                        p: 2,
                        background: '#f1f5f9',
                        borderRadius: 1,
                      }}
                    >
                      <Checkbox disabled sx={{ mt: 0 }} />
                      <Box sx={{ flex: 1, pt: 0.5 }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {doc.name}
                          </Typography>
                          <Chip
                            label={doc.required ? 'Required' : 'Optional'}
                            size="small"
                            color={doc.required ? 'error' : 'default'}
                            variant="filled"
                            icon={doc.required ? <ErrorIcon /> : undefined}
                          />
                          <Chip label={doc.stage} size="small" variant="outlined" />
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {doc.description || 'No description'}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Section 5: Department & Roles Summary */}
          <Card sx={{ background: 'background.paper', border: '1px solid #e2e8f0' }}>
            <CardHeader
              title="Department & Roles Summary"
              sx={{
                borderBottom: '1px solid #e2e8f0',
                '& .MuiCardHeader-title': {
                  fontSize: '1rem',
                  fontWeight: 600,
                },
              }}
            />
            <CardContent>
              <Stack spacing={3}>
                {/* Department Info */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                    Department
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      background: '#f1f5f9',
                      borderRadius: 1,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                      {departmentName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Handles {selectedRT.category?.replace('_', ' ')} processes
                    </Typography>
                  </Box>
                </Box>

                {/* Roles Summary */}
                {rolesInRecord.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                      User Roles Involved
                    </Typography>
                    <Grid container spacing={1}>
                      {rolesInRecord.map((role) => (
                        <Grid item xs={12} sm={6} key={role}>
                          <Box
                            sx={{
                              p: 2,
                              background: '#f1f5f9',
                              borderRadius: 1,
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CheckCircleIcon sx={{ color: 'primary.main', fontSize: '1.25rem' }} />
                              <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                {role}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Statistics Summary */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                    Configuration Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box
                        sx={{
                          p: 2,
                          background: '#f1f5f9',
                          borderRadius: 1,
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                          {selectedRT.form_fields?.length || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Form Fields
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box
                        sx={{
                          p: 2,
                          background: '#f1f5f9',
                          borderRadius: 1,
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                          {selectedRT.workflow_steps?.length || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Workflow Steps
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box
                        sx={{
                          p: 2,
                          background: '#f1f5f9',
                          borderRadius: 1,
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 600 }}>
                          {selectedRT.fees?.length || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Fee Types
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box
                        sx={{
                          p: 2,
                          background: '#f1f5f9',
                          borderRadius: 1,
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 600 }}>
                          {selectedRT.required_documents?.length || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Documents
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </TabPanel>
    </Box>
  );
};

export default ReviewTab;
