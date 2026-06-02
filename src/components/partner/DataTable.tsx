import { ScrollView, StyleSheet, View } from 'react-native';

import { colors, spacing, typography } from '@/src/constants';

import { Text } from '@/src/components/ui/TranslatedText';

interface DataTableProps {
  headers: string[];
  rows: Array<Array<string | number>>;
}

export function DataTable({ headers, rows }: DataTableProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          {headers.map((header) => (
            <Text key={header} style={[styles.cell, styles.headerCell]}>
              {header}
            </Text>
          ))}
        </View>
        {rows.map((row, rowIndex) => (
          <View
            key={`${rowIndex}-${row.join('-')}`}
            style={[styles.row, rowIndex % 2 === 1 && styles.altRow]}
          >
            {row.map((cell, cellIndex) => (
              <Text key={`${rowIndex}-${cellIndex}`} style={styles.cell}>
                {cell}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  table: {
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden'
  },
  row: {
    backgroundColor: colors.surface,
    flexDirection: 'row'
  },
  headerRow: {
    backgroundColor: colors.card
  },
  altRow: {
    backgroundColor: colors.card
  },
  cell: {
    ...typography.body,
    minWidth: 132,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  headerCell: {
    ...typography.label,
    color: colors.textSecondary
  }
});

