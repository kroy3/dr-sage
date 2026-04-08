export type RootRouteParams = {
  '(tabs)': undefined;
  'onboarding': undefined;
};

export type TabRouteParams = {
  index: undefined;
  library: undefined;
  mood: undefined;
  profile: undefined;
};

export type ChatRouteParams = {
  'chat/[sessionId]': { sessionId: string };
};

export type LibraryRouteParams = {
  'library/[category]': { category: string };
  'library/[category]/[itemId]': { category: string; itemId: string };
};

export type MoodRouteParams = {
  'mood/history': undefined;
  'mood/entry': { entryId?: string };
};

export type AllRouteParams = RootRouteParams &
  TabRouteParams &
  ChatRouteParams &
  LibraryRouteParams &
  MoodRouteParams;
