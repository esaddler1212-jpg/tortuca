/** Settings synced to the server for digest, push, and commute. */
export interface SyncedUserSettings {
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  briefingHour: number;
  commuteMinutes: number;
  arriveBufferMinutes: number;
  schoolStartTime: string;
  schoolName: string;
  schoolGrade: "6" | "78";
  eveningWrapHour: number;
  weeklyReviewHour: number;
  homeAddress: string;
  schoolAddress: string;
  useLiveCommute: boolean;
  morningDigestEnabled: boolean;
  pushNotificationsEnabled: boolean;
  wakeTime: string;
  morningWorkoutDeadlineHour: number;
  fitnessSuggestTime: string;
  targetSleepHours: number;
  windDownMinutes: number;
  morningRoutineMinutes: number;
  weekendWakeTime: string;
}

export type WorkoutType = "arms" | "body" | "legs" | "cardio";

export interface SyncedFitnessLog {
  id: string;
  type: WorkoutType;
  date: string;
  loggedAt: string;
  slot: "morning" | "afternoon" | "evening";
}

export interface SyncedTodo {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface SyncedShoppingItem {
  id: string;
  name: string;
  inPantry: boolean;
  createdAt: string;
}

/** Plan progress (see shared/plan.ts PlanState); synced across devices. */
export interface SyncedPlanState {
  done: Record<string, string>;
  hidden: string[];
  customTasks: unknown[];
  goals: unknown[] | null;
  sparkLog: Record<string, { done?: string; shuffle?: number; note?: string }>;
  handoffs: Record<string, { status: string; at: string }>;
  budget: { monthly: number; items: { id: string; name: string; amount: number }[] };
  updatedAt: string;
}

export interface AlfredUserData {
  settings?: SyncedUserSettings;
  todos?: SyncedTodo[];
  pushSubscription?: PushSubscriptionPayload | null;
  lastDigestDate?: string;
  lastLeaveReminderKey?: string;
  lastUrgentReminderKey?: string;
  lastWindDownReminderKey?: string;
  fitnessLogs?: SyncedFitnessLog[];
  shoppingList?: SyncedShoppingItem[];
  plan?: SyncedPlanState;
  updatedAt: string;
}
