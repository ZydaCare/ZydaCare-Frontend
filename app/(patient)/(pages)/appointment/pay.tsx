import React, { useCallback, useRef, useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';

import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';
import { checkPaymentStatus } from '@/api/patient/appointments';

export default function PayAppointmentScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { showToast } = useToast();
  const { reference, url, bookingId } = useLocalSearchParams<{ 
    reference?: string; 
    url?: string;
    bookingId?: string;
  }>();

  const webRef = useRef<WebView | null>(null);
  const [loadingWebView, setLoadingWebView] = useState(true);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasNavigatedRef = useRef(false);

  // Poll backend to check if webhook has processed payment
  const pollPaymentStatus = useCallback(async () => {
    if (!reference || !token || hasNavigatedRef.current) return;

    try {
      console.log('[PaymentDebug] Polling payment status for ref:', reference);
      const result = await checkPaymentStatus(reference, token);
      
      if (result.success && result.data.paymentStatus === 'success') {
        console.log('[PaymentDebug] Payment verified successfully');
        hasNavigatedRef.current = true;
        
        // Clear polling interval
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        
        showToast('Payment successful!', 'success');
        router.replace({
          pathname: '/(patient)/(pages)/appointment/pay-success',
          params: { bookingId: bookingId || result.data.bookingId || '' }
        });
      }
    } catch (e: any) {
      console.log('[PaymentDebug] Error polling payment status:', e?.message || e);
      // Continue polling on error
    }
  }, [reference, token, bookingId, router, showToast]);

  // Start polling when component mounts
  useEffect(() => {
    if (!reference || !token || hasNavigatedRef.current) return;
    
    console.log('[PaymentDebug] Starting payment status polling');
    
    // Poll immediately after 5 seconds (give user time to complete payment)
    const initialDelay = setTimeout(() => {
      pollPaymentStatus();
      
      // Then poll every 5 seconds to avoid rate limiting
      pollIntervalRef.current = setInterval(() => {
        pollPaymentStatus();
      }, 5000);
    }, 5000);

    // Cleanup
    return () => {
      clearTimeout(initialDelay);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [reference, token, pollPaymentStatus]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {!url ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-600">Missing payment URL</Text>
        </View>
      ) : (
        <WebView
          ref={(r) => (webRef.current = r)}
          source={{ uri: Array.isArray(url) ? url[0] : url }}
          onLoadEnd={() => setLoadingWebView(false)}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          startInLoadingState
          originWhitelist={['*']}
          renderLoading={() => (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#67A9AF" />
            </View>
          )}
        />
      )}

      {loadingWebView && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <View className="bg-white rounded-2xl p-6 items-center mx-8 max-w-sm">
            <ActivityIndicator size="large" color="#67A9AF" />
            <Text className="text-gray-900 font-sans-semibold text-lg mt-4">
              Loading Payment...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}