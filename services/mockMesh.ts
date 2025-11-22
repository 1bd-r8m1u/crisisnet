import { MeshState, Patient, SupplyStock, CriticalStatus, StaffMember, StaffStatus, SupplyRequest } from "../types";

// Helper to create a deterministic ID based on Name and DOB
export const generatePatientId = (name: string, dob: string) => {
  const cleanName = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanDob = dob.replace(/-/g, ''); // Remove dashes
  return `${cleanName}-${cleanDob}`;
};

// Detailed Supply Data
const INITIAL_SUPPLIES: SupplyStock[] = [
  { id: 's1', item: 'Amoxicillin 500mg', category: 'MEDICINE', quantity: 150, unit: 'capsules', criticalThreshold: 50, expiryDate: '2025-12-01', batchNum: 'AMX-99' },
  { id: 's2', item: 'Trauma Kit (Lvl 2)', category: 'TOOLS', quantity: 12, unit: 'kits', criticalThreshold: 20, batchNum: 'TRM-02' },
  { id: 's3', item: 'Potable Water', category: 'WATER', quantity: 500, unit: 'L', criticalThreshold: 200, expiryDate: '2024-01-01' },
  { id: 's4', item: 'MRE (Rations)', category: 'FOOD', quantity: 80, unit: 'packs', criticalThreshold: 100, expiryDate: '2026-05-15' },
  { id: 's5', item: 'O+ Blood Packs', category: 'BLOOD', quantity: 5, unit: 'packs', criticalThreshold: 10, expiryDate: '2023-11-15' },
  { id: 's6', item: 'Morphine Sulfate', category: 'MEDICINE', quantity: 30, unit: 'vials', criticalThreshold: 15, expiryDate: '2024-08-20' },
];

const INITIAL_STAFF: StaffMember[] = [
  { id: 'st1', name: 'Dr. Sarah Field', role: 'DOCTOR', status: StaffStatus.AVAILABLE, location: 'Triage Tent A', lastCheckIn: new Date().toISOString() },
  { id: 'st2', name: 'Dr. James Chen', role: 'SPECIALIST', status: StaffStatus.BUSY, location: 'Surgery Unit', lastCheckIn: new Date().toISOString() },
  { id: 'st3', name: 'Nurse Ratched', role: 'NURSE', status: StaffStatus.UNREACHABLE, location: 'Sector 4 (Mobile)', lastCheckIn: '2023-10-26T08:00:00Z' },
  { id: 'st4', name: 'Medic Bob', role: 'PARAMEDIC', status: StaffStatus.AVAILABLE, location: 'Supply Depot', lastCheckIn: new Date().toISOString() },
];

const INITIAL_PATIENTS: Patient[] = [
  {
    id: generatePatientId('John Doe', '1989-05-15'),
    name: 'John Doe',
    dateOfBirth: '1989-05-15',
    bloodType: 'O+',
    allergies: ['Penicillin'],
    conditions: ['Asthma'],
    status: CriticalStatus.STABLE,
    lastUpdated: new Date().toISOString(),
    geoHash: 'u4pru',
    records: [
      { id: 'r3', date: '2023-10-30', type: 'APPOINTMENT', description: 'Follow-up check on concussion symptoms.', doctorName: 'Dr. Field', location: 'Triage Tent A' },
      { id: 'r1', date: '2023-10-01', type: 'DIAGNOSIS', description: 'Mild Concussion from structural debris.', doctorName: 'Dr. Smith', location: 'Camp Alpha' },
      { id: 'r1-let', date: '2023-10-02', type: 'LETTER', description: 'Patient discharged with instructions to monitor for dizziness. Follow up in 48 hours if symptoms persist. Provided 3 days of analgesics.', doctorName: 'Dr. Smith', location: 'Camp Alpha' }
    ]
  },
  {
    id: generatePatientId('Jane Smith', '1995-11-22'),
    name: 'Jane Smith',
    dateOfBirth: '1995-11-22',
    bloodType: 'A-',
    allergies: [],
    conditions: [],
    status: CriticalStatus.CRITICAL,
    lastUpdated: new Date().toISOString(),
    geoHash: 'u4prv',
    records: [
       { id: 'r2', date: '2023-10-25', type: 'TREATMENT', description: 'Shrapnel removal, left leg', doctorName: 'Dr. M', location: 'Mobile Unit 2' }
    ]
  }
];

// Simulate local storage persistence - V3 to force fresh schema
const STORAGE_KEY = 'CRISIS_NET_MESH_DB_V3';

export const getMeshState = (): MeshState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const initialState: MeshState = {
    patients: INITIAL_PATIENTS,
    supplies: INITIAL_SUPPLIES,
    staff: INITIAL_STAFF,
    supplyRequests: [],
    connectedPeers: Math.floor(Math.random() * 15) + 1,
    lastSync: new Date().toISOString()
  };
  saveMeshState(initialState);
  return initialState;
};

export const saveMeshState = (state: MeshState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const updatePatient = (patient: Patient) => {
  const state = getMeshState();
  const index = state.patients.findIndex(p => p.id === patient.id);
  if (index >= 0) {
    state.patients[index] = patient;
  } else {
    state.patients.push(patient);
  }
  state.lastSync = new Date().toISOString();
  saveMeshState(state);
};

export const createSupplyRequest = (itemId: string, itemName: string, quantity: number, requester: string) => {
  const state = getMeshState();
  const newRequest: SupplyRequest = {
    id: Math.random().toString(36).substr(2, 9),
    itemId,
    itemName,
    quantity,
    requester,
    status: 'PENDING',
    timestamp: new Date().toISOString()
  };
  state.supplyRequests.unshift(newRequest);
  state.lastSync = new Date().toISOString();
  saveMeshState(state);
};