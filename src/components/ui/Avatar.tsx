import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/src/constants';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  uri?: string | null;
  size?: number;
}

export function Avatar({ firstName = '', lastName = '', uri, size = 48 }: AvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'E';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.avatar,
          {
            height: size,
            width: size,
            borderRadius: size / 2
          }
        ]}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        styles.fallback,
        {
          height: size,
          width: size,
          borderRadius: size / 2
        }
      ]}
    >
      <Text style={[styles.initials, { fontSize: Math.max(14, size * 0.35) }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderColor: colors.border,
    borderWidth: 1
  },
  fallback: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    justifyContent: 'center'
  },
  initials: {
    color: colors.success,
    fontWeight: '700'
  }
});

