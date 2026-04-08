import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useUserStore } from '@/stores/useUserStore';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);
  const notificationResponseListener = useRef<Notifications.Subscription>();
  const updatePreferences = useUserStore((s) => s.updatePreferences);
  const preferences = useUserStore((s) => s.preferences);

  // Check current permission status on mount
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setIsEnabled(status === 'granted');
    })();
  }, []);

  // Handle notification responses (taps)
  useEffect(() => {
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        if (data?.screen === 'mood') {
          router.push('/mood');
        } else if (data?.screen === 'chat') {
          router.push('/');
        }
      });

    return () => {
      if (notificationResponseListener.current) {
        Notifications.removeNotificationSubscription(
          notificationResponseListener.current
        );
      }
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      setIsEnabled(true);
      updatePreferences({ notificationsEnabled: true });
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    setIsEnabled(granted);
    updatePreferences({ notificationsEnabled: granted });
    return granted;
  }, [updatePreferences]);

  const updateSchedule = useCallback(
    async (hour: number): Promise<void> => {
      // Cancel all existing scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (!isEnabled) return;

      // Schedule daily check-in notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Check-in',
          body: 'How are you feeling today? Take a moment to log your mood.',
          data: { screen: 'mood' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: 0,
        },
      });

      const timeStr = `${String(hour).padStart(2, '0')}:00`;
      updatePreferences({ dailyCheckInTime: timeStr });
    },
    [isEnabled, updatePreferences]
  );

  return {
    isEnabled,
    requestPermission,
    updateSchedule,
  };
}
