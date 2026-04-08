import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { COUNSELOR_NAME } from '@/constants/config';

// ---------------------------------------------------------------------------
// Task & channel identifiers
// ---------------------------------------------------------------------------

const FOLLOW_UP_TASK = 'SESSION_FOLLOW_UP_TASK';
const DAILY_CHECK_IN_ID = 'daily-mood-check-in';
const WEEKLY_SUMMARY_ID = 'weekly-summary';
const ANDROID_CHANNEL_ID = 'dr-sage-reminders';

// ---------------------------------------------------------------------------
// Initialise notification handler (call once from app root)
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowInForeground: true,
  }),
});

// ---------------------------------------------------------------------------
// Permission
// ---------------------------------------------------------------------------

/**
 * Request notification permissions from the user.
 * Returns true if granted, false otherwise.
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: `${COUNSELOR_NAME} Reminders`,
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  return status === 'granted';
}

// ---------------------------------------------------------------------------
// Daily mood check-in
// ---------------------------------------------------------------------------

/**
 * Schedule a repeating daily notification at a given local time.
 * Cancels any previous daily check-in before scheduling.
 */
export async function scheduleDailyCheckIn(
  hour: number,
  minute: number,
): Promise<void> {
  // Remove existing before re-scheduling
  await Notifications.cancelScheduledNotificationAsync(DAILY_CHECK_IN_ID).catch(
    () => {},
  );

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_CHECK_IN_ID,
    content: {
      title: `${COUNSELOR_NAME} Check-in`,
      body: 'How are you feeling today? Take a moment to log your mood.',
      data: { type: 'daily_check_in', screen: 'mood/entry' },
      ...(Platform.OS === 'android' && { channelId: ANDROID_CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

// ---------------------------------------------------------------------------
// Session follow-up (24 hours after a session)
// ---------------------------------------------------------------------------

/**
 * Schedule a one-time notification 24 hours from now, reminding the user to
 * reflect on or continue a session.
 */
export async function scheduleSessionFollowUp(
  sessionId: string,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${COUNSELOR_NAME} Follow-up`,
      body: "It's been a day since your last session. Want to check in on how you're feeling?",
      data: {
        type: 'session_follow_up',
        sessionId,
        screen: `chat/${sessionId}`,
      },
      ...(Platform.OS === 'android' && { channelId: ANDROID_CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 24 * 60 * 60, // 24 hours
    },
  });
}

// ---------------------------------------------------------------------------
// Weekly summary (Sunday)
// ---------------------------------------------------------------------------

/**
 * Schedule a weekly notification every Sunday at 10:00 AM local time.
 */
export async function scheduleWeeklySummary(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(WEEKLY_SUMMARY_ID).catch(
    () => {},
  );

  await Notifications.scheduleNotificationAsync({
    identifier: WEEKLY_SUMMARY_ID,
    content: {
      title: `${COUNSELOR_NAME} Weekly Summary`,
      body: 'Your weekly wellness summary is ready. See how your week went!',
      data: { type: 'weekly_summary', screen: 'mood/history' },
      ...(Platform.OS === 'android' && { channelId: ANDROID_CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday (Expo uses 1 = Sunday)
      hour: 10,
      minute: 0,
    },
  });
}

// ---------------------------------------------------------------------------
// Cancel everything
// ---------------------------------------------------------------------------

/**
 * Remove all scheduled (future) local notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ---------------------------------------------------------------------------
// Response handler (deep linking)
// ---------------------------------------------------------------------------

/**
 * Handle a user tapping on a notification. Routes to the appropriate screen.
 */
export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): void {
  const data = response.notification.request.content.data as
    | Record<string, string>
    | undefined;

  if (!data?.screen) return;

  try {
    router.push(data.screen as any);
  } catch {
    // Fallback -- navigate to home if the route is invalid
    router.push('/');
  }
}

/**
 * Register the notification response listener. Call once in the root layout.
 * Returns a cleanup function to remove the listener.
 */
export function registerNotificationResponseListener(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse,
  );
  return () => subscription.remove();
}

// ---------------------------------------------------------------------------
// Background task registration (for follow-up scheduling)
// ---------------------------------------------------------------------------

TaskManager.defineTask(FOLLOW_UP_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[notifications] Follow-up background task error:', error);
    return;
  }

  const taskData = data as { sessionId?: string } | undefined;
  if (taskData?.sessionId) {
    await scheduleSessionFollowUp(taskData.sessionId);
  }
});

/**
 * Check whether the background follow-up task is registered.
 */
export async function isFollowUpTaskRegistered(): Promise<boolean> {
  return TaskManager.isTaskRegisteredAsync(FOLLOW_UP_TASK);
}
