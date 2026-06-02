import {
  Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useMemo,
  useRef,
  useState } from 'react';
import { Pressable,
  RefreshControl,
  StyleSheet,
  View
} from 'react-native';
import { TextInput } from '@/src/components/ui/TranslatedTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { Separator } from '@/src/components/ui/Separator';
import { toast } from '@/src/components/ui/Toast';
import { colors, radius, spacing, typography } from '@/src/constants';
import {
  FilterChip,
  IconLabel,
  PagePadding,
  ScreenSkeleton,
  SearchBar,
  SectionHeader,
  SegmentedTabs
} from '@/src/features/student/components';
import type {
  HousingRequest,
  HousingResponse,
  StudentHousingListingView
} from '@/src/features/student/types';
import {
  formatCurrency,
  formatRelativeTime,
  normalizeSearch,
  statusTone,
  studentQueryTimes
} from '@/src/features/student/utils';
import { api } from '@/src/lib/api';
import { requestOrQueue } from '@/src/lib/offlineQueue';

import { Text } from '@/src/components/ui/TranslatedText';

type RequestMode = 'enquiry' | 'booking';
type RequestSection = 'closed' | 'open';
type PriceFilter = 'all' | 'under500' | 'under800' | 'over800';

const queryKey = ['student', 'housing'] as const;

async function fetchHousing() {
  const response = await api.get<HousingResponse>('/api/student/housing');
  return response.data;
}

