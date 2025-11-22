
import { MeshState, Patient, SupplyStock, CriticalStatus, StaffMember, StaffStatus, SupplyRequest, Hospital, TransportRequest, PatientTransferRequest, EmergencyAlert } from "../types";

// --- AEGIS CSV DATA INTEGRATION ---

const HOSPITALS_CSV: Hospital[] = [
  { id: 'H100', name: 'Al-Nour General', province: 'North Province', type: 'General', capacity: 193, coordinates: { lat: 31.511331, lng: 34.44155 } },
  { id: 'H101', name: 'Mercy Field Hospital', province: 'Coastal Province', type: 'Field', capacity: 92, coordinates: { lat: 31.323211, lng: 34.236471 } },
  { id: 'H102', name: 'Eastern Relief Clinic', province: 'Eastern Province', type: 'Clinic', capacity: 203, coordinates: { lat: 31.440668, lng: 34.345367 } },
  { id: 'H103', name: 'Harbor Medical Center', province: 'Delta Province', type: 'Referral', capacity: 181, coordinates: { lat: 31.521922, lng: 34.429797 } },
  { id: 'H104', name: 'St. Brigid Outreach', province: 'Mountain Province', type: 'Outreach', capacity: 54, coordinates: { lat: 31.291331, lng: 34.24155 } },
];

const USERS_CSV: StaffMember[] = [
  { id: 'U001', name: 'Dr. Alia Kareem', role: 'director', hospitalId: 'H100', email: 'alia.kareem@h100.org', phone: '+1004668136', status: StaffStatus.AVAILABLE, lastCheckIn: new Date().toISOString() },
  { id: 'U002', name: 'Dr. Amin Sufyan', role: 'doctor', hospitalId: 'H100', email: 'amin.sufyan@h100.org', phone: '+1004903402', status: StaffStatus.BUSY, lastCheckIn: new Date().toISOString() },
  { id: 'U003', name: 'Dr. Lina Qadir', role: 'doctor', hospitalId: 'H100', email: 'lina.qadir@h100.org', phone: '+1009478454', status: StaffStatus.AVAILABLE, lastCheckIn: new Date().toISOString() },
  { id: 'U004', name: 'Dr. Yusuf Rahman', role: 'doctor', hospitalId: 'H100', email: 'yusuf.rahman@h100.org', phone: '+1001445199', status: StaffStatus.OFF_DUTY, lastCheckIn: new Date().toISOString() },
  { id: 'U005', name: 'Dr. Dalia Mourad', role: 'director', hospitalId: 'H101', email: 'dalia.mourad@h101.org', phone: '+1005328891', status: StaffStatus.AVAILABLE, lastCheckIn: new Date().toISOString() },
  { id: 'U006', name: 'Dr. Noor Bakkar', role: 'doctor', hospitalId: 'H101', email: 'noor.bakkar@h101.org', phone: '+1005120032', status: StaffStatus.BUSY, lastCheckIn: new Date().toISOString() },
  { id: 'U007', name: 'Dr. Haris Eldin', role: 'director', hospitalId: 'H102', email: 'haris.eldin@h102.org', phone: '+1004321102', status: StaffStatus.UNREACHABLE, lastCheckIn: new Date().toISOString() },
  { id: 'U008', name: 'Dr. Mariam Halim', role: 'doctor', hospitalId: 'H102', email: 'mariam.halim@h102.org', phone: '+1007433884', status: StaffStatus.AVAILABLE, lastCheckIn: new Date().toISOString() },
  { id: 'U009', name: 'Dr. Faiz Almas', role: 'director', hospitalId: 'H103', email: 'faiz.almas@h103.org', phone: '+1001993223', status: StaffStatus.AVAILABLE, lastCheckIn: new Date().toISOString() },
  { id: 'U010', name: 'Dr. Reem Alawi', role: 'doctor', hospitalId: 'H103', email: 'reem.alawi@h103.org', phone: '+1005667231', status: StaffStatus.BUSY, lastCheckIn: new Date().toISOString() },
  { id: 'U011', name: 'Dr. Jonah Eren', role: 'director', hospitalId: 'H104', email: 'jonah.eren@h104.org', phone: '+1004223104', status: StaffStatus.AVAILABLE, lastCheckIn: new Date().toISOString() },
  { id: 'U012', name: 'Dr. Sia Farah', role: 'doctor', hospitalId: 'H104', email: 'sia.farah@h104.org', phone: '+1009011330', status: StaffStatus.AVAILABLE, lastCheckIn: new Date().toISOString() },
];

