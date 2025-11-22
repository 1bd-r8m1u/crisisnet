
export enum Role {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  DIRECTOR = 'DIRECTOR'
}

export enum CriticalStatus {
  CRITICAL = 'CRITICAL',
  UNSTABLE = 'UNSTABLE',
  STABLE = 'STABLE',
  RECOVERING = 'RECOVERING',
  DISCHARGED = 'DISCHARGED',
  DECEASED = 'DECEASED'
}

export enum StaffStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  UNREACHABLE = 'UNREACHABLE',
  OFF_DUTY = 'OFF_DUTY'
}

export interface MedicalRecord {
  id: string;
  date: string;
  type: 'DIAGNOSIS' | 'TREATMENT' | 'VACCINATION' | 'NOTE' | 'LETTER' | 'APPOINTMENT' | 'PRESCRIPTION' | 'TRANSFER';
  description: string;
  doctorName: string;
  location: string;
  metadata?: {
    status?: 'PENDING' | 'CONFIRMED' | 'POSTPONED' | 'COMPLETED' | 'CANCELLED';
    originalDate?: string;
  };
}

export interface Patient {
  id: string; // Internal Mesh ID (Name+DOB)
  externalId: string; // CSV P1000 ID
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  bloodType: string;
  allergies: string[];
  conditions: string[];
  activePrescriptions: string[];
  hospitalId: string;
  assignedDoctorId: string;
  status: CriticalStatus;
  lastUpdated: string;
  records: MedicalRecord[];
  geoHash: string; 
  pendingConditions?: string[];
}

export interface Hospital {
  id: string;
  name: string;
  province: string;
  type: string;
  capacity: number;
  coordinates: { lat: number; lng: number };
}

export interface SupplyStock {
  id: string;
  hospitalId?: string;
  item: string;
  category: 'MEDICINE' | 'TOOLS' | 'FOOD' | 'WATER' | 'BLOOD';
  quantity: number;
  unit: string;
  criticalThreshold: number;
  expiryDate?: string;
  batchNum?: string;
  dailyUsage?: number;
  predictedShortage?: string;
}

export interface SupplyRequest {
  id: string;
  itemId?: string; // Optional if generic resource type
  resourceType?: string; // From CSV
  itemName: string;
  quantity: number;
  requester: string;
  hospitalId: string; // Origin hospital
  targetHospitalId?: string;
  approverId?: string; // Director who approved it
  patientId?: string; // Optional link to specific patient
  patientName?: string;
  status: 'PENDING' | 'APPROVED' | 'FULFILLED' | 'IN_PROGRESS';
  severity: 'low' | 'medium' | 'critical';
  requiredByDate: string;
  timestamp: string;
  reason?: string;
}

export interface TransportRequest {
  id: string;
  requesterId: string;
  originHospitalId: string;
  destinationHospitalId?: string;
  type: 'SUPPLY_RUN' | 'PATIENT_TRANSFER' | 'STAFF_ROTATION';
  notes: string;
  status: 'SCHEDULED' | 'EN_ROUTE' | 'COMPLETED';
  timestamp: string;
}

export interface PatientTransferRequest {
  id: string;
  patientId: string;
  patientName: string;
  currentHospitalId: string;
  targetHospitalId?: string;
  targetHospitalType?: string; // e.g. Needs "Surgery" or "Burn Unit"
  requesterId: string;
  reason: string;
  urgency: 'IMMEDIATE' | 'STABLE';
  status: 'PENDING' | 'APPROVED' | 'IN_TRANSIT';
  timestamp: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'doctor' | 'director' | 'nurse';
  hospitalId: string;
  email: string;
  phone: string;
  status: StaffStatus;
  lastCheckIn: string;
}

export interface MeshState {
  patients: Patient[];
  supplies: SupplyStock[];
  staff: StaffMember[];
  hospitals: Hospital[];
  supplyRequests: SupplyRequest[];
  transportRequests: TransportRequest[];
  transferRequests: PatientTransferRequest[];
  connectedPeers: number;
  lastSync: string;
}
