// Web no-op shim for expo-haptics. Aliased via metro.config.js on web only.

export const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy' } as const;
export const NotificationFeedbackType = { Success: 'success', Warning: 'warning', Error: 'error' } as const;

export const impactAsync = async (_style?: unknown): Promise<void> => {};
export const notificationAsync = async (_type?: unknown): Promise<void> => {};
export const selectionAsync = async (): Promise<void> => {};
