
import React, { useState, useEffect, useRef } from 'react';
import { Patient, MedicalRecord, CriticalStatus, SupplyStock, StaffMember, Hospital, StaffStatus } from '../types';
import { Card, Button, Badge } from './ui_components';
import { updatePatient, createSupplyRequest, requestPatientTransfer, getMeshState, updateAppointment, updateStaffStatus, createPatient, assignPatientToDoctor, addMedicalRecord } from '../services/mockMesh';
// @ts-ignore
import jsQR from 'jsqr';

interface DoctorViewProps {
  patients: Patient[];
  onDataUpdate: () => void;
}

export const DoctorView: React.FC<DoctorViewProps> = ({ patients, onDataUpdate }) => {
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(null);
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [activeTab, setActiveTab] = useState<'PATIENTS' | 'APPOINTMENTS'>('PATIENTS');
  
  // Patient Selection
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  
  // Data State
  const [supplies, setSupplies] = useState<SupplyStock[]>([]);
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([]);
  
  // Clinical Entry State
  const [newNote, setNewNote] = useState('');
  const [entryType, setEntryType] = useState<'NOTE' | 'PRESCRIPTION'>('NOTE');
  const [updateStatus, setUpdateStatus] = useState<CriticalStatus>(CriticalStatus.STABLE);
  const [isRecording, setIsRecording] = useState(false);

  // Supply Request State
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [supplyItem, setSupplyItem] = useState('');
  const [supplyResourceTypes, setSupplyResourceTypes] = useState<string[]>([]);
  const [supplyQty, setSupplyQty] = useState(1);
  const [supplySeverity, setSupplySeverity] = useState<'low' | 'medium' | 'critical'>('low');
  const [supplyDate, setSupplyDate] = useState('');
  const [linkToPatient, setLinkToPatient] = useState(false);

  // Supply Alert State
  const [expandSupplyAlert, setExpandSupplyAlert] = useState(false);

  // Transfer State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferUrgency, setTransferUrgency] = useState<'IMMEDIATE' | 'STABLE'>('STABLE');
  const [transferReason, setTransferReason] = useState('');
  const [suggestedTargetId, setSuggestedTargetId] = useState('');

  // Appointment Manage State
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<{patientId: string, recordId: string} | null>(null);
  const [newApptDate, setNewApptDate] = useState('');
  const [reassignDoctorId, setReassignDoctorId] = useState('');
  const [availableColleagues, setAvailableColleagues] = useState<StaffMember[]>([]);

  // QR Scan State
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState('');
  const streamRef = useRef<MediaStream | null>(null);
  const [scannedPatient, setScannedPatient] = useState<Patient | null>(null);

  // Patient Creation
  const [showCreatePatientModal, setShowCreatePatientModal] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientDob, setNewPatientDob] = useState('');
  const [newPatientBlood, setNewPatientBlood] = useState('O+');

  useEffect(() => {
    const state = getMeshState();
    setAvailableStaff(state.staff.filter(s => s.role === 'doctor'));
    setHospitals(state.hospitals);
  }, []);

  useEffect(() => {
    if (currentUser) {
      const state = getMeshState();
      const hospSupplies = state.supplies.filter(s => s.hospitalId === currentUser.hospitalId);
      setSupplies(hospSupplies);
      const hosp = state.hospitals.find(h => h.id === currentUser.hospitalId);
      setCurrentHospital(hosp || null);

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

  useEffect(() => {
    const date = new Date();
    if (supplySeverity === 'critical') date.setDate(date.getDate() + 1);
    else if (supplySeverity === 'medium') date.setDate(date.getDate() + 3);
    else date.setDate(date.getDate() + 7);
    setSupplyDate(date.toISOString().split('T')[0]);
  }, [supplySeverity]);

  // Camera Logic
  useEffect(() => {
      let animationFrameId: number;
      const tick = () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
              const canvas = canvasRef.current;
              const video = videoRef.current;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  canvas.height = video.videoHeight;
                  canvas.width = video.videoWidth;
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
                  if (code) {
                      handleQRSuccess(code.data);
                  }
              }
          }
          animationFrameId = requestAnimationFrame(tick);
      };

      if (showScanModal) {
          setCameraError('');
          setScanError('');
          setScannedPatient(null);
          setScanInput('');
          navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
              .then(stream => {
                  streamRef.current = stream;
                  if (videoRef.current) {
                      videoRef.current.srcObject = stream;
                      videoRef.current.setAttribute("playsinline", "true");
                      videoRef.current.play();
                      requestAnimationFrame(tick);
                  }
              })
              .catch(err => {
                  console.error(err);
                  setCameraError("Camera access denied or unavailable.");
              });
      } else {
         if (streamRef.current) {
             streamRef.current.getTracks().forEach(track => track.stop());
             streamRef.current = null;
         }
         if (animationFrameId) cancelAnimationFrame(animationFrameId);
      }

      return () => {
          if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
          if (animationFrameId) cancelAnimationFrame(animationFrameId);
      }
  }, [showScanModal]);

  const handleQRSuccess = (idOrData: string) => {
      let targetId = idOrData;
      setScanError('');
      
      // Attempt to parse JSON if the QR contains the full object
      try {
          const data = JSON.parse(idOrData);
          if (data && data.id) {
              targetId = data.id;
          }
      } catch (e) {
          // It's likely a raw ID string, use as is
          targetId = idOrData;
      }

      // Check current props first (for react updates), then check mesh state directly for newly registered patients
      let found = patients.find(p => p.id === targetId || p.externalId === targetId);
      if (!found) {
          // Fallback to direct mesh state check for very new patients
          const state = getMeshState();
          found = state.patients.find(p => p.id === targetId || p.externalId === targetId);
      }

      if (found) {
          setScannedPatient(found);
          // Stop scanning once found
          if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
          }
      } 
  };

  const confirmScannedPatient = () => {
      if (scannedPatient) {
          setSelectedPatientId(scannedPatient.id);
          setShowScanModal(false);
          setScannedPatient(null);
      }
  }

  const handleAssignFromScan = () => {
      if (scannedPatient && currentUser) {
          assignPatientToDoctor(scannedPatient.id, currentUser.id, currentUser.hospitalId);
          onDataUpdate();
          
          // Optimistically update status for UI
          setScannedPatient({...scannedPatient, assignedDoctorId: currentUser.id, hospitalId: currentUser.hospitalId});
          
          alert(`${scannedPatient.name} has been added to your current patients list.`);
      }
  }

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
    
    addMedicalRecord(activePatient.id, newRecord);
    // Update status/meds if needed locally for immediate reflect
    const updatedPrescriptions = entryType === 'PRESCRIPTION' 
      ? [...activePatient.activePrescriptions, newNote.split(' - ')[0]]
      : activePatient.activePrescriptions;
    
    // Full update requires merging state logic, using mockMesh helper for cleaner separation
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

  const handleRecordVoice = () => {
      if (!isRecording) {
          setIsRecording(true);
      } else {
          // Simulate saving
          if (!activePatient || !currentUser) return;
          setIsRecording(false);
          const newRecord: MedicalRecord = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            type: 'AUDIO_NOTE',
            description: `Voice Note: Recorded by ${currentUser.name}`,
            doctorName: currentUser.name,
            location: currentHospital?.name || 'Field',
            audioUrl: 'mock-audio.mp3'
          };
          addMedicalRecord(activePatient.id, newRecord);
          onDataUpdate();
          alert("Voice note saved.");
      }
  }

  const handleCreatePatient = () => {
      if (!newPatientName || !newPatientDob) return;
      // Default to current hospital
      const res = createPatient(newPatientName, newPatientDob, newPatientBlood, [], currentUser?.hospitalId);
      if (res.success && res.patient) {
          if (currentUser) {
              assignPatientToDoctor(res.patient.id, currentUser.id, currentUser.hospitalId);
          }
          onDataUpdate();
          setSelectedPatientId(res.patient.id);
          setShowCreatePatientModal(false);
          alert(`Patient Created.\n\nPERMANENT ID: ${res.patient.id}\n\nPlease record this ID for the patient.`);
      } else {
          alert(res.message);
      }
  }

  const handleAssignToMe = () => {
      if (activePatient && currentUser) {
          assignPatientToDoctor(activePatient.id, currentUser.id, currentUser.hospitalId);
          onDataUpdate();
          alert("Patient added to your list.");
      }
  }

  const submitSupplyRequest = () => {
    if (!currentUser) return;
    if (!supplyItem.trim()) { alert("Error: Item Name cannot be empty."); return; }
    if (isNaN(supplyQty) || supplyQty <= 0) { alert("Error: Quantity must be a positive number."); return; }

    createSupplyRequest(
        supplyItem, 
        supplyQty, 
        currentUser.id, 
        currentUser.hospitalId, 
        supplySeverity, 
        supplyResourceTypes, 
        (linkToPatient && activePatient) ? activePatient.id : undefined, 
        (linkToPatient && activePatient) ? activePatient.name : undefined, 
        supplyDate, 
        currentUser.name
    );
    setShowSupplyModal(false);
    setSupplyItem('');
    setSupplyResourceTypes([]);
    setSupplyQty(1);
    alert(`Request for ${supplyQty}x ${supplyItem} logged.`);
  };

  const toggleResourceType = (type: string) => {
      setSupplyResourceTypes(prev => 
          prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
      );
  };

  const submitTransferRequest = () => {
    if (!activePatient || !currentUser) return;
    requestPatientTransfer(activePatient.id, activePatient.name, currentUser.hospitalId, currentUser.id, transferUrgency, transferReason, suggestedTargetId);
    
    const newRecord: MedicalRecord = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        type: 'TRANSFER',
        description: `Transfer Requested to ${suggestedTargetId || 'Any'}. Urgency: ${transferUrgency}. Reason: ${transferReason}`,
        doctorName: currentUser.name,
        location: currentHospital?.name || 'Field'
    };
    const updatedPatient = { ...activePatient, records: [newRecord, ...activePatient.records] };
    updatePatient(updatedPatient);
    setShowTransferModal(false);
    setTransferReason('');
    setSuggestedTargetId('');
    onDataUpdate();
    alert("Transfer request logged.");
  };

  const handleConfirmAppointment = (patientId: string, recordId: string) => {
      updateAppointment(patientId, recordId, 'CONFIRMED');
      onDataUpdate();
  }

  const openManageModal = (patientId: string, recordId: string) => {
      setSelectedAppt({patientId, recordId});
      const d = new Date(); d.setDate(d.getDate() + 3);
      setNewApptDate(d.toISOString().split('T')[0]);
      setReassignDoctorId('');
      setShowPostponeModal(true);
  }

  const confirmPostpone = () => {
      if (!selectedAppt || !newApptDate) return;
      const assignedDoc = availableColleagues.find(c => c.id === reassignDoctorId);
      updateAppointment(selectedAppt.patientId, selectedAppt.recordId, 'POSTPONED', newApptDate, reassignDoctorId || undefined, assignedDoc?.name || undefined);
      onDataUpdate();
      setShowPostponeModal(false);
      setSelectedAppt(null);
  }

  const handleManualScan = () => {
      if(!scanInput.trim()) return;
      // Strip whitespace and uppercase for consistency
      const input = scanInput.trim().toUpperCase();
      
      // Try local props first
      let found = patients.find(p => p.id === input || p.externalId === input);
      
      // Fallback to mesh state for very new records
      if (!found) {
           const state = getMeshState();
           found = state.patients.find(p => p.id === input || p.externalId === input);
      }
      
      if(found) {
          handleQRSuccess(input);
          setScanInput('');
          setScanError('');
      } else {
          setScanError('Patient ID not found in mesh.');
      }
  }

  const handleStatusChange = (newStatus: StaffStatus) => {
      if(currentUser) {
          updateStaffStatus(currentUser.id, newStatus);
          setCurrentUser({...currentUser, status: newStatus});
      }
  }

  const getStatusColor = (status: CriticalStatus) => {
    switch (status) {
      case CriticalStatus.CRITICAL: return 'text-red-600';
      case CriticalStatus.UNSTABLE: return 'text-orange-600';
      case CriticalStatus.STABLE: return 'text-green-600';
      case CriticalStatus.RECOVERING: return 'text-teal-600';
      case CriticalStatus.DISCHARGED: return 'text-slate-400';
      default: return 'text-blue-600';
    }
  };

  // LOGIN SCREEN
  if (!currentUser) {
    return (
       <div className="max-w-3xl mx-auto mt-10 px-4 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Medical Staff Login</h2>
          <p className="text-slate-500">Select your profile to access local mesh data.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableStaff.map(staff => (
            <button 
              key={staff.id}
              onClick={() => setCurrentUser(staff)}
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-medical-300 p-4 rounded-lg text-left transition-all flex items-center gap-4 group shadow-sm"
            >
              <div className="w-12 h-12 rounded-full bg-medical-50 text-medical-600 border border-medical-100 flex items-center justify-center font-bold text-lg group-hover:bg-medical-600 group-hover:text-white transition-colors">
                {staff.name.charAt(4)}
              </div>
              <div>
                <div className="font-bold text-slate-800 group-hover:text-medical-700">{staff.name}</div>
                <div className="text-xs text-slate-500">{staff.hospitalId} • {staff.role.toUpperCase()}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const myPatients = patients.filter(p => p.hospitalId === currentUser.hospitalId || p.assignedDoctorId === currentUser.id);
  const pendingAppointments = myPatients.flatMap(p => p.records.filter(r => r.type === 'APPOINTMENT' && r.metadata?.status === 'PENDING').map(r => ({ patient: p, record: r })));
  const lowSupplies = supplies.filter(s => s.quantity < s.criticalThreshold);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col relative">
      
      {activePatient && activePatient.status === CriticalStatus.CRITICAL && (
          <div className="w-full bg-red-50 border-b border-red-200 p-2 text-center text-red-700 text-sm font-bold flex items-center justify-center gap-2 shadow-sm animate-pulse z-40">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>CRITICAL PATIENT: <span className="underline">{activePatient.name}</span> requires immediate attention.</span>
          </div>
      )}

      {/* DOCTOR HEADER */}
      <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
         <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{currentUser.name}</h1>
            <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1">🏥 {currentHospital?.name}</span>
              <span className="flex items-center gap-1">📍 {currentHospital?.province}</span>
            </div>
         </div>
         <div className="flex gap-2 items-center">
            <select 
                className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-sm px-2 py-1.5 outline-none focus:border-medical-500 font-bold uppercase"
                value={currentUser.status}
                onChange={(e) => handleStatusChange(e.target.value as StaffStatus)}
            >
                <option value={StaffStatus.AVAILABLE}>Available</option>
                <option value={StaffStatus.BUSY}>Busy</option>
                <option value={StaffStatus.OFF_DUTY}>Off Duty</option>
            </select>
            <div className="h-6 w-px bg-slate-300 mx-2"></div>
            <Button variant="outline" onClick={() => setShowScanModal(true)} className="text-xs py-1.5 gap-2">
               Scan QR
            </Button>
            <Button variant="primary" onClick={() => setShowSupplyModal(true)} className="text-xs py-1.5 gap-2 bg-medical-600 text-white hover:bg-medical-700">
               + Request Supplies
            </Button>
            <Button variant="secondary" onClick={() => setCurrentUser(null)} className="text-xs py-1.5">Exit Shift</Button>
         </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0 h-full">
          
           {lowSupplies.length > 0 && (
            <div className={`bg-red-50 border border-red-200 rounded-lg shadow-sm flex-shrink-0 transition-all duration-200 ${expandSupplyAlert ? 'mb-4' : 'mb-2'}`}>
               <button 
                    onClick={() => setExpandSupplyAlert(!expandSupplyAlert)}
                    className="w-full flex justify-between items-center p-3 text-red-700 hover:bg-red-100 transition-colors rounded-lg"
               >
                 <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span>Critical Shortages ({lowSupplies.length})</span>
                 </div>
                 <svg className={`w-4 h-4 transition-transform ${expandSupplyAlert ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
               </button>
               
               {expandSupplyAlert && (
                 <div className="p-3 pt-0 border-t border-red-100 animate-fade-in">
                    <div className="space-y-2 mt-2">
                        {lowSupplies.map(s => (
                        <div key={s.id} className="flex justify-between items-center bg-white p-2 rounded-sm border border-red-100">
                            <span className="text-slate-700 text-sm font-medium">{s.item}</span>
                            <div className="text-right">
                                <div className="text-red-600 font-mono font-bold text-lg leading-none">{s.quantity}</div>
                                <div className="text-[10px] text-slate-400 opacity-70">Thresh: {s.criticalThreshold}</div>
                            </div>
                        </div>
                        ))}
                    </div>
                    <button onClick={() => setShowSupplyModal(true)} className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 rounded-sm font-medium uppercase tracking-wider">
                        Order Restock Now
                    </button>
                 </div>
               )}
            </div>
          )}

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 flex-shrink-0">
              <button 
                  onClick={() => setActiveTab('PATIENTS')}
                  className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${activeTab === 'PATIENTS' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Patients ({myPatients.length})
              </button>
              <button 
                  onClick={() => setActiveTab('APPOINTMENTS')}
                  className={`flex-1 text-xs py-2 rounded-md font-bold transition-all ${activeTab === 'APPOINTMENTS' ? 'bg-white text-purple-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Bookings ({pendingAppointments.length})
              </button>
          </div>
          
          {activeTab === 'PATIENTS' && (
             <Button onClick={() => setShowCreatePatientModal(true)} variant="secondary" className="w-full text-xs border-dashed border-slate-300">
                 + Create New Patient
             </Button>
          )}

          <Card title={activeTab === 'PATIENTS' ? "Patient Directory" : "Pending Requests"} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {activeTab === 'PATIENTS' ? (
                  myPatients.length === 0 ? (
                    <div className="text-slate-400 italic text-sm text-center py-4">No active patients.</div>
                  ) : (
                    myPatients.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => setSelectedPatientId(p.id)}
                        className={`p-3 rounded-md cursor-pointer border transition-all ${selectedPatientId === p.id ? 'bg-medical-50 border-medical-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`font-bold text-sm ${selectedPatientId === p.id ? 'text-medical-900' : 'text-slate-700'}`}>{p.name}</span>
                          <div className={`w-2 h-2 rounded-full ${p.status === 'CRITICAL' ? 'bg-red-500' : p.status === 'UNSTABLE' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                        </div>
                        <div className={`text-xs mt-1 font-mono flex justify-between ${selectedPatientId === p.id ? 'text-medical-700' : 'text-slate-400'}`}>
                          <span className="truncate max-w-[120px]">{p.conditions[0] || 'No Condition'}</span>
                          <span>{p.status}</span>
                        </div>
                      </div>
                    ))
                  )
              ) : (
                  pendingAppointments.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-md mb-2">
                          <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-800 text-sm">{item.patient.name}</span>
                              <span className="text-xs text-purple-600 font-mono">{item.record.date}</span>
                          </div>
                          <p className="text-xs text-slate-500 mb-2 line-clamp-2 italic">"{item.record.description.replace('Requested: ', '')}"</p>
                          <div className="flex gap-2">
                              <button onClick={() => handleConfirmAppointment(item.patient.id, item.record.id)} className="flex-1 bg-green-100 hover:bg-green-200 text-green-800 text-[10px] py-1 rounded border border-green-200">Confirm</button>
                              <button onClick={() => openManageModal(item.patient.id, item.record.id)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] py-1 rounded border border-slate-300">Manage</button>
                          </div>
                      </div>
                  ))
              )}
            </div>
          </Card>
        </div>

        {/* MAIN COLUMN */}
        <div className="lg:col-span-9 flex flex-col min-h-0 h-full">
          {activePatient ? (
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <div className="mb-4 sm:mb-0">
                  <h1 className="text-2xl font-bold text-slate-900">{activePatient.name}</h1>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-2 font-mono items-center">
                    <span className="bg-medical-50 text-medical-800 px-3 py-1 rounded border border-medical-200 font-bold text-sm tracking-widest">{activePatient.id}</span>
                    <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">DOB: {activePatient.dateOfBirth}</span>
                    <span className="bg-red-50 px-2 py-1 rounded border border-red-100 text-red-700">Blood: {activePatient.bloodType}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   {activePatient.assignedDoctorId !== currentUser.id && (
                       <Button variant="secondary" className="text-xs" onClick={handleAssignToMe}>+ Add to My List</Button>
                   )}
                   <Button variant="danger" className="text-xs px-3 py-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:text-red-800" onClick={() => setShowTransferModal(true)}>
                     🚑 Transfer
                   </Button>
                   <div className="text-right">
                      <div className={`text-lg font-bold uppercase tracking-widest ${getStatusColor(activePatient.status)}`}>{activePatient.status}</div>
                      <div className="text-xs text-slate-400 mt-1">Current Status</div>
                   </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Card title="Clinical Entry">
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">Entry Type</label>
                                <div className="flex bg-slate-100 rounded-sm p-1 border border-slate-200">
                                    <button onClick={() => setEntryType('NOTE')} className={`flex-1 text-xs py-1.5 rounded-sm transition-all ${entryType === 'NOTE' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Observation</button>
                                    <button onClick={() => setEntryType('PRESCRIPTION')} className={`flex-1 text-xs py-1.5 rounded-sm transition-all ${entryType === 'PRESCRIPTION' ? 'bg-white text-medical-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Prescription</button>
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">Update Status</label>
                                <select className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-sm px-2 py-1.5 outline-none focus:border-medical-500 h-[34px]" value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value as CriticalStatus)}>
                                    {Object.values(CriticalStatus).map(s => (<option key={s} value={s}>{s}</option>))}
                                </select>
                            </div>
                        </div>
                        <textarea className="w-full bg-white border border-slate-300 rounded-sm p-3 text-slate-800 focus:border-medical-500 outline-none min-h-[100px] text-sm resize-none placeholder-slate-400" placeholder="Enter details..." value={newNote} onChange={(e) => setNewNote(e.target.value)}></textarea>
                        
                        <div className="flex justify-between items-center">
                            <button onClick={handleRecordVoice} className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded border ${isRecording ? 'bg-red-100 text-red-700 border-red-200 animate-pulse' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-600' : 'bg-slate-400'}`}></span>
                                {isRecording ? 'Recording...' : 'Record Voice Note'}
                            </button>
                            <Button onClick={handleAddRecord} disabled={!newNote} className="text-xs">
                                {entryType === 'PRESCRIPTION' ? 'Prescribe & Update' : 'Log Observation'}
                            </Button>
                        </div>
                    </div>
                  </Card>
                </div>

                <Card title="Medical Chart" className="max-h-[500px] overflow-y-auto custom-scrollbar bg-slate-50">
                  <div className="space-y-6 pl-2">
                    {activePatient.records.map((rec, i) => {
                        const isPrescription = rec.type === 'PRESCRIPTION' || rec.type === 'TREATMENT';
                        const isAudio = rec.type === 'AUDIO_NOTE';
                        return (
                            <div key={rec.id} className="relative pl-6 border-l-2 border-slate-200 pb-2 group">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${isPrescription ? 'bg-green-500' : isAudio ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge color={isPrescription ? 'green' : isAudio ? 'blue' : 'gray'}>{rec.type}</Badge>
                                        <span className="text-xs font-bold text-slate-700">{rec.doctorName}</span>
                                    </div>
                                    <span className="text-xs text-slate-400 font-mono mt-1 sm:mt-0">
                                        {new Date(rec.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                                    </span>
                                </div>
                                <div className="p-3 rounded-sm text-sm leading-relaxed border bg-white border-slate-200 text-slate-600 shadow-sm">
                                    {isPrescription && <span className="mr-2">💊</span>}
                                    {isAudio && <span className="mr-2">🎤</span>}
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
            <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 mx-2">
              <p className="text-sm">Select a patient from the list to begin consultation.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showSupplyModal && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-lg shadow-2xl">
               <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                 <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                   <span className="w-2 h-4 bg-medical-500 inline-block"></span>
                   Request Supplies
                 </h3>
                 <button onClick={() => setShowSupplyModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
               </div>
               
               <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs text-slate-500 mb-1 font-bold">Item Name / Description</label>
                        <input 
                          className="w-full bg-white border border-slate-300 rounded-sm px-3 py-2 text-slate-900 text-sm outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500" 
                          placeholder="e.g. Surgical Gloves, Saline..."
                          value={supplyItem} 
                          onChange={e => setSupplyItem(e.target.value)} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1 font-bold">Quantity</label>
                        <input 
                          type="number"
                          min="1"
                          className="w-full bg-white border border-slate-300 rounded-sm px-3 py-2 text-slate-900 text-sm outline-none focus:border-medical-500" 
                          value={supplyQty} 
                          onChange={e => setSupplyQty(parseInt(e.target.value))} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1 font-bold">Required By Date</label>
                        <input 
                          type="date"
                          className="w-full bg-white border border-slate-300 rounded-sm px-3 py-2 text-slate-900 text-sm outline-none focus:border-medical-500"
                          value={supplyDate}
                          onChange={e => setSupplyDate(e.target.value)}
                        />
                    </div>
                  </div>

                  <div>
                      <label className="block text-xs text-slate-500 mb-2 font-bold">Resource Type(s)</label>
                      <div className="flex flex-wrap gap-2">
                         {['Medicine', 'Tools', 'Blood', 'Food', 'Water', 'Fuel', 'Labor'].map(type => (
                             <button
                                key={type}
                                onClick={() => toggleResourceType(type)}
                                className={`px-3 py-1 text-xs rounded-full border font-bold transition-all ${
                                    supplyResourceTypes.includes(type) 
                                    ? 'bg-medical-600 text-white border-medical-600 shadow-sm' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-medical-300 hover:bg-slate-50'
                                }`}
                             >
                                {supplyResourceTypes.includes(type) ? '✓ ' : '+ '}{type}
                             </button>
                         ))}
                      </div>
                  </div>

                  <div>
                      <label className="block text-xs text-slate-500 mb-2 font-bold">Urgency Level</label>
                      <div className="flex gap-2">
                          <button 
                            onClick={() => setSupplySeverity('low')} 
                            className={`flex-1 py-2 rounded-sm text-xs font-bold border transition-all ${supplySeverity === 'low' ? 'bg-slate-100 border-slate-400 text-slate-800' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                          >
                             LOW (7d)
                          </button>
                          <button 
                            onClick={() => setSupplySeverity('medium')} 
                            className={`flex-1 py-2 rounded-sm text-xs font-bold border transition-all ${supplySeverity === 'medium' ? 'bg-orange-50 border-orange-400 text-orange-800' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                          >
                             MEDIUM (3d)
                          </button>
                          <button 
                            onClick={() => setSupplySeverity('critical')} 
                            className={`flex-1 py-2 rounded-sm text-xs font-bold border transition-all ${supplySeverity === 'critical' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                          >
                             CRITICAL (24h)
                          </button>
                      </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-sm">
                     <input type="checkbox" id="linkPatient" checked={linkToPatient} onChange={e => setLinkToPatient(e.target.checked)} className="rounded border-slate-300 text-medical-600 focus:ring-medical-500" />
                     <label htmlFor="linkPatient" className="text-xs text-slate-700 flex-1">Link to Patient Record {activePatient ? `(${activePatient.name})` : ''}</label>
                     {linkToPatient && activePatient && <span className="text-[10px] font-mono bg-white px-1 border border-slate-200">{activePatient.id}</span>}
                  </div>

                  <div className="flex gap-3 mt-6">
                     <Button variant="secondary" onClick={() => setShowSupplyModal(false)} className="flex-1">Cancel</Button>
                     <Button onClick={submitSupplyRequest} className="flex-1 bg-medical-600 text-white hover:bg-medical-700 shadow-md">Submit Request</Button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Request Patient Transfer</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1 font-bold">Reason for Transfer</label>
                        <textarea className="w-full bg-white border border-slate-300 rounded-sm p-2 text-sm outline-none h-20" value={transferReason} onChange={e => setTransferReason(e.target.value)} placeholder="e.g. Needs surgery unavailable here..." />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1 font-bold">Suggested Destination</label>
                        <select className="w-full bg-white border border-slate-300 rounded-sm p-2 text-sm outline-none" value={suggestedTargetId} onChange={e => setSuggestedTargetId(e.target.value)}>
                            <option value="">-- Any Available --</option>
                            {hospitals.filter(h => h.id !== currentHospital?.id).map(h => (
                                <option key={h.id} value={h.id}>{h.name} ({h.type})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-2 font-bold">Urgency</label>
                        <div className="flex gap-2">
                            <button onClick={() => setTransferUrgency('STABLE')} className={`flex-1 py-2 text-xs border rounded-sm ${transferUrgency === 'STABLE' ? 'bg-green-50 border-green-500 text-green-700 font-bold' : 'bg-white border-slate-200'}`}>Stable</button>
                            <button onClick={() => setTransferUrgency('IMMEDIATE')} className={`flex-1 py-2 text-xs border rounded-sm ${transferUrgency === 'IMMEDIATE' ? 'bg-red-50 border-red-500 text-red-700 font-bold' : 'bg-white border-slate-200'}`}>Immediate</button>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <Button variant="secondary" onClick={() => setShowTransferModal(false)} className="flex-1">Cancel</Button>
                        <Button variant="danger" onClick={submitTransferRequest} className="flex-1">Request Transfer</Button>
                    </div>
                </div>
            </div>
          </div>
      )}

      {/* QR Scan Modal */}
      {showScanModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                  <div className="text-center mb-6">
                      <h3 className="text-lg font-bold text-slate-900">Scan Patient QR</h3>
                  </div>
                  {!scannedPatient ? (
                      <>
                        <div className="relative w-full h-[250px] bg-black rounded overflow-hidden mb-4 border-2 border-slate-300">
                            {!cameraError ? (
                                <>
                                    <video ref={videoRef} className="w-full h-full object-cover" muted />
                                    <canvas ref={canvasRef} className="hidden" />
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-white text-xs">{cameraError}</div>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3 my-4">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <span className="text-xs text-slate-400 font-bold uppercase">OR</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-xs font-bold text-slate-500">Manual Entry (Failed Scan?)</label>
                             <div className="flex gap-2">
                                <input className="w-full bg-white border border-slate-300 rounded-sm p-2 text-slate-900 font-mono outline-none text-sm placeholder-slate-400 uppercase" placeholder="Enter ID (e.g. KHALED-1970...)" value={scanInput} onChange={(e) => setScanInput(e.target.value)} />
                                <Button onClick={handleManualScan} className="bg-slate-700 text-white hover:bg-slate-800">Verify</Button>
                             </div>
                             {scanError && <p className="text-xs text-red-500 font-bold text-center animate-pulse">{scanError}</p>}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button variant="secondary" onClick={() => setShowScanModal(false)} className="w-full">Cancel</Button>
                        </div>
                      </>
                  ) : (
                      <div className="space-y-4 animate-fade-in">
                          <div className="bg-slate-50 border border-slate-200 p-4 rounded text-center">
                              <h4 className="font-bold text-lg text-slate-900">{scannedPatient.name}</h4>
                              <p className="font-mono text-xs text-slate-500 mb-2">{scannedPatient.id}</p>
                              <Badge color={scannedPatient.status === 'CRITICAL' ? 'red' : 'green'}>{scannedPatient.status}</Badge>
                          </div>
                          <p className="text-sm text-center text-slate-600">Patient detected in mesh.</p>
                          <div className="flex flex-col gap-2">
                              <Button onClick={confirmScannedPatient} className="w-full">Access Records</Button>
                              {scannedPatient.assignedDoctorId !== currentUser.id && (
                                 <Button variant="secondary" onClick={handleAssignFromScan} className="w-full border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">
                                     + Add to My List
                                 </Button>
                              )}
                              <Button variant="outline" onClick={() => { setScannedPatient(null); setShowScanModal(false); }} className="w-full">Cancel</Button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Create Patient Modal */}
      {showCreatePatientModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-md shadow-2xl">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Create New Patient Record</h3>
                  <div className="space-y-4">
                      <input type="text" placeholder="Full Name" className="w-full border p-2 rounded" value={newPatientName} onChange={e => setNewPatientName(e.target.value)} />
                      <input type="date" className="w-full border p-2 rounded" value={newPatientDob} onChange={e => setNewPatientDob(e.target.value)} />
                      <select className="w-full border p-2 rounded" value={newPatientBlood} onChange={e => setNewPatientBlood(e.target.value)}>
                          {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <div className="flex gap-3 mt-4">
                          <Button variant="secondary" onClick={() => setShowCreatePatientModal(false)} className="flex-1">Cancel</Button>
                          <Button onClick={handleCreatePatient} className="flex-1">Create & Open</Button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