// Raw Patient Data from CSV
const PATIENTS_RAW = [
  { id: 'P1000', name: 'Khaled Saar', hospitalId: 'H102', docId: 'U008', blood: 'O-', allergies: ['Peanuts'], pres: ['Insulin'], last: '2025-10-15', cond: ['Trauma'] },
  { id: 'P1001', name: 'Mira Joud', hospitalId: 'H100', docId: 'U004', blood: 'A+', allergies: ['Latex'], pres: ['Prenatal Vitamins'], last: '2025-11-17', cond: ['Pregnancy'] },
  { id: 'P1002', name: 'Faris Leyth', hospitalId: 'H102', docId: 'U008', blood: 'O-', allergies: [], pres: ['Metformin'], last: '2025-10-17', cond: ['Diabetes'] },
  { id: 'P1003', name: 'Samira Daan', hospitalId: 'H101', docId: 'U006', blood: 'B-', allergies: ['Dust'], pres: ['Ventolin'], last: '2025-11-11', cond: ['Asthma'] },
  { id: 'P1004', name: 'Nour Sabri', hospitalId: 'H103', docId: 'U010', blood: 'AB+', allergies: ['Shellfish'], pres: ['Ibuprofen'], last: '2025-11-09', cond: ['Infection'] },
  { id: 'P1005', name: 'Lamia Eren', hospitalId: 'H104', docId: 'U012', blood: 'O+', allergies: ['Penicillin'], pres: [], last: '2025-09-22', cond: ['Dehydration'] },
  { id: 'P1006', name: 'Tariq Basim', hospitalId: 'H100', docId: 'U003', blood: 'B+', allergies: [], pres: ['Painkillers'], last: '2025-10-30', cond: ['Fracture'] },
  { id: 'P1007', name: 'Yara Shireen', hospitalId: 'H101', docId: 'U006', blood: 'A-', allergies: [], pres: [], last: '2025-11-01', cond: ['Cold symptoms'] },
  { id: 'P1008', name: 'Laith Omar', hospitalId: 'H103', docId: 'U010', blood: 'O+', allergies: ['Dust'], pres: ['Insulin'], last: '2025-11-12', cond: ['Diabetic episode'] },
  { id: 'P1009', name: 'Malak Zidan', hospitalId: 'H104', docId: 'U012', blood: 'B+', allergies: ['Peanuts'], pres: ['Antibiotics'], last: '2025-11-18', cond: ['Bacterial infection'] },
  { id: 'P1010', name: 'Adnan Nouri', hospitalId: 'H100', docId: 'U002', blood: 'O-', allergies: [], pres: [], last: '2025-11-16', cond: ['Chest Pain'] },
  { id: 'P1011', name: 'Reem Fazal', hospitalId: 'H100', docId: 'U003', blood: 'A+', allergies: ['Shellfish'], pres: ['Painkillers'], last: '2025-11-03', cond: ['Fever'] },
  { id: 'P1012', name: 'Rani Musa', hospitalId: 'H102', docId: 'U008', blood: 'B-', allergies: [], pres: [], last: '2025-10-11', cond: ['Checkup'] },
  { id: 'P1013', name: 'Omar Nabil', hospitalId: 'H102', docId: 'U008', blood: 'O+', allergies: ['Pollen'], pres: ['Metformin'], last: '2025-11-10', cond: ['Diabetes follow-up'] },
  { id: 'P1014', name: 'Salma Rami', hospitalId: 'H103', docId: 'U010', blood: 'A-', allergies: ['Latex'], pres: ['Antibiotics'], last: '2025-10-28', cond: ['Injury'] },
  { id: 'P1015', name: 'Fadi Harun', hospitalId: 'H104', docId: 'U012', blood: 'O+', allergies: [], pres: [], last: '2025-11-05', cond: ['Skin rash'] },
  { id: 'P1016', name: 'Ruba Hadi', hospitalId: 'H104', docId: 'U012', blood: 'B+', allergies: ['Penicillin'], pres: [], last: '2025-11-12', cond: ['Fever'] },
  { id: 'P1017', name: 'Darim Noor', hospitalId: 'H101', docId: 'U006', blood: 'AB-', allergies: [], pres: ['Ventolin'], last: '2025-11-14', cond: ['Asthma check'] },
  { id: 'P1018', name: 'Naji Sulaym', hospitalId: 'H100', docId: 'U002', blood: 'O+', allergies: [], pres: [], last: '2025-11-08', cond: ['Headache'] },
  { id: 'P1019', name: 'Aliya Fay', hospitalId: 'H103', docId: 'U010', blood: 'A+', allergies: ['Peanuts'], pres: ['Painkillers'], last: '2025-11-18', cond: ['Joint pain'] }
];

