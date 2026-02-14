import React, { useState } from 'react';
import {
  Box,
  Stack,
  Card,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Select,
  MenuItem,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Avatar,
  Checkbox,
  Tooltip,
  Paper,
  Collapse,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Add as AddIcon,
  AccountTree as ConditionIcon,
  Functions as FormulaIcon,
} from '@mui/icons-material';
import { api } from '../../api/client';

const FIELD_TYPES = ['text', 'email', 'phone', 'date', 'number', 'select', 'textarea', 'file', 'checkbox', 'address'];
const FEE_TYPES = ['application', 'processing', 'permit', 'inspection', 'annual'];
const FEE_WHEN = ['upfront', 'upon_approval', 'upon_inspection', 'annual'];
const DOC_STAGES = ['application', 'review', 'approval', 'inspection'];
const CATEGORIES = ['permit', 'license', 'code_enforcement', 'inspection'];
const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

const getCategoryColor = (category) => {
  const colors = {
    permit: 'primary',
    license: 'secondary',
    code_enforcement: 'warning',
    inspection: 'success',
  };
  return colors[category] || 'default';
};

// ConditionBadge - shows a single condition as a styled chip
const ConditionBadge = ({ condition, onDelete, editable }) => {
  const operatorLabel = OPERATORS.find(o => o.value === condition.operator)?.label || condition.operator;
  const needsValue = !['is_empty', 'is_not_empty'].includes(condition.operator);
  const label = needsValue
    ? `If ${condition.source_field} ${operatorLabel} "${condition.value}"`
    : `If ${condition.source_field} ${operatorLabel}`;

  return (
    <Tooltip title={condition.description || label}>
      <Chip
        icon={<ConditionIcon sx={{ fontSize: 16 }} />}
        label={label}
        size="small"
        color="info"
        variant="outlined"
        onDelete={editable ? onDelete : undefined}
        sx={{
          maxWidth: 300,
          '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' }
        }}
      />
    </Tooltip>
  );
};

