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

export interface AlfredUserData {
  settings?: SyncedUserSettings;
  todos?: SyncedTodo[];
  pushSubscription?: PushSubscriptionPayload | null;
  lastDigestDate?: string;
  lastLeaveReminderKey?: string;
  lastUrgentReminderKey?: string;
  updatedAt: string;
}
