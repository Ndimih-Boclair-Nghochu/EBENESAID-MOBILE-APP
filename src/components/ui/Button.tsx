import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle
} from 'react-native';

import { colors, radius, typography } from '@/src/constants';

import { Text } from '@/src/components/ui/TranslatedText';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  leftIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle; loader: string }> = {
  primary: {
    container: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary
    },
    text: {
      color: colors.primary
    },
    loader: colors.primary
  },
  secondary: {
    container: {
      backgroundColor: colors.primary,
      borderColor: colors.secondary,
      borderWidth: 1.5
    },
    text: {
      color: colors.secondary
    },
    loader: colors.secondary
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      borderColor: 'transparent'
    },
    text: {
      color: colors.textSecondary
    },
    loader: colors.textSecondary
  },
  danger: {
    container: {
      backgroundColor: colors.error,
      borderColor: colors.error
    },
    text: {
      color: colors.primary
    },
    loader: colors.primary
  }
};

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  leftIcon,
  style,
  textStyle,
  onPress,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const stylesForVariant = variantStyles[variant];

  const handlePress = (event: GestureResponderEvent) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(event);
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        stylesForVariant.container,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={stylesForVariant.loader} />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.text, stylesForVariant.text, textStyle]} numberOfLines={1}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  text: {
    ...typography.headingSmall,
    fontSize: 15
  },
  disabled: {
    opacity: 0.55
  },
  pressed: {
    opacity: 0.86
  }
});

