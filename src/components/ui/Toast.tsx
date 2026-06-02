import {
  useEffect,
  useRef,
  useState } from 'react';
import { StyleSheet
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing, typography } from '@/src/constants';

import { Text } from '@/src/components/ui/TranslatedText';

type ToastTone = 'success' | 'error' | 'info';

interface ToastPayload {
  id: number;
  message: string;
  tone: ToastTone;
}

type ToastListener = (payload: ToastPayload) => void;

const listeners = new Set<ToastListener>();

function emit(message: string, tone: ToastTone) {
  const payload = {
    id: Date.now(),
    message,
    tone
  };

  listeners.forEach((listener) => listener(payload));
}

export const toast = {
  success: (message: string) => emit(message, 'success'),
  error: (message: string) => emit(message, 'error'),
  info: (message: string) => emit(message, 'info')
};

function subscribe(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const toneStyles: Record<ToastTone, { backgroundColor: string; color: string }> = {
  success: {
    backgroundColor: colors.successSoft,
    color: colors.success
  },
  error: {
    backgroundColor: colors.errorSoft,
    color: '#dc2626'
  },
  info: {
    backgroundColor: colors.infoSoft,
    color: '#1d4ed8'
  }
};

export function ToastHost() {
  const [currentToast, setCurrentToast] = useState<ToastPayload | null>(null);
  const translateY = useSharedValue(-120);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(
    () =>
      subscribe((payload) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        setCurrentToast(payload);
        translateY.value = withTiming(0, { duration: 180 });
        timeoutRef.current = setTimeout(() => {
          translateY.value = withTiming(-120, { duration: 180 });
        }, 2800);
      }),
    [translateY]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  if (!currentToast) {
    return null;
  }

  const styleForTone = toneStyles[currentToast.tone];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        shadow,
        animatedStyle,
        {
          top: insets.top + spacing.xs,
          backgroundColor: styleForTone.backgroundColor
        }
      ]}
    >
      <Text style={[styles.text, { color: styleForTone.color }]}>{currentToast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    alignSelf: 'center',
    borderRadius: radius.md,
    left: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'absolute',
    right: spacing.md,
    zIndex: 100
  },
  text: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center'
  }
});

