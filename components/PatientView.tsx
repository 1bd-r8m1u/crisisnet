
import React, { useState, useEffect } from 'react';
import { Patient, CriticalStatus, Hospital } from '../types';
import { Card, Badge, Button } from './ui_components';
import { generatePatientId, bookAppointment, addPatientCondition, createPatient, updatePatientProfile, getMeshState } from '../services/mockMesh';
import { QRCodeSVG } from 'qrcode.react';

interface PatientViewProps {
  patients: Patient[];
}

const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const getStatusColor = (status: CriticalStatus) => {
  switch (status) {
    case CriticalStatus.CRITICAL: return 'red';
    case CriticalStatus.UNSTABLE: return 'orange';
    case CriticalStatus.STABLE: return 'green';
    case CriticalStatus.RECOVERING: return 'teal';
    case CriticalStatus.DISCHARGED: return 'gray';
    default: return 'blue';
  }
};

export const PatientView: React.FC<PatientViewProps> = ({ patients }) => {
  const [authPatient, setAuthPatient] = useState<Patient | null>(null);
  const [loginName, setLoginName] = useState('');
  const [loginDob, setLoginDob] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  
  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regBlood, setRegBlood] = useState('O+');
  const [regAllergies, setRegAllergies] = useState('');
  const [regHospitalId, setRegHospitalId] = useState('');

  // Edit Profile State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBlood, setEditBlood] = useState('');
  const [editAllergies, setEditAllergies] = useState('');

  // Appointment Modal State
  const [showApptModal, setShowApptModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [apptDate, setApptDate] = useState('');
  const [apptReason, setApptReason] = useState('');

  // Condition Modal State
  const [showCondModal, setShowCondModal] = useState(false);
  const [newCondition, setNewCondition] = useState('');
  
  // QR Modal State
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
     const state = getMeshState();
     setHospitals(state.hospitals);
     if (state.hospitals.length > 0) setRegHospitalId(state.hospitals[0].id);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    // Generate ID matches the mockMesh logic
    const generatedId = generatePatientId(loginName, loginDob);
    const found = patients.find(p => p.id === generatedId);
    
    if (found) {
      setAuthPatient(found);
    } else {
      console.log("Attempted ID:", generatedId);
      setLoginError('Patient record not found. Please check exact spelling and date.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
      e.preventDefault();
      const allergiesArr = regAllergies.split(',').map(s => s.trim()).filter(s => s);
      const res = createPatient(regName, regDob, regBlood, allergiesArr, regHospitalId);
      if (res.success && res.patient) {
          setAuthPatient(res.patient);
          setIsRegistering(false);
          alert("Medical Packet Created Successfully. Your ID is: " + res.patient.id);
      } else {
          setLoginError(res.message || 'Error creating account.');
      }
  }

  const handleEditProfile = () => {
    if (!authPatient) return;
    setEditBlood(authPatient.bloodType);
    setEditAllergies(authPatient.allergies.join(', '));
    setShowEditModal(true);
  };

  const submitEditProfile = () => {
    if (!authPatient) return;
    const allergiesArr = editAllergies.split(',').map(s => s.trim()).filter(s => s);
    const success = updatePatientProfile(authPatient.id, editBlood, allergiesArr);
    if (success) {
      // Optimistic update locally
      setAuthPatient({
        ...authPatient,
        bloodType: editBlood,
        allergies: allergiesArr
      });
      setShowEditModal(false);
      alert("Profile updated successfully.");
    } else {
      alert("Error updating profile.");
    }
  };

  const handleBookAppointment = () => {
      if (!authPatient) return;
      bookAppointment(authPatient.id, apptReason, apptDate);
      setShowApptModal(false);
      setShowSuccessModal(true);
  };

  const handleAddCondition = () => {
      if (!authPatient) return;
      addPatientCondition(authPatient.id, newCondition);
      alert("Condition added to file (Self-Reported).");
      setShowCondModal(false);
      setNewCondition('');
  };

  const playVoiceNote = (text: string) => {
      if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel(); // Stop previous
          const cleanText = text.replace('Voice Note: ', '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          window.speechSynthesis.speak(utterance);
      } else {
          alert("Audio playback not supported on this device.");
      }
  };

  if (!authPatient) {
    return (
      <div className="max-w-md mx-auto mt-10 px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Patient Access</h2>
          <p className="text-slate-500">Secure Medical Digital Packet</p>
        </div>
        
        <Card className="border-t-4 border-t-medical-500 shadow-xl transition-all">
          {isRegistering ? (
             <form onSubmit={handleRegister} className="space-y-4">
                 <h3 className="font-bold text-slate-900">Create New Account</h3>
                 <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-xs text-yellow-800">
                    A permanent unique ID will be generated for you upon creation.
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500">Full Name</label>
                    <input type="text" required placeholder="Full Name" className="w-full border p-2 rounded" value={regName} onChange={e => setRegName(e.target.value)} />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-slate-500">Date of Birth</label>
                    <input type="date" required className="w-full border p-2 rounded" value={regDob} onChange={e => setRegDob(e.target.value)} />
                 </div>
                 <div>
                     <label className="text-xs font-bold text-slate-500">Nearest Clinic</label>
                     <select className="w-full border p-2 rounded text-sm" value={regHospitalId} onChange={e => setRegHospitalId(e.target.value)}>
                         {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} ({h.province})</option>)}
                     </select>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                     <div>
                        <label className="text-xs font-bold text-slate-500">Blood Type</label>
                        <select className="w-full border p-2 rounded" value={regBlood} onChange={e => setRegBlood(e.target.value)}>
                            {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500">Allergies</label>
                        <input type="text" placeholder="Comma separated" className="w-full border p-2 rounded" value={regAllergies} onChange={e => setRegAllergies(e.target.value)} />
                     </div>
                 </div>
                 
                 <div className="flex gap-2 pt-2">
                     <Button type="button" variant="secondary" onClick={() => setIsRegistering(false)} className="flex-1">Cancel</Button>
                     <Button type="submit" className="flex-1">Create Packet</Button>
                 </div>
             </form>
          ) : (
             <form onSubmit={handleLogin} className="space-y-6">
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                    type="text" 
                    required
                    className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-medical-500 focus:ring-1 focus:ring-medical-500 outline-none transition-colors"
                    placeholder="e.g. Khaled Saar"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                />
                </div>
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                <input 
                    type="date" 
                    required
                    className="w-full bg-white border border-slate-300 rounded-sm px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-medical-500 focus:ring-1 focus:ring-medical-500 outline-none transition-colors"
                    value={loginDob}
                    onChange={(e) => setLoginDob(e.target.value)}
                />
                </div>
                
                {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm text-center">
                    {loginError}
                </div>
                )}
                
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-500 mb-4">
                <p className="font-bold mb-2 uppercase tracking-wider text-slate-700">Tap to autofill demo user:</p>
                <div className="flex flex-col gap-2">
                    <button type="button" onClick={() => { setLoginName('Khaled Saar'); setLoginDob('1970-01-01'); }} className="bg-white border border-slate-200 px-3 py-2 rounded-sm hover:border-medical-300 text-left flex justify-between items-center transition-colors">
                        <span className="font-bold text-slate-700">Khaled Saar</span>
                        <span className="font-mono text-slate-400">1970-01-01</span>
                    </button>
                    <button type="button" onClick={() => { setLoginName('Mira Joud'); setLoginDob('2007-08-14'); }} className="bg-white border border-slate-200 px-3 py-2 rounded-sm hover:border-medical-300 text-left flex justify-between items-center transition-colors">
                        <span className="font-bold text-slate-700">Mira Joud</span>
                        <span className="font-mono text-slate-400">2007-08-14</span>
                    </button>
                </div>
                </div>

                <div className="space-y-3">
                    <Button type="submit" className="w-full py-3 text-lg shadow-lg">
                    Open Medical Packet
                    </Button>
                    <button type="button" onClick={() => setIsRegistering(true)} className="w-full text-sm text-medical-600 font-bold hover:underline">
                        First time? Create a Medical Packet
                    </button>
                </div>
            </form>
          )}
        </Card>
      </div>
    );
  }

  const age = calculateAge(authPatient.dateOfBirth);
  
  return (
    <div className="max-w-lg mx-auto pb-20 animate-fade-in px-2 md:px-0">
      
      {/* ID CARD HEADER */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 text-medical-900">
           <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M18 11H13V16H11V11H6V9H11V4H13V9H18V11Z"/></svg>
        </div>
        <div className="flex justify-between items-start relative z-10">
           <div>
             <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{authPatient.name}</h1>
             <div className="mt-2 inline-block bg-blue-50 border border-blue-200 rounded px-2 py-1">
                <span className="text-[10px] text-blue-500 font-bold uppercase mr-2">MESH ID</span>
                <span className="text-blue-900 font-mono font-bold tracking-wider">{authPatient.id}</span>
             </div>
             <div className="text-slate-400 font-mono text-[10px] mt-1 ml-1">GEO: {authPatient.geoHash}</div>
           </div>
           <div className="text-right">
             <div className="text-xs text-slate-400 uppercase font-bold">Blood Type</div>
             <div className="text-3xl font-bold text-slate-900">{authPatient.bloodType}</div>
           </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 relative z-10">
           <div>
             <div className="text-xs text-slate-400 uppercase">Date of Birth</div>
             <div className="text-lg text-slate-700 font-mono">{authPatient.dateOfBirth}</div>
             <div className="text-sm text-slate-500">Age: {age}</div>
           </div>
           <div className="text-right">
              <div className="text-xs text-slate-400 uppercase mb-1">Status</div>
              <Badge color={getStatusColor(authPatient.status)}>{authPatient.status}</Badge>
           </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end relative z-10">
           <button onClick={handleEditProfile} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
             Edit Details
           </button>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-3 gap-3 mb-6">
          <Button variant="secondary" onClick={() => setShowApptModal(true)} className="text-xs py-3">
             📅 Book Appt
          </Button>
          <Button variant="secondary" onClick={() => setShowCondModal(true)} className="text-xs py-3">
             📝 Report
          </Button>
          <Button variant="secondary" onClick={() => setShowQRModal(true)} className="text-xs py-3">
             📱 Show QR
          </Button>
      </div>

      {/* CRITICAL MEDICAL ALERTS */}
      <div className="space-y-4 mb-8">
         <Card title="Allergies & Conditions" className="border-l-4 border-l-yellow-500 shadow-md">
            <div className="flex flex-wrap gap-2">
               {authPatient.allergies.length > 0 ? (
                  authPatient.allergies.map(a => (
                    <span key={a} className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-sm text-sm font-bold flex items-center gap-1">
                      ⚠️ {a}
                    </span>
                  ))
               ) : <span className="text-slate-400 text-sm">No known allergies</span>}
               
               {authPatient.conditions.map(c => (
                 <span key={c} className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-sm text-sm">
                   {c}
                 </span>
               ))}
            </div>
         </Card>

         <Card title="Active Prescriptions" className="border-l-4 border-l-green-500 shadow-md">
            {authPatient.activePrescriptions.length > 0 ? (
              <ul className="space-y-2">
                {authPatient.activePrescriptions.map((p, i) => (
                  <li key={i} className="flex justify-between items-center text-slate-700 text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <span className="font-medium">💊 {p}</span>
                    <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-sm font-bold">Active</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-slate-400 text-sm italic">No active medications</p>}
         </Card>
      </div>

      {/* HISTORY */}
      <h3 className="text-slate-400 font-bold uppercase text-xs tracking-wider mb-3 pl-1">Recent History</h3>
      <div className="space-y-3 mb-8">
        {authPatient.records.map((rec, idx) => (
          <div key={rec.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
             <div className="flex justify-between items-center mb-2">
                <div className="flex gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    rec.type === 'APPOINTMENT' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                    rec.type === 'PRESCRIPTION' ? 'bg-green-50 text-green-700 border-green-200' : 
                    'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                    {rec.type}
                    </span>
                    <span className="text-xs text-slate-400 font-mono mt-0.5">{new Date(rec.date).toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); playVoiceNote(rec.description); }} 
                  className="text-slate-400 hover:text-medical-600 transition-colors p-1"
                  title="Read Aloud"
                >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                </button>
             </div>
             <p className="text-slate-700 text-sm leading-relaxed">{rec.description}</p>
             {rec.type === 'AUDIO_NOTE' && (
                 <div className="mt-3 bg-slate-50 p-2 rounded border border-slate-200 flex items-center gap-2">
                     <button onClick={() => playVoiceNote(rec.description.replace('Voice Note: ', ''))} className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                     </button>
                     <span className="text-xs font-bold text-slate-500 uppercase">Play Recording</span>
                 </div>
             )}
             <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 border-t border-slate-100 pt-2">
               <span className="font-medium text-slate-600">{rec.doctorName}</span>
               <span>•</span>
               <span>{rec.location}</span>
             </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Button variant="outline" onClick={() => setAuthPatient(null)} className="text-xs w-full py-3">
          Close Packet (Logout)
        </Button>
      </div>

      {/* MODALS */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Personal Details</h3>
                <div className="space-y-3">
                    <p className="text-xs text-red-500">Note: Name and Date of Birth cannot be changed as they form your permanent Digital Identity.</p>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block font-bold">Blood Type</label>
                        <select className="w-full border border-slate-300 rounded-sm p-2 text-sm" value={editBlood} onChange={e => setEditBlood(e.target.value)}>
                            {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block font-bold">Allergies (Comma separated)</label>
                        <input className="w-full border border-slate-300 rounded-sm p-2 text-sm" value={editAllergies} onChange={e => setEditAllergies(e.target.value)} />
                    </div>
                    <div className="flex gap-3 mt-4">
                        <Button variant="secondary" onClick={() => setShowEditModal(false)} className="flex-1">Cancel</Button>
                        <Button onClick={submitEditProfile} className="flex-1">Save Changes</Button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {showApptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Request Appointment</h3>
                  <div className="space-y-3">
                      <div>
                          <label className="text-xs text-slate-500 mb-1 block font-bold">Preferred Date</label>
                          <input type="date" className="w-full bg-white border border-slate-300 rounded-sm p-2 text-slate-900 text-sm outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500"
                            value={apptDate} onChange={e => setApptDate(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="text-xs text-slate-500 mb-1 block font-bold">Reason for visit</label>
                          <textarea className="w-full bg-white border border-slate-300 rounded-sm p-2 text-slate-900 text-sm outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500 min-h-[80px]"
                             placeholder="Describe symptoms..."
                             value={apptReason} onChange={e => setApptReason(e.target.value)}
                          ></textarea>
                      </div>
                      <div className="flex gap-3 mt-4">
                          <Button variant="secondary" onClick={() => setShowApptModal(false)} className="flex-1">Cancel</Button>
                          <Button onClick={handleBookAppointment} className="flex-1">Book</Button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white border-t-4 border-t-green-500 rounded-xl p-6 w-full max-w-sm text-center shadow-2xl">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                     <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Request Submitted</h3>
                  <div className="text-sm text-slate-600 mb-4 space-y-1">
                     <p>Your appointment for <span className="font-bold">{apptDate}</span> has been sent.</p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded border border-amber-200 text-xs text-amber-800 mb-6 text-left">
                     <strong>Status: DOCTOR CONFIRMATION REQUIRED</strong><br/>
                     This is a preliminary request. A medical professional must review urgency and availability before this appointment is confirmed. You will see a status update here.
                  </div>
                  <Button onClick={() => { setShowSuccessModal(false); setApptDate(''); setApptReason(''); }} className="w-full">
                      Understood
                  </Button>
              </div>
          </div>
      )}

      {showCondModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-sm shadow-2xl">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Self-Report Condition</h3>
                  <div className="space-y-3">
                      <div>
                          <label className="text-xs text-slate-500 mb-1 block font-bold">Condition Name</label>
                          <input type="text" className="w-full bg-white border border-slate-300 rounded-sm p-2 text-slate-900 text-sm outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500"
                             placeholder="e.g. Migraine, Stomach Flu..."
                             value={newCondition} onChange={e => setNewCondition(e.target.value)}
                          />
                      </div>
                      <p className="text-[10px] text-slate-400 italic">Note: This will be added to your file as self-reported and requires doctor validation.</p>
                      <div className="flex gap-3 mt-4">
                          <Button variant="secondary" onClick={() => setShowCondModal(false)} className="flex-1">Cancel</Button>
                          <Button onClick={handleAddCondition} className="flex-1">Submit</Button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showQRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm flex flex-col items-center shadow-2xl">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Your Medical ID</h3>
                  <p className="text-xs text-slate-500 mb-6">Scan to share full medical history</p>
                  
                  <div className="bg-white p-2 rounded-lg border-2 border-slate-900 mb-4">
                      <QRCodeSVG 
                          value={JSON.stringify({
                              id: authPatient.id,
                              name: authPatient.name,
                              blood: authPatient.bloodType,
                              allergies: authPatient.allergies,
                              conditions: authPatient.conditions,
                              geoHash: authPatient.geoHash
                          })} 
                          size={200} 
                          level="M" 
                      />
                  </div>

                  <div className="text-center mb-6">
                    <div className="font-mono text-sm font-bold text-slate-900 tracking-wider bg-slate-100 px-3 py-1 rounded border border-slate-200">{authPatient.id}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">GeoHash: {authPatient.geoHash}</div>
                  </div>
                  
                  <Button onClick={() => setShowQRModal(false)} className="w-full">Close</Button>
              </div>
          </div>
      )}

    </div>
  );
};
