import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { toast } from '@/src/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/src/constants';
import {
  IconLabel,
  PagePadding,
  ScreenSkeleton,
  SectionHeader
} from '@/src/features/student/components';
import type {
  ArrivalResponse,
  TransportProvider,
  TravelType
} from '@/src/features/student/types';
import { formatDate, statusTone, studentQueryTimes } from '@/src/features/student/utils';
import { api } from '@/src/lib/api';

const travelOptions: Array<{ value: TravelType; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { value: 'airport_pickup', label: 'Airport Pickup', icon: 'airplane-outline' },
  { value: 'city_transfer', label: 'City Transfer', icon: 'car-outline' },
  { value: 'intercity', label: 'Intercity', icon: 'map-outline' },
  { value: 'custom', label: 'Custom', icon: 'sparkles-outline' }
];

async function fetchArrival() {
  const response = await api.get<ArrivalResponse>('/api/student/arrival');
  return response.data;
}

export default function ArrivalScreen() {
  const [travelType, setTravelType] = useState<TravelType>('airport_pickup');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [travelTime, setTravelTime] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [requesterLocation, setRequesterLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const query = useQuery<ArrivalResponse>({
    queryKey: ['student', 'arrival'],
    queryFn: fetchArrival,
    staleTime: studentQueryTimes.arrival.staleTime,
    gcTime: studentQueryTimes.arrival.gcTime,
    placeholderData: keepPreviousData
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      api.put('/api/student/arrival', {
        origin,
        destination,
        travelType,
        travelDate,
        travelTime,
        passengerCount,
        pickupBooked: true,
        serviceDetails: {},
        requesterLocation
      }),
    onSuccess: () => {
      toast.success('Arrival plan saved.');
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to save arrival plan.');
    }
  });

  const toggleLocation = async (enabled: boolean) => {
    setUseCurrentLocation(enabled);

    if (!enabled) {
      setRequesterLocation(null);
      return;
    }

    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      setUseCurrentLocation(false);
      toast.error('Location permission is required.');
      return;
    }

    const position = await Location.getCurrentPositionAsync({});
    setRequesterLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  };

  if (query.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenSkeleton rows={4} />
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load arrival planning"
          message="Refresh transport options when your connection is back."
          onRetry={() => void query.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<TransportProvider>
        data={query.data.directory}
        keyExtractor={(item) => `${item.id}`}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
          />
        }
        ListHeaderComponent={
          <PagePadding style={styles.header}>
            <View>
              <Text style={styles.title}>Arrival Planning</Text>
              <Text style={styles.subtitle}>Book transport for your first move.</Text>
            </View>
            {query.data.booking ? (
              <BookingCard booking={query.data.booking} />
            ) : (
              <Card style={styles.formCard}>
                <SectionHeader title="Plan Your Arrival" />
                <View style={styles.travelGrid}>
                  {travelOptions.map((option) => (
                    <Pressable
                      accessibilityRole="button"
                      key={option.value}
                      onPress={() => setTravelType(option.value)}
                      style={[
                        styles.travelOption,
                        travelType === option.value && styles.travelOptionSelected
                      ]}
                    >
                      <Ionicons
                        name={option.icon}
                        size={24}
                        color={travelType === option.value ? colors.primary : colors.secondary}
                      />
                      <Text
                        style={[
                          styles.travelOptionText,
                          travelType === option.value && styles.travelOptionTextSelected
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <ArrivalInput label="Origin" value={origin} onChangeText={setOrigin} />
                <ArrivalInput
                  label="Destination"
                  value={destination}
                  onChangeText={setDestination}
                />
                <View style={styles.twoColumn}>
                  <ArrivalInput
                    label="Travel date"
                    value={travelDate}
                    onChangeText={setTravelDate}
                    placeholder="YYYY-MM-DD"
                  />
                  <ArrivalInput
                    label="Travel time"
                    value={travelTime}
                    onChangeText={setTravelTime}
                    placeholder="HH:MM"
                  />
                </View>
                <View style={styles.stepperRow}>
                  <Text style={styles.fieldLabel}>Passengers</Text>
                  <View style={styles.stepper}>
                    <StepperButton
                      icon="remove"
                      onPress={() => setPassengerCount((current) => Math.max(1, current - 1))}
                    />
                    <Text style={styles.passengerCount}>{passengerCount}</Text>
                    <StepperButton
                      icon="add"
                      onPress={() => setPassengerCount((current) => Math.min(8, current + 1))}
                    />
                  </View>
                </View>
                <View style={styles.locationRow}>
                  <View style={styles.locationText}>
                    <Text style={styles.fieldLabel}>Use my current location</Text>
                    <Text style={styles.locationHint}>
                      {requesterLocation
                        ? `${requesterLocation.latitude.toFixed(4)}, ${requesterLocation.longitude.toFixed(4)}`
                        : 'Adds pickup coordinates for the operator.'}
                    </Text>
                  </View>
                  <Switch
                    value={useCurrentLocation}
                    onValueChange={(value) => void toggleLocation(value)}
                    thumbColor={colors.primary}
                    trackColor={{ false: colors.border, true: colors.secondary }}
                  />
                </View>
                <Button title="Save arrival plan" loading={saveMutation.isPending} onPress={() => saveMutation.mutate()} />
              </Card>
            )}
            <SectionHeader title="Available Transport Providers" />
          </PagePadding>
        }
        ListEmptyComponent={
          <EmptyState
            icon="car-outline"
            title="No providers listed"
            subtitle="Transport partners will appear here."
          />
        }
        renderItem={({ item }) => <ProviderCard provider={item} />}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

function BookingCard({ booking }: { booking: NonNullable<ArrivalResponse['booking']> }) {
  return (
    <Card style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.cardTitle}>Booking details</Text>
        <Badge label={booking.status} tone={statusTone(booking.status)} />
      </View>
      <IconLabel icon="navigate-outline" title={`${booking.origin} to ${booking.destination}`} />
      <IconLabel
        icon="calendar-outline"
        title={formatDate(booking.travelDate)}
        subtitle={`${booking.travelTime} • ${booking.passengerCount} passenger(s)`}
      />
    </Card>
  );
}

function ProviderCard({ provider }: { provider: TransportProvider }) {
  return (
    <Card style={styles.providerCard}>
      <Text style={styles.providerName}>{provider.name}</Text>
      <Text style={styles.providerMeta}>{provider.serviceTypes.join(' • ')}</Text>
      <Text style={styles.providerContact}>{provider.contact}</Text>
    </Card>
  );
}

function ArrivalInput({
  label,
  value,
  onChangeText,
  placeholder
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.inactive}
        style={styles.input}
      />
    </View>
  );
}

function StepperButton({ icon, onPress }: { icon: 'add' | 'remove'; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.stepperButton}>
      <Ionicons name={icon} size={20} color={colors.secondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  header: {
    paddingBottom: spacing.md
  },
  title: {
    ...typography.headingLarge
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  formCard: {
    gap: spacing.md
  },
  travelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  travelOption: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    minHeight: 92,
    justifyContent: 'center',
    padding: spacing.sm,
    width: '48%'
  },
  travelOptionSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary
  },
  travelOptionText: {
    ...typography.label,
    textAlign: 'center'
  },
  travelOptionTextSelected: {
    color: colors.primary
  },
  twoColumn: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  inputGroup: {
    flex: 1,
    gap: spacing.xs
  },
  fieldLabel: {
    ...typography.label
  },
  input: {
    ...typography.body,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    height: 52,
    paddingHorizontal: spacing.md
  },
  stepperRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md
  },
  stepperButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  passengerCount: {
    ...typography.headingSmall,
    minWidth: 20,
    textAlign: 'center'
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md
  },
  locationText: {
    flex: 1,
    gap: 4
  },
  locationHint: {
    ...typography.caption
  },
  bookingCard: {
    gap: spacing.md
  },
  bookingHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cardTitle: {
    ...typography.headingSmall
  },
  listContent: {
    paddingBottom: spacing.xxxl
  },
  providerCard: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xl
  },
  providerName: {
    ...typography.headingSmall
  },
  providerMeta: {
    ...typography.body,
    color: colors.textSecondary
  },
  providerContact: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '700'
  }
});