const REPORTS_CSV: SupplyStock[] = [
  // H100 - General
  { id: 'R3000', hospitalId: 'H100', item: 'Insulin', category: 'MEDICINE', quantity: 733, unit: 'vials', criticalThreshold: 100, dailyUsage: 4, predictedShortage: '2025-12-08' },
  { id: 'R3001', hospitalId: 'H100', item: 'Bandages', category: 'TOOLS', quantity: 206, unit: 'rolls', criticalThreshold: 100, dailyUsage: 18, predictedShortage: '2025-11-29' },
  { id: 'R3006', hospitalId: 'H100', item: 'Trauma Kits', category: 'TOOLS', quantity: 15, unit: 'kits', criticalThreshold: 25, dailyUsage: 3, predictedShortage: '2025-11-25' },
  { id: 'R3007', hospitalId: 'H100', item: 'Generator Fuel', category: 'TOOLS', quantity: 450, unit: 'Liters', criticalThreshold: 200, dailyUsage: 50, predictedShortage: '2025-11-30' },
  { id: 'R3008', hospitalId: 'H100', item: 'O- Blood', category: 'BLOOD', quantity: 8, unit: 'pints', criticalThreshold: 10, dailyUsage: 2, predictedShortage: '2025-11-23' },

  // H101 - Field Hospital
  { id: 'R3002', hospitalId: 'H101', item: 'IV Fluids', category: 'MEDICINE', quantity: 120, unit: 'bags', criticalThreshold: 50, dailyUsage: 15, predictedShortage: '2025-11-30' },
  { id: 'R3009', hospitalId: 'H101', item: 'Sutures', category: 'TOOLS', quantity: 45, unit: 'packs', criticalThreshold: 30, dailyUsage: 8, predictedShortage: '2025-11-26' },
  { id: 'R3010', hospitalId: 'H101', item: 'Tetanus Toxoid', category: 'MEDICINE', quantity: 80, unit: 'vials', criticalThreshold: 20, dailyUsage: 4, predictedShortage: '2025-12-10' },

  // H102 - Clinic
  { id: 'R3003', hospitalId: 'H102', item: 'Antibiotics', category: 'MEDICINE', quantity: 540, unit: 'packs', criticalThreshold: 100, dailyUsage: 20, predictedShortage: '2025-12-07' },
  { id: 'R3011', hospitalId: 'H102', item: 'PPE (Gloves)', category: 'TOOLS', quantity: 1200, unit: 'pairs', criticalThreshold: 500, dailyUsage: 100, predictedShortage: '2025-12-01' },
  { id: 'R3012', hospitalId: 'H102', item: 'Amoxicillin', category: 'MEDICINE', quantity: 20, unit: 'bottles', criticalThreshold: 50, dailyUsage: 5, predictedShortage: '2025-11-24' },

  // H103 - Referral
  { id: 'R3004', hospitalId: 'H103', item: 'Insulin', category: 'MEDICINE', quantity: 220, unit: 'vials', criticalThreshold: 50, dailyUsage: 12, predictedShortage: '2025-11-27' },
  { id: 'R3013', hospitalId: 'H103', item: 'Anesthetics (Lidocaine)', category: 'MEDICINE', quantity: 140, unit: 'vials', criticalThreshold: 100, dailyUsage: 10, predictedShortage: '2025-12-05' },
  { id: 'R3014', hospitalId: 'H103', item: 'Surgical Mesh', category: 'TOOLS', quantity: 30, unit: 'units', criticalThreshold: 15, dailyUsage: 2, predictedShortage: '2025-12-15' },

  // H104 - Outreach
  { id: 'R3005', hospitalId: 'H104', item: 'Bandages', category: 'TOOLS', quantity: 90, unit: 'rolls', criticalThreshold: 50, dailyUsage: 10, predictedShortage: '2025-11-30' },
  { id: 'R3015', hospitalId: 'H104', item: 'Water Purification Tablets', category: 'TOOLS', quantity: 5000, unit: 'tabs', criticalThreshold: 1000, dailyUsage: 200, predictedShortage: '2025-12-12' },
  { id: 'R3016', hospitalId: 'H104', item: 'Paracetamol', category: 'MEDICINE', quantity: 800, unit: 'strips', criticalThreshold: 200, dailyUsage: 40, predictedShortage: '2025-12-08' },
];

