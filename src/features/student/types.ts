import type { UserType } from '@/src/types';

// ─── OVERVIEW ───
// Matches StudentRelocationOverview from backend exactly
export interface StudentDashboardTask {
  id: number;
  userId: number;
  templateId: number | null;
  title: string;
  desc: string;
  done: boolean;
  category: string;
  href: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentNotificationItem {
  id: string;
  title: string;
  body: string;
  tone: string;
  href: string;
}

export interface StudentHousingRequest {
  id: number;
  listingId: number;
  listingTitle: string;
  requestType: 'enquiry' | 'booking' | string;
  status: string;
  paymentStatus: string;
  message: string;
  createdAt: string;
  canCancel: boolean;
}

export interface StudentSupportState {
  status: string;
  priority: string;
  updatedAt: string | null;
}

export interface StudentOverview {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    whatsapp: string;
    nationality: string;
    currentCountry: string;
    destinationCountry: string;
    destinationCity: string;
    preferredSchool: string;
    preferredProgram: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
    passportNumberMasked: string;
    passportExpiryDate: string;
    profilePhotoUrl: string;
    university: string;
    countryOfOrigin: string;
    completionPercent: number;
  };
  onboarding: {
    programDurationBand: string | null;
    onboardingCompleted: boolean;
  };
  dashboard: {
    tasks: StudentDashboardTask[];
    guidance: string;
  };
  housing: {
    savedCount: number;
    requestCount: number;
    bookingCount: number;
    recentRequests: StudentHousingRequest[];
  };
  documents: {
    total: number;
    verified: number;
    rejected: number;
    pending: number;
  };
  applications: {
    schoolCount: number;
    jobCount: number;
  };
  orders: {
    foodCount: number;
  };
  arrival: ArrivalBooking | null;
  payments: unknown[];
  support: StudentSupportState;
  notifications: StudentNotificationItem[];
}

// ─── HOUSING ───
// Matches StudentHousingListingView from backend exactly
export interface StudentHousingListingView {
  id: number;
  title: string;
  location: string;
  city: string;
  price: number;
  type: string;
  status: string;
  details: string;
  imageUrl: string;
  trustScore: number;
  saved: boolean;
  requestStatus: string | null;
  paymentStatus: string | null;
  availableLabel: string;
  amenityTags: string[];
  address: string;
  approximateAddress: boolean;
  mapLocation: string;
  propertyType: string;
  roomType: string;
  currency: string;
  deposit: number;
  agencyFee: number;
  availabilityDate: string;
  minimumStay: number;
  maximumOccupants: number;
  genderPreference: string;
  amenities: string[];
  houseRules: string[];
  utilitiesIncluded: string[];
  utilitiesNotIncluded: string[];
  internetAvailability: string;
  heating: string;
  furnishingStatus: string;
  nearbySchoolUniversity: string;
  transportAccess: string;
  safetyNotes: string;
  contractTerms: string;
  cancellationPolicy: string;
  images: Array<{ url: string; caption: string }>;
  partnerName: string;
  partnerUserId: number | null;
}

export interface HousingResponse {
  listings: StudentHousingListingView[];
  requests: StudentHousingRequest[];
}

// ─── FOOD ───
// Matches getFoodData return exactly: items (not menu), name (not itemName)
export interface FoodItem {
  id: number;
  name: string;         // backend returns 'name' not 'itemName'
  price: number;
  deliveryFee: number;
  kitchen: string;
  supplierUserId: number | null;
  time: string;
  rating: number;
  img: string | null;   // backend returns 'img' not 'imageUrl'
  tags: string[];
}

