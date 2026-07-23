import 'server-only'
import { getAdminSupabase } from '@ecs/shared/server'

export interface Task {
  id: string
  title: string
  done: boolean
  due_at: string | null
  created_at: string
}

export interface Tracker {
  id: string
  label: string
  value: number
  unit: string | null
  category: string | null
  updated_at: string
}

// ---------------------------------------------------------------------------
// In-memory fallback (used when Supabase is not configured). Keeps the daily
// brief fully functional offline; resets when the dev server restarts.
// ---------------------------------------------------------------------------
const now = () => new Date().toISOString()

const memoryTasks: Task[] = [
  {
    id: 'seed-task-1',
    title: 'Approve pending Easy Supply orders',
    done: false,
    due_at: null,
    created_at: '2026-07-23T08:00:00.000Z',
  },
  {
    id: 'seed-task-2',
    title: 'Finish mixing “North Star” demo',
    done: false,
    due_at: null,
    created_at: '2026-07-23T08:05:00.000Z',
  },
  {
    id: 'seed-task-3',
    title: 'Reply to collaboration inquiries',
    done: true,
    due_at: null,
    created_at: '2026-07-22T18:05:00.000Z',
  },
]

const memoryTrackers: Tracker[] = [
  { id: 'trk-songs', label: 'Songs written', value: 3, unit: 'songs', category: 'creative', updated_at: now() },
  { id: 'trk-sessions', label: 'Studio sessions', value: 2, unit: 'sessions', category: 'creative', updated_at: now() },
  { id: 'trk-workouts', label: 'Workouts', value: 1, unit: 'days', category: 'health', updated_at: now() },
]

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

// --- Tasks -----------------------------------------------------------------
export async function listTasks(): Promise<Task[]> {
  const supabase = getAdminSupabase()
  if (!supabase) {
    return [...memoryTasks].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as Task[]
}

export async function createTask(title: string, dueAt?: string): Promise<Task> {
  const task: Task = {
    id: uid(),
    title,
    done: false,
    due_at: dueAt ?? null,
    created_at: now(),
  }
  const supabase = getAdminSupabase()
  if (!supabase) {
    memoryTasks.unshift(task)
    return task
  }
  const { data, error } = await supabase
    .from('tasks')
    .insert({ title: task.title, due_at: task.due_at })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Task
}

export async function setTaskDone(id: string, done: boolean): Promise<Task | null> {
  const supabase = getAdminSupabase()
  if (!supabase) {
    const task = memoryTasks.find((t) => t.id === id)
    if (!task) return null
    task.done = done
    return task
  }
  const { data, error } = await supabase
    .from('tasks')
    .update({ done })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Task
}

// --- Trackers --------------------------------------------------------------
export async function listTrackers(): Promise<Tracker[]> {
  const supabase = getAdminSupabase()
  if (!supabase) return [...memoryTrackers]
  const { data, error } = await supabase
    .from('trackers')
    .select('*')
    .order('label', { ascending: true })
  if (error || !data) return []
  return data as Tracker[]
}

export async function createTracker(
  label: string,
  unit?: string,
  category?: string,
): Promise<Tracker> {
  const tracker: Tracker = {
    id: uid(),
    label,
    value: 0,
    unit: unit ?? null,
    category: category ?? null,
    updated_at: now(),
  }
  const supabase = getAdminSupabase()
  if (!supabase) {
    memoryTrackers.push(tracker)
    return tracker
  }
  const { data, error } = await supabase
    .from('trackers')
    .insert({ label: tracker.label, unit: tracker.unit, category: tracker.category })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Tracker
}

export async function adjustTracker(id: string, delta: number): Promise<Tracker | null> {
  const supabase = getAdminSupabase()
  if (!supabase) {
    const tracker = memoryTrackers.find((t) => t.id === id)
    if (!tracker) return null
    tracker.value = Math.max(0, tracker.value + delta)
    tracker.updated_at = now()
    return tracker
  }
  // Read-modify-write (fine for a single-user personal dashboard).
  const { data: current, error: readErr } = await supabase
    .from('trackers')
    .select('value')
    .eq('id', id)
    .single()
  if (readErr) throw new Error(readErr.message)
  const nextValue = Math.max(0, ((current as { value: number }).value ?? 0) + delta)
  const { data, error } = await supabase
    .from('trackers')
    .update({ value: nextValue, updated_at: now() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Tracker
}
