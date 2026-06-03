import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/src/components/ui/TranslatedText';
import { colors, radius, spacing, typography } from '@/src/constants';

interface ProfilePhotoUploaderProps {
  imageUrl?: string | null;
  name: string;
  uploading?: boolean;
  onPress: () => void;
  buttonLabel?: string;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? 'E';
  const second = parts[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase();
}

export function ProfilePhotoUploader({
  imageUrl,
  name,
  uploading = false,
  onPress,
  buttonLabel = 'Change photo'
}: ProfilePhotoUploaderProps) {
  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        onPress={onPress}
        style={styles.avatarButton}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.avatarImage}
            contentFit="cover"
            accessibilityLabel={`${name} profile photo`}
          />
        ) : (
          <View style={styles.initialsAvatar}>
            <Text style={styles.initials}>{initials(name)}</Text>
          </View>
        )}
        {uploading ? (
          <View style={styles.uploadOverlay}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.changeButton}>
        <Ionicons name="camera-outline" color="#15803d" size={18} />
        <Text style={styles.changeText}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md
  },
  avatarButton: {
    borderRadius: radius.full,
    height: 104,
    overflow: 'hidden',
    width: 104
  },
  avatarImage: {
    height: '100%',
    width: '100%'
  },
  initialsAvatar: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    flex: 1,
    justifyContent: 'center'
  },
  initials: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '800'
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.72)',
    justifyContent: 'center'
  },
  changeButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs
  },
  changeText: {
    ...typography.headingSmall,
    color: '#15803d',
    fontSize: 14
  }
});
