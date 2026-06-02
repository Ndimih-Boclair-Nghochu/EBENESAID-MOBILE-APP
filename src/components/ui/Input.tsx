import {
  Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  type TextInputProps,
  View
} from 'react-native';
import { TextInput } from '@/src/components/ui/TranslatedTextInput';

import { colors, radius, spacing, typography } from '@/src/constants';

import { Text } from '@/src/components/ui/TranslatedText';

type IconName = keyof typeof Ionicons.glyphMap;

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  leftIcon?: IconName;
}

export function Input({ label, error, leftIcon, secureTextEntry, style, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          isFocused && styles.focused,
          Boolean(error) && styles.errored
        ]}
      >
        {leftIcon ? <Ionicons name={leftIcon} color={colors.textSecondary} size={20} /> : null}
        <TextInput
          autoCapitalize="none"
          placeholderTextColor={colors.inactive}
          secureTextEntry={isPassword && !isPasswordVisible}
          onFocus={(event) => {
            setIsFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            props.onBlur?.(event);
          }}
          style={[styles.input, style]}
          {...props}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            onPress={() => setIsPasswordVisible((current) => !current)}
            hitSlop={10}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              color={colors.textSecondary}
              size={22}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs
  },
  label: {
    ...typography.label
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 52,
    paddingHorizontal: spacing.md
  },
  focused: {
    borderColor: colors.secondary
  },
  errored: {
    borderColor: colors.error
  },
  input: {
    ...typography.body,
    flex: 1,
    padding: 0
  },
  error: {
    ...typography.caption,
    color: colors.error
  }
});