export default function StudentHousingScreen() {
  const queryClient = useQueryClient();
  const sheetRef = useRef<BottomSheet>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [requestSection, setRequestSection] = useState<RequestSection>('closed');
  const [selectedListing, setSelectedListing] = useState<StudentHousingListingView | null>(null);
  const [requestMode, setRequestMode] = useState<RequestMode>('enquiry');
  const [message, setMessage] = useState('');

  const query = useQuery<HousingResponse>({
    queryKey,
    queryFn: fetchHousing,
    staleTime: studentQueryTimes.housing.staleTime,
    gcTime: studentQueryTimes.housing.gcTime,
    placeholderData: keepPreviousData
  });

  const favoriteMutation = useMutation({
    mutationFn: ({ listingId, saved }: { listingId: number; saved: boolean }) => {
      const body = {
        action: 'favorite',
        listingId,
        saved
      };

      return requestOrQueue(
        {
          endpoint: '/api/student/housing',
          method: 'POST',
          body
        },
        () => api.post('/api/student/housing', body)
      );
    },
    onMutate: async ({ listingId, saved }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<HousingResponse>(queryKey);

      queryClient.setQueryData<HousingResponse>(queryKey, (current: HousingResponse | undefined) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          favorites: saved
            ? Array.from(new Set([...current.favorites, listingId]))
            : current.favorites.filter((id: number) => id !== listingId),
          listings: current.listings.map((listing: StudentHousingListingView) =>
            listing.id === listingId ? { ...listing, saved } : listing
          )
        };
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error('Unable to update saved listing.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    }
  });

  const requestMutation = useMutation({
    mutationFn: ({
      listingId,
      requestType,
      requestMessage
    }: {
      listingId: number;
      requestType: RequestMode;
      requestMessage: string;
    }) =>
      api.post('/api/student/housing', {
        listingId,
        requestType,
        message: requestMessage
      }),
    onSuccess: () => {
      toast.success(`${requestMode === 'booking' ? 'Booking' : 'Enquiry'} sent.`);
      setMessage('');
      sheetRef.current?.close();
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to send request.');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: number) =>
      api.post('/api/student/housing', {
        action: 'cancel',
        requestId
      }),
    onSuccess: () => {
      toast.success('Request cancelled.');
      void query.refetch();
    },
    onError: () => {
      toast.error('Unable to cancel request.');
    }
  });

  const typeOptions = useMemo<string[]>(() => {
    const types =
      query.data?.listings
        .map((listing: StudentHousingListingView) => listing.type)
        .filter((type: string): type is string => Boolean(type)) ?? [];

    return ['All', ...Array.from(new Set<string>(types))];
  }, [query.data?.listings]);

  const listings = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);

    return (
      query.data?.listings.filter((listing: StudentHousingListingView) => {
        const matchesSearch =
          !normalizedSearch ||
          normalizeSearch(`${listing.title} ${listing.location}`).includes(normalizedSearch);
        const matchesType = typeFilter === 'All' || listing.type === typeFilter;
        const matchesPrice =
          priceFilter === 'all' ||
          (priceFilter === 'under500' && listing.price < 500) ||
          (priceFilter === 'under800' && listing.price < 800) ||
          (priceFilter === 'over800' && listing.price >= 800);

        return matchesSearch && matchesType && matchesPrice;
      }) ?? []
    );
  }, [priceFilter, query.data?.listings, search, typeFilter]);

  const openRequestSheet = (listing: StudentHousingListingView, mode: RequestMode) => {
    setSelectedListing(listing);
    setRequestMode(mode);
    sheetRef.current?.snapToIndex(0);
  };

  if (query.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenSkeleton rows={5} />
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title="Unable to load housing"
          message="Refresh housing listings when your connection is back."
          onRetry={() => void query.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlashList<StudentHousingListingView>
        data={listings}
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
              <Text style={styles.title}>Housing</Text>
              <Text style={styles.subtitle}>Find trusted accommodation partners.</Text>
            </View>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search title or location"
            />
            <View style={styles.chipRow}>
              {typeOptions.map((option) => (
                <FilterChip
                  key={option}
                  label={option}
                  selected={typeFilter === option}
                  onPress={() => setTypeFilter(option)}
                />
              ))}
            </View>
            <View style={styles.chipRow}>
              <FilterChip
                label="Any price"
                selected={priceFilter === 'all'}
                onPress={() => setPriceFilter('all')}
              />
              <FilterChip
                label="Under 500"
                selected={priceFilter === 'under500'}
                onPress={() => setPriceFilter('under500')}
              />
              <FilterChip
                label="Under 800"
                selected={priceFilter === 'under800'}
                onPress={() => setPriceFilter('under800')}
              />
              <FilterChip
                label="800+"
                selected={priceFilter === 'over800'}
                onPress={() => setPriceFilter('over800')}
              />
            </View>
          </PagePadding>
        }
        ListEmptyComponent={
          <EmptyState
            icon="business-outline"
            title="No listings found"
            subtitle="Try a different search or filter."
          />
        }
        renderItem={({ item }) => (
          <HousingCard
            listing={item}
            onFavorite={() =>
              favoriteMutation.mutate({
                listingId: item.id,
                saved: !item.saved
              })
            }
            onEnquire={() => openRequestSheet(item, 'enquiry')}
            onBook={() => openRequestSheet(item, 'booking')}
          />
        )}
        ListFooterComponent={
          <RequestsSection
            requests={query.data.activeRequests}
            section={requestSection}
            setSection={setRequestSection}
            onCancel={(requestId) => cancelMutation.mutate(requestId)}
            isCancelling={cancelMutation.isPending}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      <BottomSheet ref={sheetRef} index={-1} snapPoints={['48%']} enablePanDownToClose>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>{selectedListing?.title ?? 'Housing request'}</Text>
          <SegmentedTabs
            value={requestMode}
            onChange={setRequestMode}
            tabs={[
              { label: 'Enquiry', value: 'enquiry' },
              { label: 'Book', value: 'booking' }
            ]}
          />
          <TextInput
            multiline
            value={message}
            onChangeText={setMessage}
            placeholder="Tell the agent about yourself and your preferences..."
            placeholderTextColor={colors.inactive}
            textAlignVertical="top"
            style={styles.messageInput}
          />
          <Button
            title="Submit"
            loading={requestMutation.isPending}
            onPress={() => {
              if (!selectedListing) {
                return;
              }
              requestMutation.mutate({
                listingId: selectedListing.id,
                requestType: requestMode,
                requestMessage: message
              });
            }}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function HousingCard({
  listing,
  onFavorite,
  onEnquire,
  onBook
}: {
  listing: StudentHousingListingView;
  onFavorite: () => void;
  onEnquire: () => void;
  onBook: () => void;
}) {
  return (
    <Card style={styles.listingCard}>
      <Image
        source={listing.imageUrl ? { uri: listing.imageUrl } : undefined}
        style={styles.coverImage}
        contentFit="cover"
      />
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <View style={styles.cardTitleText}>
            <Text style={styles.listingTitle}>{listing.title}</Text>
            <Text style={styles.location}>{listing.location}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={listing.saved ? 'Unsave listing' : 'Save listing'}
            onPress={onFavorite}
            style={styles.saveButton}
          >
            <Ionicons
              name={listing.saved ? 'heart' : 'heart-outline'}
              size={22}
              color={listing.saved ? colors.error : colors.textSecondary}
            />
          </Pressable>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.price}>{formatCurrency(listing.price, listing.currency)}/month</Text>
          <Badge label={listing.type} tone="info" />
        </View>
        <Text style={styles.details} numberOfLines={2}>
          {listing.details}
        </Text>
        <View style={styles.trustRow}>
          <Ionicons name="star" size={16} color={colors.warning} />
          <Text style={styles.trustText}>{listing.trustScore.toFixed(1)} trust score</Text>
          <Text style={styles.partner}>{listing.partnerName}</Text>
        </View>
        <View style={styles.amenityRow}>
          {listing.amenityTags.slice(0, 3).map((tag) => (
            <Badge key={tag} label={tag} size="small" />
          ))}
        </View>
        <View style={styles.actionRow}>
          <Button title="Enquire" variant="secondary" onPress={onEnquire} style={styles.actionButton} />
          <Button title="Book" onPress={onBook} style={styles.actionButton} />
        </View>
      </View>
    </Card>
  );
}

function RequestsSection({
  requests,
  section,
  setSection,
  onCancel,
  isCancelling
}: {
  requests: HousingRequest[];
  section: RequestSection;
  setSection: (section: RequestSection) => void;
  onCancel: (requestId: number) => void;
  isCancelling: boolean;
}) {
  return (
    <View style={styles.requests}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setSection(section === 'open' ? 'closed' : 'open')}
        style={styles.requestsHeader}
      >
        <SectionHeader title="My Requests" />
        <Ionicons
          name={section === 'open' ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={colors.text}
        />
      </Pressable>
      {section === 'open' ? (
        requests.length > 0 ? (
          <View style={styles.requestList}>
            {requests.map((request) => (
              <Card key={request.id} style={styles.requestCard}>
                <IconLabel
                  icon={request.requestType === 'booking' ? 'calendar-outline' : 'chatbubble-outline'}
                  title={request.listingTitle}
                  subtitle={`${request.requestType} • ${formatRelativeTime(request.createdAt)}`}
                  right={<Badge label={request.status} tone={statusTone(request.status)} />}
                />
                <Separator />
                <Button
                  title="Cancel"
                  variant="ghost"
                  loading={isCancelling}
                  onPress={() => onCancel(request.id)}
                />
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="clipboard-outline"
            title="No active requests"
            subtitle="Your enquiries and bookings will appear here."
          />
        )
      ) : null}
    </View>
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  listContent: {
    paddingBottom: spacing.xxxl
  },
  listingCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    padding: 0
  },
  coverImage: {
    backgroundColor: colors.neutralSoft,
    height: 172,
    width: '100%'
  },
  cardBody: {
    gap: spacing.sm,
    padding: spacing.md
  },
  cardTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm
  },
  cardTitleText: {
    flex: 1,
    gap: 4
  },
  listingTitle: {
    ...typography.headingSmall
  },
  location: {
    ...typography.caption
  },
  saveButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  price: {
    ...typography.headingSmall,
    color: colors.secondary
  },
  details: {
    ...typography.body,
    color: colors.textSecondary
  },
  trustRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs
  },
  trustText: {
    ...typography.caption,
    color: colors.text
  },
  partner: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right'
  },
  amenityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  actionButton: {
    flex: 1
  },
  requests: {
    gap: spacing.md,
    padding: spacing.xl,
    paddingTop: spacing.md
  },
  requestsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  requestList: {
    gap: spacing.sm
  },
  requestCard: {
    gap: spacing.md
  },
  sheetContent: {
    gap: spacing.md,
    padding: spacing.xl
  },
  sheetTitle: {
    ...typography.headingMedium
  },
  messageInput: {
    ...typography.body,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1.5,
    minHeight: 128,
    padding: spacing.md
  }
});
