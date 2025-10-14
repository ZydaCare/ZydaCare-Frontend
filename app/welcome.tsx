import { View, Image, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Button from '@/components/ui/Button';
import { Images } from '@/assets/Images';
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();

  return (
    <View className='flex-1 bg-white'>
      <ScrollView
        className='flex-1'
        // contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View className='pt-16 px-[24px] pb-10 items-center'>
          <View style={styles.logoContainer}>
            <Image
              source={Images.LogoIcon}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.mainTitle} className='font-sans-semibold'>Your Health,{'\n'}Our Priority</Text>
          <Text style={styles.mainSubtitle} className='font-sans'>
            Experience seamless healthcare management with ZydaCare
          </Text>
        </View>

        {/* Info Cards */}
        <View style={styles.cardsSection}>
          <View style={styles.infoCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E8F5F6' }]}>
              <Ionicons name="people" size={28} color="#67A9AF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle} className='font-sans-semibold'>Expert Doctors</Text>
              <Text style={styles.cardText} className='font-sans'>Connect with qualified professionals</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E8F5F6' }]}>
              <Ionicons name="calendar-sharp" size={28} color="#67A9AF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle} className='font-sans-semibold'>Easy Scheduling</Text>
              <Text style={styles.cardText} className='font-sans'>Book appointments in seconds</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E8F5F6' }]}>
              <Ionicons name="shield-checkmark" size={28} color="#67A9AF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle} className='font-sans-semibold'>Secure & Private</Text>
              <Text style={styles.cardText} className='font-sans'>Your health data is protected</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        <Button
          variant="primary"
          size="lg"
          radius="full"
          onPress={() => router.push("/(auth)/signup")}
          className="w-full mb-4"
          textClassName="text-base font-sans-semibold"
        > 
          Get Started
        </Button>

        <View style={styles.signInRow}>
          <Text style={styles.signInText} className='font-sans'>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.signInLink} className='font-sans-semibold'>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // paddingBottom: 20,
  },
  heroSection: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: '#67A9AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#67A9AF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 100,
    height: 100,
    // tintColor: '#fff',
  },
  mainTitle: {
    fontSize: 38,
    // fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 46,
  },
  mainSubtitle: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  cardsSection: {
    paddingHorizontal: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    // fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signInLink: {
    fontSize: 14,
    color: '#67A9AF',
    // fontWeight: '700',
  },
});