// Web fallback — expo-haptics is native-only. All taps are no-ops on web.

export const lightTap = async (): Promise<void> => {};
export const mediumTap = async (): Promise<void> => {};
export const successNotification = async (): Promise<void> => {};
export const errorNotification = async (): Promise<void> => {};
export const selectionChanged = async (): Promise<void> => {};
