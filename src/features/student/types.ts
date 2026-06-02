import type { UserType } from '@/src/types';

export interface StudentOverview {
  firstName: string;
  completionPercent: number;
  nextSteps: Array<{ title: string; done: boolean }>;
  housingStatus: string | null;
  jobsCount: number;
  communityCirclesCount: number;
  recentActivity: Array<{ type: string; description: string; createdAt: string }>;
  university: string;
  countryOfOrigin: string;
  arrivalDate: string | null;
}

export interface StudentHousingListingView {
  id: number;
  title: string;
  location: string;
  price: number;
  type: string;
  status: string;
  details: string;
  imageUrl: string | null;
  trustScore: number;
  saved: boolean;
  requestStatus: string | null;
  amenityTags: string[];
  currency: string;
  deposit: number | null;
  partnerName: string;
}

export interface HousingRequest {
  id: number;
  listingId: number;
  listingTitle: string;
  requestType: 'enquiry' | 'booking' | string;
  status: string;
  createdAt: string;
}

export interface HousingResponse {
  listings: StudentHousingListingView[];
  favorites: number[];
  activeRequests: HousingRequest[];
}

export interface FoodMenuItem {
  id: number;
  itemName: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl: string | null;
  supplierName: string;
  available: boolean;
}

export interface FoodOrder {
  id: number;
  itemName: string;
  itemId: number;
  fulfillment: 'delivery' | 'pickup' | string;
  total: number;
  status: string;
  createdAt: string;
  supplierUserId: number;
}

export interface FoodResponse {
  menu: FoodMenuItem[];
  orders: FoodOrder[];
}

export interface JobPost {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string | null;
  description: string;
  requirements: string;
  postedAt: string;
  saved: boolean;
  applied: boolean;
  partnerUserId: number;
}

export interface JobApplication {
  jobId: number;
  title: string;
  company: string;
  appliedAt: string;
  status: string;
}

export interface JobsResponse {
  jobs: JobPost[];
  applications: JobApplication[];
}

export type DocumentType =
  | 'passport'
  | 'offer_letter'
  | 'health_insurance'
  | 'residence_permit'
  | 'visa'
  | 'bank_statement'
  | 'photo_id'
  | 'other';

export interface StudentDocument {
  id: number;
  name: string;
  type: DocumentType;
  fileUrl: string;
  storageKey: string;
  uploadedAt: string;
}

export interface DocumentsResponse {
  documents: StudentDocument[];
}

export type TravelType = 'airport_pickup' | 'city_transfer' | 'intercity' | 'custom';

export interface ArrivalBooking {
  id: number;
  origin: string;
  destination: string;
  travelType: TravelType | string;
  travelDate: string;
  travelTime: string;
  passengerCount: number;
  pickupBooked: boolean;
  status: string;
  serviceDetails?: Record<string, unknown>;
  requesterLocation?: { latitude: number; longitude: number } | null;
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

export interface SchoolProgram {
  id: number;
  schoolName: string;
  programName: string;
  duration: string;
  language: string;
  startDate: string;
  tuitionFee: number;
  currency: string;
  description: string;
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

