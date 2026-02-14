import alexAvatar from '../assets/agents/alex-chen.svg';
import morganAvatar from '../assets/agents/morgan-liu.svg';
import jordanAvatar from '../assets/agents/jordan-park.svg';
import taylorAvatar from '../assets/agents/taylor-johnson.svg';
import caseyAvatar from '../assets/agents/casey-mitchell.svg';

export const AI_AGENT_PERSONAS = [
  {
    id: 'forms_agent',
    name: 'Alex Chen',
    title: 'Forms & Fields Specialist',
    emoji: '\u{1F4CB}',
    avatar: alexAvatar,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    domain: 'Forms & Application Fields',
    description: 'Expert in form field design, input validation, applicant experience, and comprehensive data collection for government permit applications.',
    expertise: [
      'Form field configuration',
      'Input validation rules',
      'Field dependency logic',
      'Applicant data collection',
      'Required vs optional fields'
    ],
    statsKey: 'forms_agent',
    statFields: [
      { label: 'Total Form Fields', key: 'total_form_fields' },
      { label: 'Record Types w/ Forms', key: 'record_types_with_forms' },
      { label: 'Avg Fields per Type', key: 'avg_fields_per_type' }
    ]
  },
  {
    id: 'fees_agent',
    name: 'Morgan Liu',
    title: 'Revenue & Fees Analyst',
    emoji: '\u{1F4B0}',
    avatar: morganAvatar,
    color: '#10b981',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    domain: 'Fee Structures & Revenue',
    description: 'Specialist in municipal fee structure design, cost recovery analysis, fee schedules, and financial tracking for permit and license revenue.',
    expertise: [
      'Fee structure design',
      'Cost recovery calculations',
      'Fee schedule management',
      'Payment workflows',
      'Revenue reporting'
    ],
    statsKey: 'fees_agent',
    statFields: [
      { label: 'Total Fees Configured', key: 'total_fees' },
      { label: 'Total Fee Revenue', key: 'total_fee_amount', format: 'currency' },
      { label: 'Record Types w/ Fees', key: 'record_types_with_fees' },
      { label: 'Avg Fees per Type', key: 'avg_fees_per_type' }
    ]
  },
  {
    id: 'workflows_agent',
    name: 'Jordan Park',
    title: 'Process Management Director',
    emoji: '\u{2699}\u{FE0F}',
    avatar: jordanAvatar,
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fcd34d',
    domain: 'Workflow & Process Automation',
    description: 'Expert in government approval workflows, routing logic, status transitions, review processes, and multi-department coordination.',
    expertise: [
      'Workflow step sequencing',
      'Approval routing design',
      'Status transition logic',
      'SLA management',
      'Multi-dept coordination'
    ],
    statsKey: 'workflows_agent',
    statFields: [
      { label: 'Total Workflow Steps', key: 'total_workflow_steps' },
      { label: 'Record Types w/ Workflows', key: 'record_types_with_workflows' },
      { label: 'Avg Steps per Type', key: 'avg_steps_per_type' }
    ]
  },
  {
    id: 'documents_agent',
    name: 'Taylor Johnson',
    title: 'Records & Compliance Clerk',
    emoji: '\u{1F4C4}',
    avatar: taylorAvatar,
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    borderColor: '#c4b5fd',
    domain: 'Required Documents & Compliance',
    description: 'Specialist in document requirements, file upload workflows, compliance verification, and record management for government applications.',
    expertise: [
      'Document requirements',
      'Checklist creation',
      'File upload workflows',
      'Compliance verification',
      'Records management'
    ],
    statsKey: 'documents_agent',
    statFields: [
      { label: 'Total Documents Required', key: 'total_documents' },
      { label: 'Record Types w/ Docs', key: 'record_types_with_docs' },
      { label: 'Avg Docs per Type', key: 'avg_docs_per_type' }
    ]
  },
  {
    id: 'internal_agent',
    name: 'Casey Mitchell',
    title: 'Operations Director',
    emoji: '\u{1F3DB}\u{FE0F}',
    avatar: caseyAvatar,
    color: '#ec4899',
    bgColor: '#fdf2f8',
    borderColor: '#fbcfe8',
    domain: 'Internal Operations & Organization',
    description: 'Expert in department structure, user role design, permission management, and internal coordination between government divisions.',
    expertise: [
      'Department organization',
      'Role & permission design',
      'Interdept coordination',
      'Staff assignment logic',
      'Process optimization'
    ],
    statsKey: 'internal_agent',
    statFields: [
      { label: 'Departments Configured', key: 'total_departments' },
      { label: 'User Roles Defined', key: 'total_user_roles' }
    ]
  }
];
