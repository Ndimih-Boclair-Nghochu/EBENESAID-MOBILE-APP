import type { ViewStyle } from 'react-native';

export const colors = {
  primary: '#FFFFFF',
  secondary: '#22c55e',
  background: '#FFFFFF',
  card: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  label: '#374151',
  border: '#E5E7EB',
  inactive: '#9CA3AF',
  success: '#16a34a',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  successSoft: '#dcfce7',
  warningSoft: '#fef3c7',
  errorSoft: '#fee2e2',
  infoSoft: '#dbeafe',
  neutralSoft: '#F3F4F6'
} as const;

export const shadow: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 2
};

