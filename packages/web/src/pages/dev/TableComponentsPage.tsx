import { useState, useMemo } from 'react';

import { DemoTabs, type DemoTab } from '@web/components/demo';
import {
  ComponentPageWrapper,
  ComponentPageHeader,
  ComponentSection,
  DeveloperInstructions,
} from '@web/components/dev';
import {
  Table,
  TableControls,
  createColumns,
  type TableState,
  type StatusConfig,
  type TableFilterConfig,
} from '@web/components/table';
import { Text } from '@web/components/text';
import { useApiTable } from '@web/hooks/useApiTable';

// ============================================================================
// Sample data types and data
// ============================================================================

interface VideoRow extends Record<string, unknown> {
  id: string;
  title: string;
  status: 'draft' | 'active' | 'archived';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  movementType: string | null;
  durationSeconds: number;
  bodyParts: string[];
  tags: string[];
  createdAt: string;
}

const VIDEO_STATUS_MAP: Partial<Record<string, StatusConfig>> = {
  draft: { label: 'Draft', colour: 'grey' },
  active: { label: 'Active', colour: 'success' },
  archived: { label: 'Archived', colour: 'warning' },
};

const SAMPLE_VIDEOS: VideoRow[] = [
  {
    id: '1',
    title: 'Gentle Neck Stretch',
    status: 'active',
    difficulty: 'beginner',
    movementType: 'stretch',
    durationSeconds: 180,
    bodyParts: ['neck', 'shoulders'],
    tags: ['gentle', 'desk-friendly', 'warm-up'],
    createdAt: '2026-02-15T10:30:00Z',
  },
  {
    id: '2',
    title: 'Shoulder Mobility Flow',
    status: 'active',
    difficulty: 'intermediate',
    movementType: 'mobility',
    durationSeconds: 420,
    bodyParts: ['shoulders', 'upper back', 'chest'],
    tags: ['mobility', 'posture'],
    createdAt: '2026-02-20T14:00:00Z',
  },
  {
    id: '3',
    title: 'Hip Flexor Release',
    status: 'draft',
    difficulty: 'beginner',
    movementType: 'stretch',
    durationSeconds: 300,
    bodyParts: ['hips', 'lower back'],
    tags: ['seated', 'recovery'],
    createdAt: '2026-03-01T09:15:00Z',
  },
  {
    id: '4',
    title: 'Advanced Core Stability',
    status: 'active',
    difficulty: 'advanced',
    movementType: 'strength',
    durationSeconds: 600,
    bodyParts: ['core', 'lower back', 'hips', 'glutes'],
    tags: ['strength', 'stability', 'progressive'],
    createdAt: '2026-01-10T16:45:00Z',
  },
  {
    id: '5',
    title: 'Ankle Rehabilitation Basics',
    status: 'archived',
    difficulty: 'beginner',
    movementType: 'rehabilitation',
    durationSeconds: 240,
    bodyParts: ['ankles', 'feet'],
    tags: ['rehabilitation', 'gentle'],
    createdAt: '2025-12-05T11:00:00Z',
  },
];

// ============================================================================
// Column definitions
// ============================================================================

const columns = createColumns<VideoRow>();

const basicColumns = [
  columns.text('title', { label: 'Title', sortable: true }),
  columns.status('status', {
    label: 'Status',
    sortable: true,
    align: 'left',
    statusMap: VIDEO_STATUS_MAP,
  }),
  columns.text('difficulty', { label: 'Difficulty', sortable: true }),
  columns.duration('durationSeconds', { label: 'Duration', sortable: true }),
  columns.date('createdAt', { label: 'Uploaded', sortable: true }),
];

const fullColumns = [
  columns.text('title', { label: 'Title', sortable: true }),
  columns.status('status', {
    label: 'Status',
    sortable: true,
    align: 'left',
    statusMap: VIDEO_STATUS_MAP,
  }),
  columns.text('difficulty', { label: 'Difficulty', sortable: true }),
  columns.text('movementType', { label: 'Movement Type' }),
  columns.duration('durationSeconds', { label: 'Duration', sortable: true }),
  columns.tags('bodyParts', { label: 'Body Parts', maxVisible: 2 }),
  columns.tags('tags', { label: 'Tags', maxVisible: 2 }),
  columns.date('createdAt', { label: 'Uploaded', sortable: true }),
  columns.actions({
    actions: (row) => [
      {
        label: 'Edit',
        onClick: () => {
          alert(`Edit: ${row.title}`);
        },
      },
      {
        label: 'Archive',
        onClick: () => {
          alert(`Archive: ${row.title}`);
        },
        variant: 'danger' as const,
        hidden: (r: VideoRow) => r.status === 'archived',
      },
    ],
  }),
];