// ConditionEditor - inline form to add a new condition
const ConditionEditor = ({ formFields, onAdd, onCancel }) => {
  const [condition, setCondition] = useState({
    source_field: '',
    operator: 'equals',
    value: '',
    description: '',
  });

  const needsValue = !['is_empty', 'is_not_empty'].includes(condition.operator);

  return (
    <Paper sx={{ p: 2, mt: 1, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
      <Typography variant="caption" sx={{ fontWeight: 600, mb: 1.5, display: 'block', color: 'primary.main' }}>
        Add Condition Rule
      </Typography>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 20 }}>If</Typography>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Field</InputLabel>
            <Select
              label="Field"
              value={condition.source_field}
              onChange={(e) => setCondition({ ...condition, source_field: e.target.value })}
            >
              {formFields?.map((f) => (
                <MenuItem key={f.name} value={f.name}>{f.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Operator</InputLabel>
            <Select
              label="Operator"
              value={condition.operator}
              onChange={(e) => setCondition({ ...condition, operator: e.target.value })}
            >
              {OPERATORS.map((op) => (
                <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {needsValue && (
            <TextField
              label="Value"
              size="small"
              value={condition.value}
              onChange={(e) => setCondition({ ...condition, value: e.target.value })}
              sx={{ minWidth: 150 }}
            />
          )}
        </Stack>
        <TextField
          label="Description (optional)"
          size="small"
          fullWidth
          value={condition.description}
          onChange={(e) => setCondition({ ...condition, description: e.target.value })}
          placeholder="e.g., Only applies to new construction projects"
        />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button size="small" onClick={onCancel}>Cancel</Button>
          <Button
            size="small"
            variant="contained"
            disabled={!condition.source_field}
            onClick={() => {
              onAdd({
                ...condition,
                id: Math.random().toString(36).substr(2, 8),
              });
              setCondition({ source_field: '', operator: 'equals', value: '', description: '' });
            }}
          >
            Add Rule
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

// ConditionsSection - renders conditions list with add/remove for a given item
const ConditionsSection = ({ conditions = [], formFields, isEditing, onUpdate }) => {
  const [showEditor, setShowEditor] = useState(false);

  const handleDelete = (condId) => {
    onUpdate(conditions.filter(c => c.id !== condId));
  };

  const handleAdd = (newCondition) => {
    onUpdate([...conditions, newCondition]);
    setShowEditor(false);
  };

  if (!conditions.length && !isEditing) return null;

  return (
    <Box sx={{ mt: 0.5 }}>
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {conditions.map((cond) => (
          <ConditionBadge
            key={cond.id}
            condition={cond}
            editable={isEditing}
            onDelete={() => handleDelete(cond.id)}
          />
        ))}
        {isEditing && !showEditor && (
          <Chip
            icon={<AddIcon sx={{ fontSize: 16 }} />}
            label="Add Rule"
            size="small"
            variant="outlined"
            onClick={() => setShowEditor(true)}
            sx={{ cursor: 'pointer', borderStyle: 'dashed' }}
          />
        )}
      </Stack>
      {showEditor && (
        <ConditionEditor
          formFields={formFields}
          onAdd={handleAdd}
          onCancel={() => setShowEditor(false)}
        />
      )}
    </Box>
  );
};

// RecordTypeCard component
const RecordTypeCard = ({ rt, departments, projectId, onRefresh, showSnackbar }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editData, setEditData] = useState(JSON.parse(JSON.stringify(rt)));

  const departmentName = departments?.find((d) => d.id === rt.department_id)?.name || 'Unknown';

  const handleStartEdit = () => {
    setEditData(JSON.parse(JSON.stringify(rt)));
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await api.updateRecordType(projectId, rt.id, editData);
      showSnackbar('Record type updated successfully', 'success');
      setIsEditing(false);
      onRefresh();
    } catch (error) {
      showSnackbar('Failed to update record type', 'error');
    }
  };

  const handleCancel = () => {
    setEditData(JSON.parse(JSON.stringify(rt)));
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      await api.deleteRecordType(projectId, rt.id);
      showSnackbar('Record type deleted successfully', 'success');
      setDeleteDialogOpen(false);
      onRefresh();
    } catch (error) {
      showSnackbar('Failed to delete record type', 'error');
    }
  };

  // Helper to update conditions on a specific item in an array
  const updateFieldConditions = (fieldIndex, newConditions) => {
    const fields = [...(editData.form_fields || [])];
    fields[fieldIndex] = { ...fields[fieldIndex], conditions: newConditions };
    setEditData({ ...editData, form_fields: fields });
  };

  const updateFeeConditions = (feeIndex, newConditions) => {
    const fees = [...(editData.fees || [])];
    fees[feeIndex] = { ...fees[feeIndex], conditions: newConditions };
    setEditData({ ...editData, fees: fees });
  };

  const updateStepConditions = (stepIndex, newConditions) => {
    const steps = [...(editData.workflow_steps || [])];
    steps[stepIndex] = { ...steps[stepIndex], conditions: newConditions };
    setEditData({ ...editData, workflow_steps: steps });
  };

  const updateDocConditions = (docIndex, newConditions) => {
    const docs = [...(editData.required_documents || [])];
    docs[docIndex] = { ...docs[docIndex], conditions: newConditions };
    setEditData({ ...editData, required_documents: docs });
  };

  const data = isEditing ? editData : rt;
  const fieldCount = data.form_fields?.length || 0;
  const stepCount = data.workflow_steps?.length || 0;
  const feeCount = data.fees?.length || 0;
  const docCount = data.required_documents?.length || 0;
  const condCount = [
    ...(data.form_fields || []),
    ...(data.fees || []),
    ...(data.workflow_steps || []),
    ...(data.required_documents || []),
  ].reduce((sum, item) => sum + (item.conditions?.length || 0), 0);

  return (
    <>
      <Card
        sx={{
          background: 'background.paper',
          border: '1px solid #e2e8f0',
          '&:hover': { borderColor: '#3b82f6' },
        }}
      >
        <Accordion defaultExpanded={false} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {data.name}
              </Typography>
              <Chip
                label={data.category}
                color={getCategoryColor(data.category)}
                size="small"
                variant="filled"
              />
              <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1 }}>
                {departmentName}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mr: 2, color: 'text.secondary' }}>
              <Typography variant="caption">{fieldCount} fields</Typography>
              <Typography variant="caption">•</Typography>
              <Typography variant="caption">{stepCount} steps</Typography>
              <Typography variant="caption">•</Typography>
              <Typography variant="caption">{feeCount} fees</Typography>
              <Typography variant="caption">•</Typography>
              <Typography variant="caption">{docCount} docs</Typography>
              {condCount > 0 && (
                <>
                  <Typography variant="caption">•</Typography>
                  <Chip
                    icon={<ConditionIcon sx={{ fontSize: 14 }} />}
                    label={`${condCount} rules`}
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ height: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.7rem' } }}
                  />
                </>
              )}
            </Box>
          </AccordionSummary>

          <AccordionDetails sx={{ pt: 3, pb: 3 }}>
            <Stack spacing={3}>
              {/* Header & Description */}
              {isEditing ? (
                <Stack spacing={2}>
                  <TextField
                    label="Name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Description"
                    value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    multiline
                    rows={2}
                    fullWidth
                    size="small"
                  />
                  <Select
                    value={editData.category}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    fullWidth
                    size="small"
                  >
                    {CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                  <Select
                    value={editData.department_id}
                    onChange={(e) => setEditData({ ...editData, department_id: e.target.value })}
                    fullWidth
                    size="small"
                  >
                    {departments?.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                    ))}
                  </Select>
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {data.description || 'No description'}
                </Typography>
              )}

              {/* Form Fields Section */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Form Fields ({fieldCount})
                  </Typography>
                  {isEditing && (
                    <Button startIcon={<AddIcon />} size="small" variant="outlined">Add Field</Button>
                  )}
                </Box>
                <TableContainer component={Paper} sx={{ background: 'background.default' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ background: '#f1f5f9' }}>
                        <TableCell>Field Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Required</TableCell>
                        <TableCell>Conditions</TableCell>
                        <TableCell>Description</TableCell>
                        {isEditing && <TableCell>Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.form_fields?.map((field, idx) => (
                        <TableRow key={idx} sx={{ '&:hover': { background: '#f1f5f9' }, verticalAlign: 'top' }}>
                          <TableCell>{field.name}</TableCell>
                          <TableCell>
                            <Chip label={field.field_type || field.type} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={field.required ? 'Required' : 'Optional'}
                              size="small"
                              color={field.required ? 'success' : 'default'}
                              variant={field.required ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 200 }}>
                            <ConditionsSection
                              conditions={field.conditions || []}
                              formFields={data.form_fields}
                              isEditing={isEditing}
                              onUpdate={(newConds) => updateFieldConditions(idx, newConds)}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                            {field.description || '-'}
                          </TableCell>
                          {isEditing && (
                            <TableCell>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error">
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {!data.form_fields?.length && (
                        <TableRow>
                          <TableCell colSpan={isEditing ? 6 : 5} sx={{ textAlign: 'center', color: 'text.secondary' }}>
                            No fields defined
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Workflow Steps Section */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Workflow Steps ({stepCount})
                  </Typography>
                  {isEditing && (
                    <Button startIcon={<AddIcon />} size="small" variant="outlined">Add Step</Button>
                  )}
                </Box>
                <Stack spacing={1}>
                  {data.workflow_steps?.map((step, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        p: 1.5,
                        background: '#f1f5f9',
                        borderRadius: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Avatar sx={{ background: '#3b82f6', width: 32, height: 32, fontSize: '0.875rem' }}>
                          {idx + 1}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {step.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {step.status_from || 'Start'} → {step.status_to} • Assigned: {step.assigned_role || 'Unassigned'}
                          </Typography>
                        </Box>
                        {isEditing && (
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      <ConditionsSection
                        conditions={step.conditions || []}
                        formFields={data.form_fields}
                        isEditing={isEditing}
                        onUpdate={(newConds) => updateStepConditions(idx, newConds)}
                      />
                    </Box>
                  ))}
                  {!data.workflow_steps?.length && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
                      No workflow steps defined
                    </Typography>
                  )}
                </Stack>
              </Box>

              {/* Fees Section */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Fees ({feeCount})
                  </Typography>
                  {isEditing && (
                    <Button startIcon={<AddIcon />} size="small" variant="outlined">Add Fee</Button>
                  )}
                </Box>
                <TableContainer component={Paper} sx={{ background: 'background.default' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ background: '#f1f5f9' }}>
                        <TableCell>Fee Name</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>When Applied</TableCell>
                        <TableCell>Conditions / Formula</TableCell>
                        {isEditing && <TableCell>Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.fees?.map((fee, idx) => (
                        <TableRow key={idx} sx={{ '&:hover': { background: '#f1f5f9' }, verticalAlign: 'top' }}>
                          <TableCell>{fee.name}</TableCell>
                          <TableCell sx={{ color: 'success.main', fontWeight: 500 }}>
                            ${fee.amount?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell>
                            <Chip label={fee.fee_type || fee.type} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{fee.when_applied || '-'}</TableCell>
                          <TableCell sx={{ minWidth: 220 }}>
                            <Stack spacing={0.5}>
                              {fee.formula && (
                                <Chip
                                  icon={<FormulaIcon sx={{ fontSize: 14 }} />}
                                  label={`Formula: ${fee.formula}`}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ maxWidth: 280, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                                />
                              )}
                              <ConditionsSection
                                conditions={fee.conditions || []}
                                formFields={data.form_fields}
                                isEditing={isEditing}
                                onUpdate={(newConds) => updateFeeConditions(idx, newConds)}
                              />
                            </Stack>
                          </TableCell>
                          {isEditing && (
                            <TableCell>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error">
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {!data.fees?.length && (
                        <TableRow>
                          <TableCell colSpan={isEditing ? 6 : 5} sx={{ textAlign: 'center', color: 'text.secondary' }}>
                            No fees defined
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Required Documents Section */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Required Documents ({docCount})
                  </Typography>
                  {isEditing && (
                    <Button startIcon={<AddIcon />} size="small" variant="outlined">Add Document</Button>
                  )}
                </Box>
                <Stack spacing={1}>
                  {data.required_documents?.map((doc, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        p: 1.5,
                        background: '#f1f5f9',
                        borderRadius: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {doc.name}
                            </Typography>
                            <Chip
                              label={doc.required ? 'Required' : 'Optional'}
                              size="small"
                              color={doc.required ? 'error' : 'default'}
                              variant="filled"
                            />
                            <Chip label={doc.stage} size="small" variant="outlined" />
                          </Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {doc.description || 'No description'}
                          </Typography>
                        </Box>
                        {isEditing && (
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      <ConditionsSection
                        conditions={doc.conditions || []}
                        formFields={data.form_fields}
                        isEditing={isEditing}
                        onUpdate={(newConds) => updateDocConditions(idx, newConds)}
                      />
                    </Box>
                  ))}
                  {!data.required_documents?.length && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
                      No documents defined
                    </Typography>
                  )}
                </Stack>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1, pt: 2, borderTop: '1px solid #e2e8f0' }}>
                {!isEditing ? (
                  <>
                    <Button variant="contained" startIcon={<EditIcon />} onClick={handleStartEdit}>
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      Delete
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
                      Save Changes
                    </Button>
                    <Button variant="outlined" startIcon={<CloseIcon />} onClick={handleCancel}>
                      Cancel
                    </Button>
                  </>
                )}
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Record Type</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{data.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Main RecordTypesTab component
const RecordTypesTab = ({ config, projectId, onRefresh, onConfigRefresh, showSnackbar }) => {
  const recordTypes = config?.record_types || [];
  const departments = config?.departments || [];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Record Types
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {recordTypes.length} record type{recordTypes.length !== 1 ? 's' : ''} configured — use conditional rules to control when fields, fees, and workflows apply
        </Typography>
      </Box>

      {recordTypes.length === 0 ? (
        <Card
          sx={{
            background: 'background.paper',
            border: '1px dashed #e2e8f0',
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            No record types yet. Create one to get started.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {recordTypes.map((rt) => (
            <RecordTypeCard
              key={rt.id}
              rt={rt}
              departments={departments}
              projectId={projectId}
              onRefresh={onRefresh}
              showSnackbar={showSnackbar}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default RecordTypesTab;
