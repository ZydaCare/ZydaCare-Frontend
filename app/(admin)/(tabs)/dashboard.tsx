import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/authContext';
import { DashboardOverview } from '@/components/admin/DashboardOverview';
import { SupportAdminView } from '@/components/admin/SupportAdminView';
import { useEffect, useState } from 'react';

export default function DashboardScreen() {
   const { user, isLoading, isAuthenticated, getMe } = useAuth();
   const [loadingProfile, setLoadingProfile] = useState(false);

    useEffect(() => {
       const fetchProfile = async () => {
         if (!user) {
           setLoadingProfile(true)
           try {
             await getMe()
           } finally {
             setLoadingProfile(false)
           }
         }
       }
       fetchProfile()
     }, [user])

  // if (loadingProfile) {
  //   return (
  //     <View className="flex-1 bg-white items-center justify-center">
  //       <ActivityIndicator size="large" color="#67A9AF" />
  //     </View>
  //   );
  // }

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
          <ActivityIndicator size="large" color="#67A9AF" />
        </View>
      )}
    </View>
  );
}