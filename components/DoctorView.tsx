
import React, { useState, useEffect } from 'react';
import { Patient, MedicalRecord, CriticalStatus, SupplyStock, StaffMember, Hospital, StaffStatus } from '../types';
import { Card, Button, Badge } from './ui_components';
import { getMedicalAssistantResponse } from '../services/geminiService';
import { updatePatient, createSupplyRequest, requestPatientTransfer, getMeshState, updateAppointment } from '../services/mockMesh';

interface DoctorViewProps {
  patients: Patient[];
  onDataUpdate: () => void;
}

export const DoctorView: React.FC<DoctorViewProps> = ({ patients, onDataUpdate }) => {
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(null);
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null);
  const [activeTab, setActiveTab] = useState<'PATIENTS' | 'APPOINTMENTS'>('PATIENTS');
  
  // Patient Selection
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  
  // Data State
  const [supplies, setSupplies] = useState<SupplyStock[]>([]);
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([]);
  
  // Clinical Entry State
  const [symptoms, setSymptoms] = useState('');
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [entryType, setEntryType] = useState<'NOTE' | 'PRESCRIPTION'>('NOTE');
  const [updateStatus, setUpdateStatus] = useState<CriticalStatus>(CriticalStatus.STABLE);

  // Supply Request State
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [supplyItem, setSupplyItem] = useState('');
  const [supplyQty, setSupplyQty] = useState(1);
  const [supplySeverity, setSupplySeverity] = useState<'low' | 'medium' | 'critical'>('low');
  const [supplyDate, setSupplyDate] = useState('');
  const [linkToPatient, setLinkToPatient] = useState(false);

  // Transfer State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferUrgency, setTransferUrgency] = useState<'IMMEDIATE' | 'STABLE'>('STABLE');
  const [transferReason, setTransferReason] = useState('');

  // Appointment Manage State
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<{patientId: string, recordId: string} | null>(null);
  const [newApptDate, setNewApptDate] = useState('');
  const [reassignDoctorId, setReassignDoctorId] = useState('');
  const [availableColleagues, setAvailableColleagues] = useState<StaffMember[]>([]);

  useEffect(() => {
    const state = getMeshState();
    setAvailableStaff(state.staff.filter(s => s.role === 'doctor'));
  }, []);

  useEffect(() => {
    if (currentUser) {
      const state = getMeshState();
      // Filter supplies for this doctor's hospital
      const hospSupplies = state.supplies.filter(s => s.hospitalId === currentUser.hospitalId);
      setSupplies(hospSupplies);
      const hosp = state.hospitals.find(h => h.id === currentUser.hospitalId);
      setCurrentHospital(hosp || null);

      // Find colleagues for potential reassignment
      const colleagues = state.staff.filter(s => 
          s.hospitalId === currentUser.hospitalId && 
          s.role === 'doctor' && 
          s.id !== currentUser.id &&
          s.status === StaffStatus.AVAILABLE
      );
      setAvailableColleagues(colleagues);
    }
  }, [currentUser, patients]);

  useEffect(() => {
    if (selectedPatientId) {
      const p = patients.find(pat => pat.id === selectedPatientId);
      setActivePatient(p || null);
      if (p) setUpdateStatus(p.status);
    } else {
      setActivePatient(null);
    }
  }, [selectedPatientId, patients]);

  // Auto-calculate date when severity changes
  useEffect(() => {
    const date = new Date();
    if (supplySeverity === 'critical') date.setDate(date.getDate() + 1);
    else if (supplySeverity === 'medium') date.setDate(date.getDate() + 3);
    else date.setDate(date.getDate() + 7);
    setSupplyDate(date.toISOString().split('T')[0]);
  }, [supplySeverity]);

  const handleAiAssist = async () => {
    if (!activePatient || !symptoms) return;
    setAiLoading(true);
    setAiAdvice('');
    const advice = await getMedicalAssistantResponse(symptoms, activePatient);
    setAiAdvice(advice);
    setAiLoading(false);
  };

  const handleAddRecord = () => {
    if (!activePatient || !newNote || !currentUser) return;
    const newRecord: MedicalRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      type: entryType,
      description: newNote,
      doctorName: currentUser.name,
      location: currentHospital?.name || 'Field'
    };
    
    const updatedPrescriptions = entryType === 'PRESCRIPTION' 
      ? [...activePatient.activePrescriptions, newNote.split(' - ')[0]] // Simple extraction if user types "Drug - dosage"
      : activePatient.activePrescriptions;

    const updatedPatient = {
      ...activePatient,
      records: [newRecord, ...activePatient.records],
      status: updateStatus,
      activePrescriptions: updatedPrescriptions,
      lastUpdated: new Date().toISOString()
    };
    
    updatePatient(updatedPatient);
    setNewNote('');
    onDataUpdate();
  };

  const submitSupplyRequest = () => {
    if (!currentUser) return;
    createSupplyRequest(
      supplyItem, 
      supplyQty, 
      currentUser.id, 
      currentUser.hospitalId, 
      supplySeverity,
      (linkToPatient && activePatient) ? activePatient.id : undefined,
      (linkToPatient && activePatient) ? activePatient.name : undefined,
      supplyDate
    );
    setShowSupplyModal(false);
    setSupplyItem('');
    setSupplyQty(1);
    alert("Supply request broadcasted to mesh.");
  };

  const submitTransferRequest = () => {
    if (!activePatient || !currentUser) return;
    requestPatientTransfer(
        activePatient.id,
        activePatient.name,
        currentUser.hospitalId,
        currentUser.id,
        transferUrgency,
        transferReason
    );
    
    // Add a record to patient history
    const newRecord: MedicalRecord = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        type: 'TRANSFER',
        description: `Transfer Requested. Urgency: ${transferUrgency}. Reason: ${transferReason}`,
        doctorName: currentUser.name,
        location: currentHospital?.name || 'Field'
    };
    const updatedPatient = {
        ...activePatient,
        records: [newRecord, ...activePatient.records]
    };
    updatePatient(updatedPatient);

    setShowTransferModal(false);
    setTransferReason('');
    onDataUpdate();
    alert("Transfer request logged and queued for Directors.");
  };

  const handleConfirmAppointment = (patientId: string, recordId: string) => {
      updateAppointment(patientId, recordId, 'CONFIRMED');
      onDataUpdate();
  }

  const openManageModal = (patientId: string, recordId: string) => {
      setSelectedAppt({patientId, recordId});
      // Default to +3 days
      const d = new Date();
      d.setDate(d.getDate() + 3);
      setNewApptDate(d.toISOString().split('T')[0]);
      setReassignDoctorId('');
      setShowPostponeModal(true);
  }

  const confirmPostpone = () => {
      if (!selectedAppt || !newApptDate) return;
      
      const assignedDoc = availableColleagues.find(c => c.id === reassignDoctorId);
      
      updateAppointment(
          selectedAppt.patientId, 
          selectedAppt.recordId, 
          'POSTPONED', 
          newApptDate,
          reassignDoctorId || undefined,
          assignedDoc?.name || undefined
      );
      
      onDataUpdate();
      setShowPostponeModal(false);
      setSelectedAppt(null);
  }

  const getStatusColor = (status: CriticalStatus) => {
    switch (status) {
      case CriticalStatus.CRITICAL: return 'text-red-500';
      case CriticalStatus.UNSTABLE: return 'text-orange-500';
      case CriticalStatus.STABLE: return 'text-green-500';
      case CriticalStatus.RECOVERING: return 'text-teal-500';
      case CriticalStatus.DISCHARGED: return 'text-slate-400';
      default: return 'text-blue-500';
    }
  };

  // LOGIN SCREEN
  if (!currentUser) {
    return (
       <div className="max-w-3xl mx-auto mt-10 px-4 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Medical Staff Login</h2>
          <p className="text-slate-400">Select your profile to access local mesh data.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableStaff.map(staff => (
            <button 
              key={staff.id}
              onClick={() => setCurrentUser(staff)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-medical-500 p-4 rounded-xl text-left transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-full bg-medical-900/50 text-medical-400 flex items-center justify-center font-bold text-lg group-hover:bg-medical-600 group-hover:text-white transition-colors">
                {staff.name.charAt(4)}
              </div>
              <div>
                <div className="font-bold text-white group-hover:text-medical-200">{staff.name}</div>
                <div className="text-xs text-slate-500">{staff.hospitalId} • {staff.role.toUpperCase()}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Filter patients for the logged-in doctor's hospital OR patients assigned to them
  const myPatients = patients.filter(p => p.hospitalId === currentUser.hospitalId || p.assignedDoctorId === currentUser.id);

  // Get Pending Appointments
  const pendingAppointments = myPatients.flatMap(p => 
      p.records
      .filter(r => r.type === 'APPOINTMENT' && r.metadata?.status === 'PENDING')
      .map(r => ({ patient: p, record: r }))
  );

  // Critical supplies for this hospital
  const lowSupplies = supplies.filter(s => s.quantity < s.criticalThreshold);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col relative">
      {/* DOCTOR HEADER */}
      <div className="flex justify-between items-center mb-4 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
         <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{currentUser.name}</h1>
            <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">🏥 {currentHospital?.name}</span>
              <span className="flex items-center gap-1">📍 {currentHospital?.province}</span>
            </div>
         </div>
         <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSupplyModal(true)} className="text-xs py-1.5">
               + Request Supplies
            </Button>
            <Button variant="secondary" onClick={() => setCurrentUser(null)} className="text-xs py-1.5">Exit Shift</Button>
         </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* LEFT COLUMN: LISTS */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0 h-full">
          
           {/* ALERT BANNER */}
           {lowSupplies.length > 0 && (
            <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4 shadow-lg animate-pulse flex-shrink-0">
               <h3 className="text-red-500 font-bold text-xs uppercase mb-2 flex items-center gap-2">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 CRITICAL SUPPLY SHORTAGE
               </h3>
               <div className="space-y-2">
                 {lowSupplies.map(s => (
                   <div key={s.id} className="flex justify-between items-center bg-red-950/50 p-2 rounded border border-red-900/30">
                     <span className="text-red-200 text-sm font-medium">{s.item}</span>
                     <div className="text-right">
                        <div className="text-red-500 font-mono font-bold text-lg leading-none">{s.quantity}</div>
                        <div className="text-[10px] text-red-400 opacity-70">Thresh: {s.criticalThreshold}</div>
                     </div>
                   </div>
                 ))}
               </div>
               <button onClick={() => setShowSupplyModal(true)} className="w-full mt-3 bg-red-700 hover:bg-red-600 text-white text-xs py-1.5 rounded font-medium">
                   Order Restock Now
               </button>
            </div>
          )}

          {/* TOGGLE TABS */}
          <div className="flex bg-slate-800 p-1 rounded border border-slate-700 flex-shrink-0">
              <button 
                  onClick={() => setActiveTab('PATIENTS')}
                  className={`flex-1 text-xs py-2 rounded font-bold transition-colors ${activeTab === 'PATIENTS' ? 'bg-medical-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                  Patients ({myPatients.length})
              </button>
              <button 
                  onClick={() => setActiveTab('APPOINTMENTS')}
                  className={`flex-1 text-xs py-2 rounded font-bold transition-colors ${activeTab === 'APPOINTMENTS' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                  Bookings ({pendingAppointments.length})
              </button>
          </div>

          {/* LIST CONTENT */}
          <Card title={activeTab === 'PATIENTS' ? "Patient Directory" : "Pending Requests"} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              
              {activeTab === 'PATIENTS' ? (
                  myPatients.length === 0 ? (
                    <div className="text-slate-500 italic text-sm text-center py-4">No active patients.</div>
                  ) : (
                    myPatients.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => setSelectedPatientId(p.id)}
                        className={`p-3 rounded-lg cursor-pointer border transition-all ${selectedPatientId === p.id ? 'bg-medical-600 border-medical-500 shadow-lg relative z-10' : 'bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-750'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`font-bold text-sm ${selectedPatientId === p.id ? 'text-white' : 'text-slate-200'}`}>{p.name}</span>
                          <div className={`w-2 h-2 rounded-full ${p.status === 'CRITICAL' ? 'bg-red-500 animate-pulse' : p.status === 'UNSTABLE' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                        </div>
                        <div className={`text-xs mt-1 font-mono flex justify-between ${selectedPatientId === p.id ? 'text-medical-100' : 'text-slate-500'}`}>
                          <span className="truncate max-w-[120px]">{p.conditions[0] || 'No Condition'}</span>
                          <span>{p.status}</span>
                        </div>
                      </div>
                    ))
                  )
              ) : (
                  pendingAppointments.length === 0 ? (
                      <div className="text-slate-500 italic text-sm text-center py-4">No pending appointments.</div>
                  ) : (
                      pendingAppointments.map((item, idx) => (
                          <div key={idx} className="p-3 bg-slate-800 border border-slate-700 rounded-lg mb-2">
                              <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-white text-sm">{item.patient.name}</span>
                                  <span className="text-xs text-purple-400 font-mono">{item.record.date}</span>
                              </div>
                              <p className="text-xs text-slate-400 mb-2 line-clamp-2 italic">"{item.record.description.replace('Requested: ', '')}"</p>
                              <div className="flex gap-2">
                                  <button 
                                      onClick={() => handleConfirmAppointment(item.patient.id, item.record.id)}
                                      className="flex-1 bg-green-900/50 hover:bg-green-800 text-green-200 text-[10px] py-1 rounded border border-green-800"
                                  >
                                      Confirm
                                  </button>
                                  <button 
                                      onClick={() => openManageModal(item.patient.id, item.record.id)}
                                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] py-1 rounded border border-slate-600"
                                  >
                                      Manage
                                  </button>
                              </div>
                          </div>
                      ))
                  )
              )}
            </div>
          </Card>
        </div>

        {/* MAIN COLUMN: PATIENT DETAIL */}
        <div className="lg:col-span-9 flex flex-col min-h-0 h-full">
          {activePatient ? (
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-10">
              
              {/* Patient Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
                <div className="mb-4 sm:mb-0">
                  <h1 className="text-2xl font-bold text-white">{activePatient.name}</h1>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-2 font-mono">
                    <span className="bg-slate-900 px-2 py-1 rounded border border-slate-700">ID: {activePatient.externalId}</span>
                    <span className="bg-slate-900 px-2 py-1 rounded border border-slate-700">DOB: {activePatient.dateOfBirth}</span>
                    <span className="bg-slate-900 px-2 py-1 rounded border border-slate-700 text-red-300">Blood: {activePatient.bloodType}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <Button 
                     variant="danger" 
                     className="text-xs px-3 py-2 bg-red-900/50 border border-red-700 text-red-200 hover:bg-red-900"
                     onClick={() => setShowTransferModal(true)}
                   >
                     🚑 Transfer
                   </Button>
                   <div className="text-right">
                      <div className={`text-lg font-bold uppercase tracking-widest ${getStatusColor(activePatient.status)}`}>
                         {activePatient.status}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Current Status</div>
                   </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* LEFT: ACTIONS */}
                <div className="space-y-4">
                  
                  {/* Clinical Entry Form */}
                  <Card title="Clinical Entry">
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Entry Type</label>
                                <div className="flex bg-slate-900 rounded p-1 border border-slate-700">
                                    <button 
                                        onClick={() => setEntryType('NOTE')}
                                        className={`flex-1 text-xs py-1.5 rounded transition-all ${entryType === 'NOTE' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Observation
                                    </button>
                                    <button 
                                        onClick={() => setEntryType('PRESCRIPTION')}
                                        className={`flex-1 text-xs py-1.5 rounded transition-all ${entryType === 'PRESCRIPTION' ? 'bg-medical-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Prescription
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Update Status</label>
                                <select 
                                    className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-1.5 outline-none focus:border-medical-500 h-[34px]"
                                    value={updateStatus}
                                    onChange={(e) => setUpdateStatus(e.target.value as CriticalStatus)}
                                >
                                    {Object.values(CriticalStatus).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <textarea
                        className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-medical-500 outline-none min-h-[100px] text-sm resize-none placeholder-slate-600"
                        placeholder={entryType === 'PRESCRIPTION' ? "Drug Name - Dosage - Frequency..." : "Enter clinical observations..."}
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end">
                        <Button onClick={handleAddRecord} disabled={!newNote} className="text-xs">
                            {entryType === 'PRESCRIPTION' ? 'Prescribe & Update' : 'Log Observation'}
                        </Button>
                        </div>
                    </div>
                  </Card>

                  {/* AI Assist */}
                  <Card title="AI Assistant" className="border-t-2 border-t-medical-500">
                    <div className="flex gap-2 mb-3">
                      <input 
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-600 focus:border-medical-500 outline-none text-xs"
                        placeholder="Symptoms or query..."
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                      />
                      <Button onClick={handleAiAssist} disabled={!symptoms || aiLoading} className="text-xs px-3">
                        {aiLoading ? '...' : 'Ask'}
                      </Button>
                    </div>
                    {aiAdvice ? (
                      <div className="bg-slate-900 p-3 rounded border border-medical-500/30 text-slate-300 text-xs leading-relaxed animate-fade-in">
                        {aiAdvice}
                      </div>
                    ) : (
                        <div className="text-[10px] text-slate-600 italic text-center pt-1">AI ready to assist with diagnosis.</div>
                    )}
                  </Card>
                </div>

                {/* RIGHT: HISTORY */}
                <Card title="Medical Chart" className="max-h-[500px] overflow-y-auto custom-scrollbar bg-slate-900/50">
                  <div className="space-y-6 pl-2">
                    {activePatient.records.map((rec, i) => {
                        const isPrescription = rec.type === 'PRESCRIPTION' || rec.type === 'TREATMENT';
                        const isNote = rec.type === 'NOTE' || rec.type === 'DIAGNOSIS';
                        const isTransfer = rec.type === 'TRANSFER';
                        const isAppt = rec.type === 'APPOINTMENT';
                        
                        return (
                            <div key={rec.id} className="relative pl-6 border-l-2 border-slate-800 pb-2 group">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-slate-900 flex items-center justify-center ${
                                    isPrescription ? 'bg-green-500' : isTransfer ? 'bg-orange-500' : isAppt ? 'bg-purple-500' : isNote ? 'bg-blue-500' : 'bg-slate-600'
                                }`}>
                                </div>

                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                            isPrescription ? 'bg-green-900/30 text-green-400 border-green-800' :
                                            isTransfer ? 'bg-orange-900/30 text-orange-400 border-orange-800' :
                                            isAppt ? 'bg-purple-900/30 text-purple-400 border-purple-800' :
                                            isNote ? 'bg-blue-900/30 text-blue-400 border-blue-800' :
                                            'bg-slate-800 text-slate-400 border-slate-700'
                                        }`}>
                                            {rec.type}
                                        </span>
                                        <span className="text-xs font-bold text-white">{rec.doctorName}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-mono mt-1 sm:mt-0">
                                        {new Date(rec.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className={`p-3 rounded text-sm leading-relaxed border ${
                                    isPrescription ? 'bg-green-900/10 border-green-900/30 text-green-100' : 
                                    isTransfer ? 'bg-orange-900/10 border-orange-900/30 text-orange-100' :
                                    isAppt ? 'bg-purple-900/10 border-purple-900/30 text-purple-100' :
                                    'bg-slate-800 border-slate-700 text-slate-300'
                                }`}>
                                    {isPrescription && <span className="mr-2">💊</span>}
                                    {isTransfer && <span className="mr-2">🚑</span>}
                                    {isAppt && <span className="mr-2">📅</span>}
                                    {rec.description}
                                </div>
                            </div>
                        );
                    })}
                  </div>
                </Card>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20 mx-2">
              <div className="p-4 bg-slate-800 rounded-full mb-4 shadow-lg">
                <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <p className="text-sm">Select a patient from the list to begin consultation.</p>
            </div>
          )}
        </div>
      </div>

      {/* SUPPLY REQUEST MODAL */}
      {showSupplyModal && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
               <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">Request Medical Supplies</h3>
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs text-slate-400 mb-1">Item Name</label>
                     <input className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-medical-500 outline-none" 
                        value={supplyItem} onChange={e => setSupplyItem(e.target.value)} placeholder="e.g. Epinephrine, Splints..." />
                  </div>
                  <div className="flex gap-4">
                     <div className="flex-1">
                        <label className="block text-xs text-slate-400 mb-1">Quantity</label>
                        <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-medical-500 outline-none" 
                           value={supplyQty} onChange={e => setSupplyQty(parseInt(e.target.value))} />
                     </div>
                     <div className="flex-1">
                        <label className="block text-xs text-slate-400 mb-1">Urgency</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-medical-500 outline-none"
                           value={supplySeverity} onChange={e => setSupplySeverity(e.target.value as any)}>
                           <option value="low">Low (+7 Days)</option>
                           <option value="medium">Medium (+3 Days)</option>
                           <option value="critical">Critical (+1 Day)</option>
                        </select>
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs text-slate-400 mb-1">Required By (Auto-calc)</label>
                     <input type="date" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-300 text-sm" 
                        value={supplyDate} onChange={e => setSupplyDate(e.target.value)} />
                  </div>
                  {activePatient && (
                      <div className="flex items-center gap-2 bg-slate-800 p-2 rounded border border-slate-700">
                         <input type="checkbox" id="linkPatient" checked={linkToPatient} onChange={e => setLinkToPatient(e.target.checked)} className="rounded border-slate-600 bg-slate-700" />
                         <label htmlFor="linkPatient" className="text-xs text-slate-300">Request for patient: <span className="font-bold text-white">{activePatient.name}</span></label>
                      </div>
                  )}
                  <div className="flex gap-3 mt-6">
                     <Button variant="secondary" onClick={() => setShowSupplyModal(false)} className="flex-1">Cancel</Button>
                     <Button onClick={submitSupplyRequest} className="flex-1">Broadcast Request</Button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* PATIENT TRANSFER MODAL */}
      {showTransferModal && activePatient && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
               <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-2">
                  <span className="text-2xl">🚑</span>
                  <div>
                     <h3 className="text-lg font-bold text-white">Patient Transfer Request</h3>
                     <p className="text-xs text-slate-400">Relocate {activePatient.name}</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs text-slate-400 mb-1">Transfer Urgency</label>
                     <select className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-medical-500 outline-none"
                        value={transferUrgency} onChange={e => setTransferUrgency(e.target.value as any)}>
                        <option value="STABLE">Stable (Scheduled)</option>
                        <option value="IMMEDIATE">Immediate (Emergency Evac)</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs text-slate-400 mb-1">Medical Reason for Transfer</label>
                     <textarea className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-medical-500 outline-none min-h-[80px]" 
                        value={transferReason} onChange={e => setTransferReason(e.target.value)} placeholder="e.g. Requires surgical intervention not available here..." />
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                     <Button variant="secondary" onClick={() => setShowTransferModal(false)} className="flex-1">Cancel</Button>
                     <Button variant="danger" onClick={submitTransferRequest} className="flex-1">Request Transfer</Button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* APPOINTMENT POSTPONE/MANAGE MODAL */}
      {showPostponeModal && selectedAppt && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
             <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                 <h3 className="text-lg font-bold text-white mb-4">Manage Appointment</h3>
                 <div className="space-y-4">
                     <div>
                         <label className="text-xs text-slate-400 block mb-1">New Date (Postpone)</label>
                         <input type="date" 
                             className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-medical-500"
                             value={newApptDate}
                             onChange={(e) => setNewApptDate(e.target.value)}
                         />
                     </div>
                     
                     <div className="pt-3 border-t border-slate-800">
                        <label className="text-xs text-slate-400 block mb-2">Or Reassign to Colleague</label>
                        {availableColleagues.length > 0 ? (
                            <select 
                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-medical-500"
                                value={reassignDoctorId}
                                onChange={(e) => setReassignDoctorId(e.target.value)}
                            >
                                <option value="">Keep Current Doctor</option>
                                {availableColleagues.map(c => (
                                    <option key={c.id} value={c.id}>Dr. {c.name} ({c.status})</option>
                                ))}
                            </select>
                        ) : (
                            <div className="text-xs text-slate-500 italic">No other doctors available at this hospital.</div>
                        )}
                     </div>

                     <div className="flex gap-3 mt-4">
                         <Button variant="secondary" onClick={() => setShowPostponeModal(false)} className="flex-1">Cancel</Button>
                         <Button onClick={confirmPostpone} className="flex-1">Update</Button>
                     </div>
                 </div>
             </div>
          </div>
      )}

    </div>
  );
};
