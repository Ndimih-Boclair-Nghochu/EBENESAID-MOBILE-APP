import {
  useEffect } from 'react';
import { StyleSheet
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, typography } from '@/src/constants';

import { Text } from '@/src/components/ui/TranslatedText';

interface OfflineBannerProps {
  visible: boolean;
}

export function OfflineBanner({ visible }: OfflineBannerProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-96);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : -96, { duration: 220 });
  }, [translateY, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.banner,
        animatedStyle,
        {
          paddingTop: insets.top + spacing.xs
        }
      ]}
    >
      <Text style={styles.text}>You're offline. Some features unavailable.</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fef3c7',
    left: 0,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 90
  },
  text: {
    ...typography.caption,
    color: '#92400e',
    fontWeight: '600',
    textAlign: 'center'
  }
});