const ORDERS_CSV: SupplyRequest[] = [
  { id: 'O2000', requester: 'U009', requesterName: 'Dr. Faiz Almas', hospitalId: 'H103', targetHospitalId: 'H100', severity: 'low', itemName: 'Request for Insulin', requiredByDate: '2025-11-22', resourceTypes: ['Medicine'], quantity: 450, status: 'PENDING', timestamp: '2025-11-20T22:56:41' },
  { id: 'O2001', requester: 'U009', requesterName: 'Dr. Faiz Almas', hospitalId: 'H103', targetHospitalId: 'H103', severity: 'critical', itemName: 'Bandages (Mass Casualty)', requiredByDate: '2025-11-21', resourceTypes: ['Tools'], quantity: 276, status: 'IN_PROGRESS', timestamp: '2025-11-19T20:56:41' },
  { id: 'O2002', requester: 'U011', requesterName: 'Dr. Jonah Eren', hospitalId: 'H104', targetHospitalId: 'H101', severity: 'medium', itemName: 'IV Fluids Dehydration', requiredByDate: '2025-11-23', resourceTypes: ['Medicine'], quantity: 300, status: 'PENDING', timestamp: '2025-11-20T19:10:12' },
  { id: 'O2003', requester: 'U007', requesterName: 'Dr. Haris Eldin', hospitalId: 'H102', targetHospitalId: 'H104', severity: 'low', itemName: 'Winter Antibiotics', requiredByDate: '2025-12-01', resourceTypes: ['Medicine'], quantity: 150, status: 'PENDING', timestamp: '2025-11-18T11:30:44' },
];

// --- LOGIC ---

// Helper to create a deterministic ID based on Name and DOB
export const generatePatientId = (name: string, dob: string) => {
  const cleanName = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanDob = dob.replace(/-/g, ''); // Remove dashes
  return `${cleanName}-${cleanDob}`;
};

