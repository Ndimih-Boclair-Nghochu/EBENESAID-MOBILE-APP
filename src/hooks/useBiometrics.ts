import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';

interface BiometricsState {
  isChecking: boolean;
  isAvailable: boolean;
  label: string;
}

function getBiometricLabel(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }

  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Touch ID';
  }

  return 'Biometrics';
}

export function useBiometrics() {
  const [state, setState] = useState<BiometricsState>({
    isChecking: true,
    isAvailable: false,
    label: 'Biometrics'
  });

  useEffect(() => {
    let mounted = true;

    async function loadAvailability() {
      const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync()
      ]);

      if (!mounted) {
        return;
      }

      setState({
        isChecking: false,
        isAvailable: hasHardware && isEnrolled,
        label: getBiometricLabel(supportedTypes)
      });
    }

    void loadAvailability();

    return () => {
      mounted = false;
    };
  }, []);

  const authenticate = useCallback(
    () =>
      LocalAuthentication.authenticateAsync({
        promptMessage: `Login with ${state.label}`,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false
      }),
    [state.label]
  );

  return {
    ...state,
    authenticate
  };
}

