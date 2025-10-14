export interface DoctorService {
  name: string;
  description: string;
  price: number;
  duration: number;
  _id?: string;
}

export interface WorkingSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  _id?: string;
}

export interface WorkingDay {
  day: string;
  slots: WorkingSlot[];
  _id?: string;
}

export interface DoctorAvailability {
  workingDays: WorkingDay[];
  isAvailableForHomeVisits: boolean;
  isAvailableForOnlineConsultations: boolean;
  isAvailableForInPersonConsultations: boolean;
  noticePeriod: number;
}

export interface ConsultationFees {
  inPerson: number;
  video: number;
  homeVisit: number;
  currency: string;
}

export interface DoctorLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates: [number, number];
}

export interface PracticeInfo {
  clinicName: string;
  clinicAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  emergencyContact: string;
}

export interface Language {
  language: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
  _id?: string;
}

export interface Experience {
  position: string;
  hospital: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  description: string;
  _id?: string;
}

export interface Award {
  title: string;
  organization: string;
  year: number;
  description: string;
  _id?: string;
}

export interface Publication {
  title: string;
  publisher: string;
  publicationDate: Date;
  url: string;
  description: string;
  _id?: string;
}

export interface AcceptedInsurance {
  name: string;
  isActive: boolean;
  notes: string;
  _id?: string;
}

export interface SocialMedia {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  website?: string;
}

export interface DoctorProfileData {
  title: string;
  gender: string;
  professionalSummary: string;
  profileImage?: {
    public_id: string;
    url?: string;
  };
  location: DoctorLocation;
  specialties: string[];
  experience: Experience[];
  yearsOfExperience: number;
  services: DoctorService[];
  languages: Language[];
  availability: DoctorAvailability;
  consultationFees: ConsultationFees;
  awards: Award[];
  publications: Publication[];
  rating: number;
  totalReviews: number;
  socialMedia: SocialMedia;
  isProfileComplete: boolean;
  lastProfileUpdate?: Date;
  practiceInfo: PracticeInfo;
  acceptedInsurances: AcceptedInsurance[];
}

// Education Details
export interface EducationDetails {
  certificate: string; // URL to uploaded file
  medicalSchool: string;
  graduationYear: number;
  degree: string;
  _id?: string;
}

// Internship Details
export interface Internship {
  proof?: string; // URL to uploaded file
  hospitalName?: string;
  startDate?: Date;
  endDate?: Date;
  supervisor?: string;
  _id?: string;
}

// MDCN Registration
export interface MDCNRegistration {
  registrationType: 'provisional' | 'full' | 'foreign';
  folioNumber: string;
  registrationCertificate: string; // URL to uploaded file
  practicingLicense: string; // URL to uploaded file
  _id?: string;
}

// Foreign Credentials
export interface ForeignCredentials {
  degree?: string;
  regulatoryAuthority?: string;
  licenseNumber?: string;
  goodStandingLetter?: string; // URL to uploaded file
  _id?: string;
}

// Additional Qualification
export interface AdditionalQualification {
  certificate: string; // URL to uploaded file
  institution: string;
  dateObtained: Date;
  qualificationName: string;
  _id?: string;
}

// CPD (Continuing Professional Development)
export interface CPD {
  proof: string; // URL to uploaded file
  units: number;
  dateCompleted: Date;
  _id?: string;
}

export interface DoctorProfile {
  _id: string;
  user: string;
  
  // Personal Details
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  contactAddress: string;
  phoneNumber: string;
  email: string;
  workHospitalName?: string;
  speciality: string;
  idNumber: string;
  idPhoto: string; // URL to uploaded file
  
  // Education
  secondaryEducation?: string; // URL to uploaded file
  medicalDegree: string; // URL to uploaded file
  educationDetails?: EducationDetails;
  
  // Internship
  internship?: Internship;
  
  // Application Status
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  
  // Professional Profile
  profile: DoctorProfileData;
  isProfileComplete?: boolean;
  
  // Verification Badges
  isVerified: boolean;
  verificationBadges: ('identity' | 'education' | 'license' | 'experience' | 'premium')[];
  
  // Payout & Settlement (Paystack)
  subaccountCode?: string; // Paystack subaccount for automatic split
  payoutRecipientCode?: string; // Paystack transfer recipient for manual payouts
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  bankVerified: boolean;
  pendingBalance: number; // NGN amount pending payout (manual path)
  totalEarnings: number; // Cumulative earnings
  
  // Admin Fields
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}