// Generator for fake DOBS to satisfy constraints while using CSV data
const generateSimulatedDOB = (index: number): string => {
  // Generate dates between 1970 and 2010
  const year = 1970 + (index * 37 % 40);
  const month = 1 + (index * 7 % 12);
  const day = 1 + (index * 13 % 28);
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

const determineInitialStatus = (conds: string[]): CriticalStatus => {
  if (conds.includes('Trauma') || conds.includes('Diabetic episode') || conds.includes('Chest Pain')) return CriticalStatus.CRITICAL;
  if (conds.includes('Fever') || conds.includes('Infection')) return CriticalStatus.UNSTABLE;
  return CriticalStatus.STABLE;
}

const INITIAL_PATIENTS: Patient[] = PATIENTS_RAW.map((raw, index) => {
  const simulatedDob = generateSimulatedDOB(index);
  return {
    id: generatePatientId(raw.name, simulatedDob), // Internal deterministic ID
    externalId: raw.id, // CSV ID
    name: raw.name,
    dateOfBirth: simulatedDob,
    bloodType: raw.blood,
    allergies: raw.allergies,
    conditions: raw.cond,
    activePrescriptions: raw.pres,
    hospitalId: raw.hospitalId,
    assignedDoctorId: raw.docId,
    status: determineInitialStatus(raw.cond),
    lastUpdated: new Date(raw.last).toISOString(),
    geoHash: Math.random().toString(36).substring(2, 8).toUpperCase(), // Random random GeoHash
    records: [
      {
        id: `rec-${raw.id}-1`,
        date: new Date(raw.last).toISOString(),
        type: 'NOTE',
        description: `Condition Summary: ${raw.cond.join(', ')}. Active Rx: ${raw.pres.join(', ') || 'None'}.`,
        doctorName: USERS_CSV.find(u => u.id === raw.docId)?.name || 'Unknown Doc',
        location: HOSPITALS_CSV.find(h => h.id === raw.hospitalId)?.name || 'Unknown Loc'
      }
    ]
  };
});

// Simulate local storage persistence - V8 to force fresh schema
const STORAGE_KEY = 'CRISIS_NET_MESH_DB_V9_5';

export const getMeshState = (): MeshState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const initialState: MeshState = {
    patients: INITIAL_PATIENTS,
    supplies: REPORTS_CSV,
    staff: USERS_CSV,
    hospitals: HOSPITALS_CSV,
    supplyRequests: ORDERS_CSV,
    transportRequests: [],
    transferRequests: [],
    alerts: [],
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

export const bookAppointment = (patientId: string, reason: string, requestedDate: string) => {
  const state = getMeshState();
  const patient = state.patients.find(p => p.id === patientId);
  if (patient) {
    patient.records.unshift({
      id: 'APT-' + Math.random().toString(36).substr(2, 6),
      date: requestedDate,
      type: 'APPOINTMENT',
      description: `Requested: ${reason}`,
      doctorName: 'Pending Assignment',
      location: 'TBD',
      metadata: {
        status: 'PENDING',
        originalDate: requestedDate
      }
    });
    saveMeshState(state);
  }
};

export const updateAppointment = (
  patientId: string, 
  recordId: string, 
  status: 'CONFIRMED' | 'POSTPONED' | 'CANCELLED', 
  newDate?: string,
  newDoctorId?: string,
  newDoctorName?: string
) => {
  const state = getMeshState();
  const patient = state.patients.find(p => p.id === patientId);
  if (patient) {
    const record = patient.records.find(r => r.id === recordId);
    if (record && record.type === 'APPOINTMENT') {
      if (!record.metadata) record.metadata = {};
      
      record.metadata.status = status;
      
      if (status === 'CONFIRMED') {
         record.description = record.description.replace('Requested:', 'Confirmed:');
      } else if (status === 'POSTPONED' && newDate) {
         let desc = `Postponed to ${newDate}. `;
         if (newDoctorName) {
           desc += `Reassigned to Dr. ${newDoctorName}. `;
           record.doctorName = newDoctorName;
           if (newDoctorId) patient.assignedDoctorId = newDoctorId; // Optionally reassign primary
         }
         record.description = desc + record.description.replace(/Postponed.*?\.\s/, ''); // Avoid double prefix
         record.date = newDate;
      }
      
      saveMeshState(state);
    }
  }
};

export const addPatientCondition = (patientId: string, condition: string) => {
  const state = getMeshState();
  const patient = state.patients.find(p => p.id === patientId);
  if (patient) {
    patient.conditions.push(condition + " (Self-Reported)");
    patient.records.unshift({
      id: 'RPT-' + Math.random().toString(36).substr(2, 6),
      date: new Date().toISOString(),
      type: 'NOTE',
      description: `Patient self-reported condition: ${condition}`,
      doctorName: 'Self',
      location: 'Remote'
    });
    saveMeshState(state);
  }
};

export const addStaffMember = (member: StaffMember) => {
  const state = getMeshState();
  state.staff.push(member);
  saveMeshState(state);
}

export const updateStaffStatus = (id: string, status: StaffStatus) => {
  const state = getMeshState();
  const staff = state.staff.find(s => s.id === id);
  if (staff) {
    staff.status = status;
    staff.lastCheckIn = new Date().toISOString();
    saveMeshState(state);
  }
}

export const broadcastEmergencyAlert = (message: string, severity: 'info' | 'warning' | 'critical', senderName: string) => {
  const state = getMeshState();
  const alert: EmergencyAlert = {
    id: 'ALT-' + Math.random().toString(36).substr(2, 6),
    message,
    severity,
    senderName,
    timestamp: new Date().toISOString(),
    active: true
  };
  // Limit to most recent 5 active alerts
  state.alerts = [alert, ...state.alerts].slice(0, 5);
  saveMeshState(state);
}

export const createSupplyRequest = (
  itemName: string, 
  quantity: number, 
  requester: string, 
  hospitalId: string,
  severity: 'low' | 'medium' | 'critical',
  resourceTypes: string[],
  patientId?: string,
  patientName?: string,
  dateOverride?: string,
  requesterName?: string
) => {
  const state = getMeshState();
  
  let requiredByDate = new Date();
  if (dateOverride) {
    requiredByDate = new Date(dateOverride);
  } else {
    if (severity === 'critical') requiredByDate.setDate(requiredByDate.getDate() + 1);
    else if (severity === 'medium') requiredByDate.setDate(requiredByDate.getDate() + 3);
    else requiredByDate.setDate(requiredByDate.getDate() + 7);
  }

  const newRequest: SupplyRequest = {
    id: Math.random().toString(36).substr(2, 9),
    itemName,
    quantity,
    requester,
    requesterName,
    hospitalId,
    targetHospitalId: hospitalId, // Defaults to Internal/Self-targeted
    status: 'PENDING',
    severity,
    resourceTypes,
    patientId,
    patientName,
    requiredByDate: requiredByDate.toISOString().split('T')[0],
    timestamp: new Date().toISOString()
  };
  
  state.supplyRequests.unshift(newRequest);
  state.lastSync = new Date().toISOString();
  saveMeshState(state);
};

export const updateSupplyRequest = (
    requestId: string, 
    status: 'APPROVED' | 'FULFILLED' | 'IN_PROGRESS' | 'PENDING' | 'FULFILLED_EXTERNAL',
    approverId?: string,
    approverName?: string,
    externalEntityName?: string
) => {
  const state = getMeshState();
  const index = state.supplyRequests.findIndex(r => r.id === requestId);
  
  if (index !== -1) {
    const req = state.supplyRequests[index];
    req.status = status;
    if (approverId) req.approverId = approverId;
    if (approverName) req.approverName = approverName;
    if (externalEntityName) req.externalEntityName = externalEntityName;

    // External Fulfillment Logic (NGOs)
    // "if given by an NGO, it will come in like how it works now" -> Adds to requester inventory
    if (status === 'FULFILLED_EXTERNAL') {
        const requesterStock = state.supplies.find(s => 
            s.hospitalId === req.hospitalId && 
            (s.item === req.itemName || (req.resourceTypes && req.resourceTypes.some(rt => s.item.includes(rt))))
        );

        if (requesterStock) {
            requesterStock.quantity += req.quantity;
        } else {
            state.supplies.push({
                id: 'NGO-' + Math.random().toString(36).substr(2, 6),
                hospitalId: req.hospitalId,
                item: req.itemName,
                category: 'TOOLS', 
                quantity: req.quantity,
                unit: 'units',
                criticalThreshold: 10 
            });
        }
       state.lastSync = new Date().toISOString();
       saveMeshState(state);
       return;
    }

    // Director Approval Logic (Local Inventory)
    // "when the director of one clinic accepts a request locally, it comes out of their inventory"
    if (status === 'APPROVED') {
        const approver = state.staff.find(s => s.id === approverId);
        if (approver) {
            // Decrement Stock from Approver's Hospital
            const providerStock = state.supplies.find(s => 
                s.hospitalId === approver.hospitalId && 
                (s.item === req.itemName || (req.resourceTypes && req.resourceTypes.some(rt => s.item.includes(rt))))
            );
            
            if (providerStock) {
                providerStock.quantity = Math.max(0, providerStock.quantity - req.quantity);
            }

            // Only Increment Stock at Requester's Hospital if it's a transfer (different hospital)
            if (req.hospitalId !== approver.hospitalId) {
                const existingStock = state.supplies.find(s => 
                    s.hospitalId === req.hospitalId && 
                    (s.item === req.itemName || (req.resourceTypes && req.resourceTypes.some(rt => s.item.includes(rt))))
                );

                if (existingStock) {
                    existingStock.quantity += req.quantity;
                } else {
                    state.supplies.push({
                        id: 'NEW-' + Math.random().toString(36).substr(2, 6),
                        hospitalId: req.hospitalId,
                        item: req.itemName,
                        category: providerStock?.category || 'TOOLS',
                        quantity: req.quantity,
                        unit: providerStock?.unit || 'units',
                        criticalThreshold: 10
                    });
                }
            }
        }
    }

    state.lastSync = new Date().toISOString();
    saveMeshState(state);
  }
};

export const broadcastSupplyRequest = (requestId: string) => {
  const state = getMeshState();
  const req = state.supplyRequests.find(r => r.id === requestId);
  if (req) {
    req.targetHospitalId = 'BROADCAST';
    req.status = 'PENDING'; // Reset status to pending so others can pick it up
    state.lastSync = new Date().toISOString();
    saveMeshState(state);
  }
}

export const createTransportRequest = (
  requesterId: string, 
  originHospitalId: string, 
  type: 'SUPPLY_RUN' | 'PATIENT_TRANSFER' | 'STAFF_ROTATION', 
  notes: string,
  destinationHospitalId?: string
) => {
  const state = getMeshState();
  const newReq: TransportRequest = {
    id: 'TR-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
    requesterId,
    originHospitalId,
    destinationHospitalId,
    type,
    notes,
    status: 'SCHEDULED',
    timestamp: new Date().toISOString()
  };
  state.transportRequests.unshift(newReq);
  saveMeshState(state);
}

export const acceptTransportRequest = (requestId: string) => {
  const state = getMeshState();
  const req = state.transportRequests.find(r => r.id === requestId);
  if (req) {
    req.status = 'EN_ROUTE';
    state.lastSync = new Date().toISOString();
    saveMeshState(state);
  }
}

export const requestPatientTransfer = (
  patientId: string,
  patientName: string,
  currentHospitalId: string,
  requesterId: string,
  urgency: 'IMMEDIATE' | 'STABLE',
  reason: string,
  suggestedTargetHospitalId?: string
) => {
  const state = getMeshState();
  const newTransfer: PatientTransferRequest = {
    id: 'TF-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
    patientId,
    patientName,
    currentHospitalId,
    requesterId,
    urgency,
    reason,
    status: 'PENDING',
    suggestedTargetHospitalId,
    timestamp: new Date().toISOString()
  };
  state.transferRequests.unshift(newTransfer);
  saveMeshState(state);
}

export const acceptPatientTransfer = (transferId: string, targetHospitalId: string) => {
  const state = getMeshState();
  const transfer = state.transferRequests.find(t => t.id === transferId);
  if (transfer) {
    transfer.status = 'APPROVED';
    transfer.targetHospitalId = targetHospitalId;
    
    const patient = state.patients.find(p => p.id === transfer.patientId);
    if (patient) {
      const oldHospital = patient.hospitalId;
      patient.hospitalId = targetHospitalId;
      
      patient.records.unshift({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        type: 'TRANSFER',
        description: `Transfer Completed. Moved from ${oldHospital} to ${targetHospitalId}. Urgency: ${transfer.urgency}`,
        doctorName: 'System Director',
        location: targetHospitalId
      });
    }
    
    state.lastSync = new Date().toISOString();
    saveMeshState(state);
  }
}

export const rejectPatientTransfer = (transferId: string) => {
  const state = getMeshState();
  const transfer = state.transferRequests.find(t => t.id === transferId);
  if (transfer) {
    transfer.status = 'REJECTED';
    state.lastSync = new Date().toISOString();
    saveMeshState(state);
  }
}

// Mock data generator for resource trends
export const getResourceTrends = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    Insulin: Math.floor(Math.random() * 200) + 300,
    Bandages: Math.floor(Math.random() * 150) + 100,
    Antibiotics: Math.floor(Math.random() * 300) + 200,
  }));
};
