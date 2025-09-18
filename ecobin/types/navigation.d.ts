// navigation.d.ts

export type RootStackParamList = {
  Home: undefined;
  NotificationScreen: undefined;
  ProfileScreen: undefined;
  MapScreen: undefined;
  BinDetailScreen: { binId: string };
  ActivityDetailsScreen: { binId: string; activityLog?: string; isReadOnly?: string };
};

// Optional: Add global declaration to use navigation types globally
declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList { }
    }
}
