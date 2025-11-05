# Task Assignment System

## Overview
This system allows MC (supervisors) to assign tasks to PC (field workers) for specific stores. PC users can only check in to stores that have tasks assigned to them for the current day.

## Features
- **Task Types**: OSA, SPECIAL_DISPLAY, SURVEY
- **Role-Based Access**: MC assigns, PC executes
- **Eligibility-Based Check-in**: PCs can only check in to stores with active tasks
- **Task Status Workflow**: ASSIGNED → IN_PROGRESS → SUBMITTED → COMPLETED → APPROVED/REJECTED

## Database Schema

### Tables

#### `task_batches`
Represents a batch of tasks assigned by MC to a PC for a specific store.

```sql
CREATE TABLE task_batches (
  id UUID PRIMARY KEY,
  assigned_by_mc_id UUID REFERENCES users(id),
  assigned_to_pc_id UUID REFERENCES users(id),
  store_id TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### `tasks`
Individual tasks within a batch.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  batch_id UUID REFERENCES task_batches(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('OSA', 'SPECIAL_DISPLAY', 'SURVEY')),
  title TEXT NOT NULL,
  description TEXT,
  store_id TEXT NOT NULL,
  task_date DATE,  -- For daily tasks
  active_from TIMESTAMPTZ,  -- Alternative: active window
  active_to TIMESTAMPTZ,
  due_date DATE,
  attachments JSONB DEFAULT '[]',
  status TEXT CHECK (status IN ('ASSIGNED','IN_PROGRESS','SUBMITTED','COMPLETED','APPROVED','REJECTED')),
  assigned_by_mc_id UUID REFERENCES users(id),
  assigned_to_pc_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## API Endpoints

### PC Endpoints

#### `GET /api/pc/checkin-eligibility`
Get stores eligible for check-in today.

**Response:**
```json
{
  "status": "success",
  "data": {
    "date": "2025-01-10",
    "eligibleStores": [
      {
        "storeId": "STORE123",
        "storeName": "Store Name",
        "location": {...},
        "tasks": [
          {
            "id": "uuid",
            "type": "OSA",
            "title": "Check product availability",
            "status": "ASSIGNED",
            "taskDate": "2025-01-10"
          }
        ]
      }
    ],
    "totalStores": 1,
    "totalTasks": 1
  }
}
```

#### `GET /api/pc/dashboard`
Get all tasks grouped by status.

#### `PATCH /api/tasks/:id/status`
Update task status (PC can set: IN_PROGRESS, SUBMITTED, COMPLETED).

**Body:**
```json
{
  "status": "IN_PROGRESS"
}
```

### MC Endpoints

#### `POST /api/task-batches`
Create a new task batch.

**Body:**
```json
{
  "assignedToPcId": "uuid",
  "storeId": "STORE123",
  "note": "Optional note",
  "tasks": [
    {
      "type": "OSA",
      "title": "Check product availability",
      "description": "Check all products on shelf",
      "taskDate": "2025-01-10",
      "dueDate": "2025-01-10"
    },
    {
      "type": "SPECIAL_DISPLAY",
      "title": "Setup endcap display",
      "taskDate": "2025-01-10"
    }
  ]
}
```

#### `GET /api/task-batches`
Get all batches created by the MC.

#### `GET /api/task-batches/:id`
Get batch details with all tasks.

## Eligibility Logic

A store is "check-in eligible" for a PC when:
1. The PC has at least one task assigned for today (task_date = today in Asia/Bangkok timezone)
2. OR the task has an active window that overlaps with the current time

**SQL Logic:**
```sql
WHERE assigned_to_pc_id = :pcUserId
  AND status IN ('ASSIGNED', 'IN_PROGRESS')
  AND (
    task_date = CURRENT_DATE  -- Daily task for today
    OR (NOW() BETWEEN active_from AND active_to)  -- Active window
  )
```

## Status Workflow

```
ASSIGNED (MC creates task)
  ↓
IN_PROGRESS (PC starts work)
  ↓
SUBMITTED (PC submits for review)
  ↓
COMPLETED (PC marks as done)
  ↓
APPROVED / REJECTED (MC reviews)
```

**Permission Matrix:**
- PC can set: `IN_PROGRESS`, `SUBMITTED`, `COMPLETED`
- MC can set: `APPROVED`, `REJECTED`

## Usage Examples

### MC: Assign Tasks
```javascript
const batch = {
  assignedToPcId: "pc-user-uuid",
  storeId: "STORE123",
  note: "Please complete today",
  tasks: [
    {
      type: "OSA",
      title: "Product Availability Check",
      taskDate: "2025-01-10",
    },
    {
      type: "SURVEY",
      title: "Store Manager Survey",
      taskDate: "2025-01-10",
    }
  ]
};

await taskBatchAPI.create(batch);
```

### PC: Check Eligible Stores
```javascript
const { eligibleStores } = await taskAPI.getCheckinEligibility();
// Returns only stores with tasks for today
```

### PC: Update Task Status
```javascript
await taskAPI.updateStatus(taskId, 'IN_PROGRESS');
```

## Migration

Run the migration:
```bash
psql $DATABASE_URL < backend/migrations/003_task_management.sql
```

## Frontend Integration

### Index Page (PC)
- Shows only stores with tasks assigned for today
- Empty state: "No tasks for today. Waiting for assignment."
- Each store card shows task type badges (OSA, Display, Survey)
- Check-in button disabled if no eligible tasks

### Task Assignment Page (MC)
- Select PC user
- Select store
- Add multiple tasks with types
- Set task dates or active windows

## Timezone

All date calculations use **Asia/Bangkok** timezone to ensure consistency across the system.

## Testing

1. **MC assigns tasks**: POST /api/task-batches
2. **PC checks eligibility**: GET /api/pc/checkin-eligibility (should see assigned stores)
3. **PC checks in**: POST /api/store-visits/check-in (only works for eligible stores)
4. **PC updates status**: PATCH /api/tasks/:id/status
5. **MC approves**: PATCH /api/tasks/:id/status with APPROVED

## Notes

- Tasks are organized in batches for easier management
- Deleting a batch cascades to delete all its tasks
- Task types are strictly validated (OSA, SPECIAL_DISPLAY, SURVEY)
- Map stays persistent and synchronized across all screens
