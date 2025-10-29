import { getDoctors } from '@/api/admin/doctors';
import { getPatients } from '@/api/admin/patients';
import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    createdAt: string;
    role?: string;
    profileImage?: string | null;
    speciality?: string;
    status?: string;
    isVerified?: boolean;
    phoneNumber?: string;
}

interface UserItemProps {
    user: User;
    type: 'doctor' | 'patient';
    onPress: (id: string, type: string) => void;
}

interface StatCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string | number;
    color: string;
    bgColor: string;
}

const StatCard = ({ icon, label, value, color, bgColor }: StatCardProps) => (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
        <View style={[styles.statIconContainer, { backgroundColor: color }]}>
            <Ionicons name={icon} size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.statValue} className='font-sans'>{value}</Text>
        <Text style={styles.statLabel} className='font-sans-medium'>{label}</Text>
    </View>
);

const UserItem = ({ user, type, onPress }: UserItemProps) => {
    const getProfileImage = () => {
        if (user.profileImage) {
            return { uri: user.profileImage };
        }
        return null;
    };

    return (
        <TouchableOpacity
            style={styles.userCard}
            onPress={() => onPress(user._id, type)}
            activeOpacity={0.7}
        >
            <View style={styles.userCardContent}>
                <View style={styles.userLeftSection}>
                    <View style={styles.avatarContainer}>
                        {getProfileImage() ? (
                            <Image 
                                source={getProfileImage()} 
                                style={styles.avatarImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.avatarFallback, type === 'doctor' ? styles.doctorAvatar : styles.patientAvatar]}>
                                <Ionicons
                                    name={type === 'doctor' ? 'medical' : 'person'}
                                    size={24}
                                    color="#FFFFFF"
                                />
                            </View>
                        )}
                        <View style={[
                            styles.statusIndicator,
                            { backgroundColor: user.isActive ? '#10B981' : '#EF4444' }
                        ]} />
                    </View>
                    <View style={styles.userDetails}>
                        <View style={styles.nameRow}>
                            <Text style={styles.userName} className='font-sans-medium'>
                                {user.firstName} {user.lastName}
                            </Text>
                            {user.role === 'doctor' && user.isVerified && (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                </View>
                            )}
                        </View>
                        {user.role === 'doctor' && user.speciality && (
                            <Text style={styles.speciality} className='font-sans'>{user.speciality}</Text>
                        )}
                        <Text style={styles.userEmail} numberOfLines={1} className='font-sans-medium'>{user.email}</Text>
                        <View style={styles.metaRow}>
                            <View style={styles.badge}>
                                <Text style={[styles.badgeText, { color: user.isActive ? '#059669' : '#DC2626' }]} className='font-sans'>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </Text>
                            </View>
                            {user.role === 'doctor' && user.status && (
                                <View style={[styles.badge, styles.statusBadge]}>
                                    <Text style={styles.statusText} className='font-sans'>{user.status}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
                <View style={styles.chevronContainer}>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
            </View>
        </TouchableOpacity>
    );
};

export function SupportAdminView({ onUserPress }: { onUserPress?: (id: string, type: string) => void }) {
    const [activeTab, setActiveTab] = useState<'doctors' | 'patients'>('doctors');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const { user } = useAuth();

    const fetchUsers = useCallback(async (tabType: 'doctors' | 'patients', pageNum: number, isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const fetchFn = tabType === 'doctors' ? getDoctors : getPatients;
            const response = await fetchFn({ limit: 15, page: pageNum });

            let newUsers: User[] = [];
            if (tabType === 'doctors') {
                const doctorsData = Array.isArray(response) ? response : [];
                newUsers = doctorsData.map((doc: any) => ({
                    _id: doc._id,
                    firstName: doc.fullName?.split(' ')[0] || 'Doctor',
                    lastName: doc.fullName?.split(' ').slice(1).join(' ') || 'User',
                    email: doc.email || doc.user?.email || '',
                    isActive: doc.user?.isActive ?? true,
                    createdAt: doc.createdAt || new Date().toISOString(),
                    role: 'doctor',
                    speciality: doc.speciality || 'General Practitioner',
                    profileImage: doc.profile?.profileImage?.url || null,
                    status: doc.status || 'pending',
                    isVerified: doc.isVerified || false,
                    phoneNumber: doc.phoneNumber || ''
                }));
            } else {
                const patientsData = Array.isArray(response) ? response : [];
                newUsers = patientsData.map((patient: any) => ({
                    _id: patient._id,
                    firstName: patient.firstName || 'Patient',
                    lastName: patient.lastName || 'User',
                    email: patient.email || '',
                    isActive: patient.isActive ?? true,
                    createdAt: patient.createdAt || new Date().toISOString(),
                    role: 'patient',
                    profileImage: patient.profileImage?.url || null
                }));
            }

            if (isRefresh || pageNum === 1) {
                setUsers(newUsers);
                setFilteredUsers(newUsers);
            } else {
                setUsers(prev => [...prev, ...newUsers]);
                setFilteredUsers(prev => [...prev, ...newUsers]);
            }

            setHasMore(newUsers.length === 15);
        } catch (err) {
            console.error(err);
            setError('Failed to load users. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        setPage(1);
        setUsers([]);
        setFilteredUsers([]);
        setSearchQuery('');
        fetchUsers(activeTab, 1);
    }, [activeTab, fetchUsers]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredUsers(users);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const filtered = users.filter(user => {
            const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
            return (
                user.firstName.toLowerCase().includes(query) ||
                user.lastName.toLowerCase().includes(query) ||
                fullName.includes(query) ||
                user.email.toLowerCase().includes(query)
            );
        });
        setFilteredUsers(filtered);
    }, [searchQuery, users]);

    const handleRefresh = () => {
        setPage(1);
        fetchUsers(activeTab, 1, true);
    };

    const loadMore = () => {
        if (!loading && hasMore && searchQuery.trim() === '') {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchUsers(activeTab, nextPage);
        }
    };

    const handleUserPress = (id: string, type: string) => {
        if (type === 'doctors') {
            router.push(`/(admin)/(pages)/doctor/${id}`);
        } else if (type === 'patients') {
            router.push(`/(admin)/(pages)/patient/${id}`);
        }
    };

    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    let greeting = 'Good Morning';
    if (currentHour >= 12 && currentHour < 18) {
        greeting = 'Good Afternoon';
    } else if (currentHour >= 18) {
        greeting = 'Good Evening';
    }

    const activeUsers = users.filter(u => u.isActive).length;
    const verifiedUsers = users.filter(u => u.isVerified).length;

    return (
        <View style={styles.container}>
            {/* Header with Gradient */}
            <LinearGradient
                colors={['#67A9AF', '#5A9399']}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greeting} className='font-sans-medium'>{greeting}</Text>
                        <Text style={styles.adminName} className='font-sans-medium'>{user?.firstName} {user?.lastName}</Text>
                        <Text style={styles.headerSubtitle} className='font-sans'>Support Dashboard</Text>
                    </View>
                    <View style={styles.headerIcon}>
                        <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
                    </View>
                </View>
            </LinearGradient>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <StatCard
                    icon="people"
                    label="Total Users"
                    value={users.length}
                    color="#67A9AF"
                    bgColor="#F0F9FA"
                />
                <StatCard
                    icon="checkmark-circle"
                    label="Active"
                    value={activeUsers}
                    color="#10B981"
                    bgColor="#F0FDF4"
                />
                {activeTab === 'doctors' && (
                    <StatCard
                        icon="shield-checkmark"
                        label="Verified"
                        value={verifiedUsers}
                        color="#8B5CF6"
                        bgColor="#F5F3FF"
                    />
                )}
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'doctors' && styles.tabActive]}
                    onPress={() => setActiveTab('doctors')}
                    activeOpacity={0.7}
                >
                    <Ionicons 
                        name="medical" 
                        size={20} 
                        color={activeTab === 'doctors' ? '#67A9AF' : '#9CA3AF'} 
                    />
                    <Text style={[styles.tabText, activeTab === 'doctors' && styles.tabTextActive]} className='font-sans'>
                        Doctors
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'patients' && styles.tabActive]}
                    onPress={() => setActiveTab('patients')}
                    activeOpacity={0.7}
                >
                    <Ionicons 
                        name="people" 
                        size={20} 
                        color={activeTab === 'patients' ? '#67A9AF' : '#9CA3AF'} 
                    />
                    <Text style={[styles.tabText, activeTab === 'patients' && styles.tabTextActive]} className='font-sans'>
                        Patients
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#67A9AF" />
                <TextInput
                    style={styles.searchInput}
                    placeholder={`Search ${activeTab}...`}
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className='font-sans'
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Error State */}
            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={24} color="#DC2626" />
                    <Text style={styles.errorText} className='font-sans'>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                        <Text style={styles.retryButtonText} className='font-sans-medium'>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* User List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#67A9AF']} />
                }
                onScroll={({ nativeEvent }) => {
                    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
                    if (isCloseToBottom) loadMore();
                }}
                scrollEventThrottle={400}
                showsVerticalScrollIndicator={false}
            >
                {filteredUsers.length > 0 ? (
                    <>
                        {filteredUsers.map((user) => (
                            <UserItem key={user._id} user={user} type={activeTab} onPress={handleUserPress} />
                        ))}
                        {loading && (
                            <View style={styles.loadingMore}>
                                <ActivityIndicator size="small" color="#67A9AF" />
                            </View>
                        )}
                        {/* {!hasMore && users.length > 0 && (
                            <Text style={styles.endText}>No more {activeTab} to load</Text>
                        )} */}
                    </>
                ) : loading ? (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color="#67A9AF" />
                        {/* <Text style={styles.loadingText} className='font-sans'>Loading {activeTab}...</Text> */}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons
                                name={activeTab === 'doctors' ? 'medical-outline' : 'people-outline'}
                                size={48}
                                color="#67A9AF"
                            />
                        </View>
                        <Text style={styles.emptyTitle} className='font-sans'>No {activeTab} found</Text>
                        <Text style={styles.emptySubtitle} className='font-sans'>
                            {searchQuery ? 'Try adjusting your search' : `There are no ${activeTab} to display`}
                        </Text>
                    </View>
                )}
            </ScrollView>
            <View className='h-20' />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
        // fontWeight: '500',
    },
    adminName: {
        fontSize: 28,
        // fontWeight: '700',
        color: '#FFFFFF',
        // marginTop: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.8,
        marginTop: 4,
    },
    headerIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 25,
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        // fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        // fontWeight: '500',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 20,
        gap: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        gap: 8,
    },
    tabActive: {
        backgroundColor: '#F0F9FA',
        borderColor: '#67A9AF',
    },
    tabText: {
        fontSize: 14,
        // fontWeight: '600',
        color: '#6B7280',
    },
    tabTextActive: {
        color: '#67A9AF',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: '#111827',
    },
    errorContainer: {
        backgroundColor: '#FEE2E2',
        marginHorizontal: 20,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        // fontWeight: '500',
    },
    retryButton: {
        backgroundColor: '#DC2626',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 4,
    },
    retryButtonText: {
        color: '#FFFFFF',
        // fontWeight: '600',
        fontSize: 14,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 24,
    },
    userCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    userCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    userLeftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 12,
        position: 'relative',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
    },
    avatarFallback: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doctorAvatar: {
        backgroundColor: '#67A9AF',
    },
    patientAvatar: {
        backgroundColor: '#8B5CF6',
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    userDetails: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        // fontWeight: '700',
        color: '#111827',
    },
    verifiedBadge: {
        marginLeft: 4,
    },
    speciality: {
        fontSize: 13,
        color: '#67A9AF',
        // fontWeight: '500',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#F0FDF4',
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 11,
        // fontWeight: '600',
    },
    statusBadge: {
        backgroundColor: '#FEF3C7',
    },
    statusText: {
        fontSize: 11,
        // fontWeight: '600',
        color: '#92400E',
        textTransform: 'capitalize',
    },
    chevronContainer: {
        marginLeft: 8,
    },
    loadingMore: {
        paddingVertical: 16,
    },
    endText: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 13,
        paddingVertical: 16,
    },
    centerContent: {
        paddingVertical: 80,
        alignItems: 'center',
    },
    loadingText: {
        color: '#6B7280',
        marginTop: 16,
        fontSize: 15,
    },
    emptyState: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 48,
        alignItems: 'center',
        marginTop: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        color: '#111827',
        fontSize: 18,
        // fontWeight: '700',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#6B7280',
        fontSize: 14,
        textAlign: 'center',
    },
});