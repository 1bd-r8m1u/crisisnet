export enum Role {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  DIRECTOR = 'DIRECTOR'
}

export enum CriticalStatus {
  STABLE = 'STABLE',
  CRITICAL = 'CRITICAL',
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
  type: 'DIAGNOSIS' | 'TREATMENT' | 'VACCINATION' | 'NOTE' | 'LETTER' | 'APPOINTMENT';
  description: string;
  doctorName: string;
  location: string;
}

export interface Patient {
  id: string; // Derived from Name + DOB
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  bloodType: string;
  allergies: string[];
  conditions: string[];
  status: CriticalStatus;
  lastUpdated: string;
  records: MedicalRecord[];
  geoHash: string; // Simulated location
}

export interface SupplyStock {
  id: string;
  item: string;
  category: 'MEDICINE' | 'TOOLS' | 'FOOD' | 'WATER' | 'BLOOD';
  quantity: number;
  unit: string;
  criticalThreshold: number;
  expiryDate?: string;
  batchNum?: string;
}

export interface SupplyRequest {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  requester: string;
  status: 'PENDING' | 'APPROVED' | 'FULFILLED';
  timestamp: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'DOCTOR' | 'NURSE' | 'PARAMEDIC' | 'SPECIALIST';
  status: StaffStatus;
  location: string;
  lastCheckIn: string;
}

export interface OutbreakSignal {
  region: string;
  symptomCluster: string;
  count: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface MeshState {
  patients: Patient[];
  supplies: SupplyStock[];
  staff: StaffMember[];
  supplyRequests: SupplyRequest[];
  connectedPeers: number;
  lastSync: string;
}