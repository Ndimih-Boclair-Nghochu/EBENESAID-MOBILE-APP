import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/src/constants';
import { getPasswordRules } from '@/src/lib/password';

interface PasswordChecklistProps {
  password: string;
}

export function PasswordChecklist({ password }: PasswordChecklistProps) {
  return (
    <View style={styles.wrapper}>
      {getPasswordRules(password).map((rule) => (
        <View key={rule.label} style={styles.row}>
          <Ionicons
            name={rule.valid ? 'checkmark-circle' : 'ellipse-outline'}
            size={16}
            color={rule.valid ? colors.success : colors.inactive}
          />
          <Text style={[styles.text, rule.valid && styles.valid]}>{rule.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs
  },
  text: {
    ...typography.caption
  },
  valid: {
    color: colors.success
  }
});

