import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_EMAIL_KEY = 'biometric_email';

export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    console.log('Checking if biometric hardware is available...');
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    console.log('Biometric hardware available:', hasHardware);
    
    if (!hasHardware) return false;
    
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    console.log('Biometric enrolled:', isEnrolled);
    
    return isEnrolled;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
};

export const authenticateBiometric = async (): Promise<boolean> => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to continue',
      fallbackLabel: 'Enter password',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
};

export const isBiometricEnabled = async (): Promise<boolean> => {
  try {
    console.log('Checking if biometric is enabled...');
    const [enabled, hasEmail] = await Promise.all([
      SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY),
      SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY)
    ]);
    
    console.log('Biometric enabled in storage:', { enabled, hasEmail });
    const isEnabled = enabled === 'true' && !!hasEmail;
    console.log('Biometric is enabled:', isEnabled);
    
    return isEnabled;
  } catch (error) {
    console.error('Error reading biometric setting:', error);
    return false;
  }
};

export const setBiometricEnabled = async (enabled: boolean, email?: string): Promise<void> => {
  try {
    console.log('Setting biometric enabled:', { enabled, email });
    
    if (enabled && email) {
      console.log('Enabling biometric with email:', email);
      await Promise.all([
        SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true'),
        SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email)
      ]);
      console.log('Biometric enabled successfully');
    } else {
      console.log('Disabling biometric');
      await Promise.all([
        SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY).catch(e => 
          console.log('Error deleting enabled key:', e)
        ),
        SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY).catch(e => 
          console.log('Error deleting email key:', e)
        )
      ]);
      console.log('Biometric disabled successfully');
    }
    
    // Verify the state was saved correctly
    if (enabled) {
      const [savedEnabled, savedEmail] = await Promise.all([
        SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY),
        SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY)
      ]);
      console.log('Verified saved state - enabled:', savedEnabled, 'email:', savedEmail);
    }
  } catch (error) {
    console.error('Error updating biometric setting:', error);
    throw error;
  }
};