export interface FoodOrder {
  id: number;
  itemName: string;
  total: number;
  fulfillment: string;
  status: string;
  paymentStatus: string;
  supplierUserId: number | null;
  customerNote: string;
  supplierReply: string;
  deliveryAddress: string;
  contactPhone: string;
  timeline: unknown[];
  canCancel: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FoodResponse {
  items: FoodItem[];       // backend returns 'items' not 'menu'
  orders: FoodOrder[];
  todayNewItemCount: number;
}

// ─── JOBS ───
// Matches getStudentJobBoard return exactly
export interface StudentJobBoardItem {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string | null;
  type: string;         // backend returns 'type' from job_type column
  logo: string | null;
  description: string;
  applied: boolean;
  saved: boolean;
  applicationStatus: string | null;
}

export interface JobsResponse {
  jobs: StudentJobBoardItem[];
  savedCount: number;
  appliedCount: number;
}

// ─── DOCUMENTS ───
export type DocumentType =
  | 'passport' | 'offer_letter' | 'health_insurance'
  | 'residence_permit' | 'visa' | 'bank_statement'
  | 'photo_id' | 'other';

export interface StudentDocument {
  id: number;
  name: string;
  type: DocumentType;
  fileUrl: string;
  storageKey: string;
  uploadedAt: string;
  status?: string;
}

export interface DocumentsResponse {
  documents: StudentDocument[];
}

// ─── ARRIVAL ───
export type TravelType = 'airport_pickup' | 'city_transfer' | 'intercity' | 'custom';

export interface ArrivalBooking {
  id: number | null;
  origin: string;
  airportCode?: string;
  destination: string;
  travelType: TravelType | string;
  travelDate: string;
  travelTime: string;
  passengerCount: number;
  pickupStatus: string;
  pickupBooked: boolean;
  notes?: string;
  status?: string;
  serviceDetails?: Record<string, unknown>;
  requesterLocation?: { latitude: number | null; longitude: number | null } | null;
  serviceTitle?: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicleNote?: string;
  quotedPriceEur?: number;
  assignedTransportUserId?: number | null;
  assignedVehicleId?: number | null;
  timeline?: unknown[];
  canCancel?: boolean;
}

export interface TransportProvider {
  id: number;
  name: string;
  serviceTypes: string[];
  contact: string;
}

export interface ArrivalResponse {
  booking: ArrivalBooking | null;
  directory: TransportProvider[];
}

// ─── PROGRAMS ───
// Backend: { id, partnerUserId, schoolName, title (not programName), description, duration, tuitionLabel (string), status, language, startDate, applicationOpen }
export interface SchoolProgram {
  id: number;
  partnerUserId: number;
  schoolName: string;
  title: string;           // backend returns 'title' not 'programName'
  description: string;
  duration: string;
  tuitionLabel: string;    // backend returns 'tuitionLabel' (string) not tuitionFee/currency
  status: string;
  language: string;
  startDate: string;
  applicationOpen: boolean;
}

export interface ProgramApplication {
  programId: number;
  programName: string;
  schoolName: string;
  status: string;
  appliedAt: string;
  note: string;
}

export interface ProgramsResponse {
  programs: SchoolProgram[];
  applications: ProgramApplication[];
}

// ─── PROFILE ───
export interface StudentProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  phone: string | null;
  whatsapp: string | null;
  nationality: string | null;
  currentCountry: string | null;
  destinationCountry: string | null;
  destinationCity: string | null;
  preferredSchool: string | null;
  preferredProgram: string | null;
  university: string | null;
  profilePhotoUrl: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  passportNumberMasked: string | null;
  passportExpiryDate: string | null;
  completionPercent: number;
}

// ─── MESSAGES ───
export interface ConversationParticipant {
  userId: number;
  name: string;
  userType: string;
}

export interface ConversationSummary {
  id: number;
  participants: ConversationParticipant[];
  lastMessage: { content: string; sentAt: string; senderUserId: number } | null;
  unreadCount: number;
  subject: string | null;
}

export interface ConversationMessage {
  id: number;
  conversationId: number;
  senderUserId: number;
  content: string;
  sentAt: string;
  readAt: string | null;
}

export interface MessagesResponse {
  conversations: ConversationSummary[];
}

// ─── SUPPORT ───
export interface SupportMessage {
  id: number;
  content: string;
  senderType: 'user' | 'support' | string;
  sentAt: string;
}

export interface SupportResponse {
  messages: SupportMessage[];
  status: 'open' | 'closed';
}