// ============================================================================
// Demo page
// ============================================================================

/**
 * Table components showcase page (development only).
 *
 * Demonstrates the reusable Table component with:
 * - Column helpers (text, status, duration, tags, date, actions)
 * - Sorting and pagination
 * - Loading, empty, and error states
 * - Column visibility toggle
 */
export const TableComponentsPage = (): JSX.Element => {
  const demoTabs: DemoTab[] = [
    { id: 'basic', label: 'Basic Table', content: <BasicTableDemo /> },
    { id: 'full', label: 'Full Features', content: <FullFeaturesDemo /> },
    { id: 'controls', label: 'Controls', content: <ControlsDemo /> },
    { id: 'states', label: 'States', content: <StatesDemo /> },
    { id: 'pagination', label: 'Pagination', content: <PaginationDemo /> },
  ];

  return (
    <ComponentPageWrapper maxWidth="7xl">
      <ComponentPageHeader
        title="Table Components"
        description="Server-side paginated data tables with sorting, column helpers, and row actions"
        showBackLink
      />

      <ComponentSection title="Component Demos">
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-6">
          Click through each tab to explore table variations, column helpers, states, and
          pagination.
        </Text>
        <DemoTabs tabs={demoTabs} />
      </ComponentSection>

      <DeveloperInstructions title="Usage Instructions">
        <div className="space-y-3">
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Import and define columns:
            </Text>
            <code className="block whitespace-pre rounded bg-muted p-2 text-xs">
              {`import { Table, createColumns } from '@web/components/table';
import { useApiTable } from '@web/hooks/useApiTable';

const columns = createColumns<VideoRow>();
const myColumns = [
  columns.text('title', { label: 'Title', sortable: true }),
  columns.status('status', { label: 'Status', statusMap }),
  columns.tags('bodyParts', { label: 'Body Parts', maxVisible: 2 }),
  columns.actions({ actions: [...] }),
];`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Wire up with useApiTable + TanStack Query:
            </Text>
            <code className="block whitespace-pre rounded bg-muted p-2 text-xs">
              {`const { tableState, onStateChange, queryParams } = useApiTable({
  defaultPageSize: 10,
  defaultSort: { id: 'createdAt', desc: true },
});

const { data, isLoading, error } = useMyQuery(queryParams);

<Table
  tableId="my-table"
  data={data?.data ?? []}
  columns={myColumns}
  totalRows={data?.pagination.total ?? 0}
  isLoading={isLoading}
  error={error?.message}
  onStateChange={onStateChange}
/>`}
            </code>
          </div>
          <div>
            <Text as="p" className="mb-1" styleProps={{ weight: 'medium' }}>
              Available column helpers:
            </Text>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>text</strong> — plain text with optional custom cell renderer
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>number</strong> — numeric with optional format function
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>date</strong> — date/time with Intl.DateTimeFormat (en-GB)
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>status</strong> — colour-coded badge via statusMap
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>tags</strong> — array as small badges with overflow count
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>duration</strong> — seconds as M:SS format
                </Text>
              </li>
              <li>
                <Text styleProps={{ size: 'xs' }}>
                  <strong>actions</strong> — row action icon buttons with hidden/disabled
                </Text>
              </li>
            </ul>
          </div>
        </div>
      </DeveloperInstructions>
    </ComponentPageWrapper>
  );
};

// ============================================================================
// Basic Table Demo
// ============================================================================

const BasicTableDemo: React.FC = () => {
  const [, setTableState] = useState<TableState>({
    page: 1,
    pageSize: 10,
    sortDirection: 'asc',
  });

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Basic table with text, status badge, duration, and date columns. Click column headers to
        sort.
      </Text>
      <Table
        tableId="demo-basic"
        data={SAMPLE_VIDEOS}
        columns={basicColumns}
        totalRows={SAMPLE_VIDEOS.length}
        isLoading={false}
        onStateChange={setTableState}
        defaultSort={{ id: 'title', desc: false }}
      />
    </div>
  );
};

// ============================================================================
// Full Features Demo
// ============================================================================

const FullFeaturesDemo: React.FC = () => {
  const [, setTableState] = useState<TableState>({
    page: 1,
    pageSize: 10,
    sortDirection: 'asc',
  });

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Full-featured table with all column types: text, status, duration, tags (with overflow),
        date, and row actions. Use the Columns button to toggle column visibility.
      </Text>
      <Table
        tableId="demo-full"
        data={SAMPLE_VIDEOS}
        columns={fullColumns}
        totalRows={SAMPLE_VIDEOS.length}
        isLoading={false}
        onStateChange={setTableState}
        defaultSort={{ id: 'createdAt', desc: true }}
        defaultColumnVisibility={{ movementType: false }}
      />
    </div>
  );
};

