import * as Haptics from 'expo-haptics';

/**
 * Light tactile feedback for minor interactions (e.g. toggling a switch).
 */
export const lightTap = async (): Promise<void> => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Medium tactile feedback for standard interactions (e.g. pressing a button).
 */
export const mediumTap = async (): Promise<void> => {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

/**
 * Success notification haptic (e.g. mood entry saved, message sent).
 */
export const successNotification = async (): Promise<void> => {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * Error notification haptic (e.g. validation failure, network error).
 */
export const errorNotification = async (): Promise<void> => {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

/**
 * Selection changed haptic (e.g. scrolling through mood levels, picker changes).
 */
export const selectionChanged = async (): Promise<void> => {
  await Haptics.selectionAsync();
};
