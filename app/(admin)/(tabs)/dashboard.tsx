import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/authContext';
import { DashboardOverview } from '@/components/admin/DashboardOverview';
import { SupportAdminView } from '@/components/admin/SupportAdminView';

export default function DashboardScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Check if user is support admin
  const isSupportAdmin = user?.role === 'support_admin';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <View className="flex-1 bg-white">
      {isSupportAdmin ? (
        <SupportAdminView />
      ) : isAdmin ? (
        <DashboardOverview />
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}

      {/* <View className='h-20' /> */}
    </View>
  );
}