// ============================================================================
// States Demo
// ============================================================================

const StatesDemo: React.FC = () => {
  const [, setTableState] = useState<TableState>({
    page: 1,
    pageSize: 10,
    sortDirection: 'asc',
  });

  return (
    <div className="space-y-8">
      <div>
        <Text as="p" styleProps={{ weight: 'medium' }} className="mb-2">
          Loading State
        </Text>
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-4">
          Skeleton rows displayed while data is being fetched.
        </Text>
        <Table
          tableId="demo-loading"
          data={[]}
          columns={basicColumns}
          totalRows={0}
          isLoading
          onStateChange={setTableState}
        />
      </div>

      <div>
        <Text as="p" styleProps={{ weight: 'medium' }} className="mb-2">
          Empty State
        </Text>
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-4">
          Default message when no results are found.
        </Text>
        <Table
          tableId="demo-empty"
          data={[]}
          columns={basicColumns}
          totalRows={0}
          isLoading={false}
          onStateChange={setTableState}
        />
      </div>

      <div>
        <Text as="p" styleProps={{ weight: 'medium' }} className="mb-2">
          Custom Empty State
        </Text>
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-4">
          Custom content for domain-specific empty messages.
        </Text>
        <Table
          tableId="demo-empty-custom"
          data={[]}
          columns={basicColumns}
          totalRows={0}
          isLoading={false}
          onStateChange={setTableState}
          emptyState={
            <div className="space-y-2">
              <Text as="p" styleProps={{ weight: 'medium', colour: 'muted-foreground' }}>
                No videos uploaded yet
              </Text>
              <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                Upload your first video to get started.
              </Text>
            </div>
          }
        />
      </div>

      <div>
        <Text as="p" styleProps={{ weight: 'medium' }} className="mb-2">
          Error State
        </Text>
        <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }} className="mb-4">
          Error message with retry button.
        </Text>
        <Table
          tableId="demo-error"
          data={[]}
          columns={basicColumns}
          totalRows={0}
          isLoading={false}
          error="Failed to load videos. Please check your connection and try again."
          onStateChange={setTableState}
          onRetry={() => {
            alert('Retry clicked');
          }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// Controls Demo
// ============================================================================

const STATUS_FILTER_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
];

const DIFFICULTY_FILTER_OPTIONS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const CONTROLS_FILTERS: TableFilterConfig[] = [
  { key: 'status', label: 'Status', options: STATUS_FILTER_OPTIONS },
  { key: 'difficulty', label: 'Difficulty', options: DIFFICULTY_FILTER_OPTIONS },
];

const ControlsDemo: React.FC = () => {
  const {
    tableState,
    onStateChange,
    search,
    onSearchChange,
    filterValues,
    onFilterChange,
    clearAll,
    hasActiveControls,
    debouncedSearch,
    debouncedFilters,
  } = useApiTable({
    defaultPageSize: 10,
    defaultSort: { id: 'createdAt', desc: true },
  });

  // Client-side filtering for demo purposes
  const filteredData = useMemo(() => {
    let result = PAGINATION_VIDEOS;

    if (debouncedSearch) {
      const lower = debouncedSearch.toLowerCase();
      result = result.filter((row) => row.title.toLowerCase().includes(lower));
    }

    const statusFilter = debouncedFilters.status;

    if (statusFilter && statusFilter !== '') {
      result = result.filter((row) => row.status === statusFilter);
    }

    const difficultyFilter = debouncedFilters.difficulty;

    if (difficultyFilter && difficultyFilter !== '') {
      result = result.filter((row) => row.difficulty === difficultyFilter);
    }

    return result;
  }, [debouncedSearch, debouncedFilters]);

  // Client-side pagination
  const start = (tableState.page - 1) * tableState.pageSize;
  const end = start + tableState.pageSize;
  const paginatedData = filteredData.slice(start, end);

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Table with search input, filter dropdowns (Status, Difficulty), column visibility toggle,
        and Clear All button. All controls are debounced and reset to page 1 on change.
      </Text>
      <Table
        tableId="demo-controls"
        data={paginatedData}
        columns={fullColumns}
        totalRows={filteredData.length}
        isLoading={false}
        onStateChange={onStateChange}
        defaultSort={{ id: 'createdAt', desc: true }}
        defaultColumnVisibility={{ movementType: false }}
        renderControls={(cols) => (
          <TableControls
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search videos..."
            filters={CONTROLS_FILTERS}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            columns={cols}
            onClearAll={clearAll}
            hasActiveControls={hasActiveControls}
          />
        )}
      />
    </div>
  );
};

// ============================================================================
// Pagination Demo
// ============================================================================

