import type { TextStyle } from 'react-native';

import { colors } from './colors';

export const typography = {
  headingLarge: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text
  },
  headingMedium: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text
  },
  headingSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.label
  }
} satisfies Record<string, TextStyle>;