const PAGINATION_VIDEOS: VideoRow[] = [
  ...SAMPLE_VIDEOS,
  {
    id: '6',
    title: 'Lower Back Mobilisation',
    status: 'active',
    difficulty: 'intermediate',
    movementType: 'mobility',
    durationSeconds: 360,
    bodyParts: ['lower back', 'hips'],
    tags: ['mobility', 'recovery'],
    createdAt: '2026-01-20T08:00:00Z',
  },
  {
    id: '7',
    title: 'Quad Stretch Sequence',
    status: 'active',
    difficulty: 'beginner',
    movementType: 'stretch',
    durationSeconds: 200,
    bodyParts: ['quads', 'hips'],
    tags: ['stretch', 'warm-up'],
    createdAt: '2026-01-25T12:00:00Z',
  },
  {
    id: '8',
    title: 'Thoracic Spine Rotation',
    status: 'draft',
    difficulty: 'intermediate',
    movementType: 'mobility',
    durationSeconds: 270,
    bodyParts: ['upper back', 'shoulders'],
    tags: ['mobility', 'posture'],
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: '9',
    title: 'Calf Raise Progression',
    status: 'active',
    difficulty: 'advanced',
    movementType: 'strength',
    durationSeconds: 480,
    bodyParts: ['calves', 'ankles'],
    tags: ['strength', 'progressive'],
    createdAt: '2026-02-05T15:30:00Z',
  },
  {
    id: '10',
    title: 'Wrist and Forearm Release',
    status: 'active',
    difficulty: 'beginner',
    movementType: 'stretch',
    durationSeconds: 150,
    bodyParts: ['wrists', 'forearms'],
    tags: ['desk-friendly', 'gentle'],
    createdAt: '2026-02-10T09:00:00Z',
  },
  {
    id: '11',
    title: 'Glute Bridge Series',
    status: 'active',
    difficulty: 'intermediate',
    movementType: 'strength',
    durationSeconds: 540,
    bodyParts: ['glutes', 'hips', 'core'],
    tags: ['strength', 'stability'],
    createdAt: '2026-02-18T14:00:00Z',
  },
  {
    id: '12',
    title: 'Hamstring Flexibility Flow',
    status: 'draft',
    difficulty: 'beginner',
    movementType: 'stretch',
    durationSeconds: 320,
    bodyParts: ['hamstrings', 'lower back'],
    tags: ['flexibility', 'recovery'],
    createdAt: '2026-02-22T11:00:00Z',
  },
  {
    id: '13',
    title: 'Rotator Cuff Strengthening',
    status: 'active',
    difficulty: 'advanced',
    movementType: 'strength',
    durationSeconds: 450,
    bodyParts: ['shoulders'],
    tags: ['rehabilitation', 'strength'],
    createdAt: '2026-02-28T16:00:00Z',
  },
  {
    id: '14',
    title: 'Knee Stability Drills',
    status: 'archived',
    difficulty: 'intermediate',
    movementType: 'rehabilitation',
    durationSeconds: 390,
    bodyParts: ['knees', 'quads'],
    tags: ['rehabilitation', 'stability'],
    createdAt: '2025-11-15T10:00:00Z',
  },
  {
    id: '15',
    title: 'Full Body Cool Down',
    status: 'active',
    difficulty: 'beginner',
    movementType: 'stretch',
    durationSeconds: 600,
    bodyParts: ['full body'],
    tags: ['cool-down', 'gentle', 'recovery'],
    createdAt: '2026-03-05T17:00:00Z',
  },
  {
    id: '16',
    title: 'Plank Variations',
    status: 'active',
    difficulty: 'advanced',
    movementType: 'strength',
    durationSeconds: 720,
    bodyParts: ['core', 'shoulders', 'glutes'],
    tags: ['strength', 'progressive'],
    createdAt: '2026-03-07T08:30:00Z',
  },
];

const PaginationDemo: React.FC = () => {
  const [tableState, setTableState] = useState<TableState>({
    page: 1,
    pageSize: 2,
    sortDirection: 'asc',
  });

  // Simulate server-side pagination with client-side slicing
  const start = (tableState.page - 1) * tableState.pageSize;
  const end = start + tableState.pageSize;
  const paginatedData = PAGINATION_VIDEOS.slice(start, end);

  return (
    <div className="space-y-4">
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        Pagination with {PAGINATION_VIDEOS.length} items at page size 2 to demonstrate truncated
        page navigation with ellipsis. Navigate to middle pages to see the sliding window.
      </Text>
      <Table
        tableId="demo-pagination"
        data={paginatedData}
        columns={basicColumns}
        totalRows={PAGINATION_VIDEOS.length}
        isLoading={false}
        onStateChange={setTableState}
        defaultPageSize={2}
        pageSizeOptions={[2, 5, 10]}
      />
    </div>
  );
};
