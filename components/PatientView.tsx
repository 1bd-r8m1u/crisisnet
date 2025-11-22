
import React, { useState } from 'react';
import { Patient, CriticalStatus } from '../types';
import { Card, Badge, Button } from './ui_components';
import { generatePatientId, bookAppointment, addPatientCondition } from '../services/mockMesh';

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

  // Appointment Modal State
  const [showApptModal, setShowApptModal] = useState(false);
  const [apptDate, setApptDate] = useState('');
  const [apptReason, setApptReason] = useState('');

  // Condition Modal State
  const [showCondModal, setShowCondModal] = useState(false);
  const [newCondition, setNewCondition] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    // Generate ID matches the mockMesh logic: Name (Upper, No Spaces) + DOB (YYYYMMDD)
    const generatedId = generatePatientId(loginName, loginDob);
    
    const found = patients.find(p => p.id === generatedId);
    
    if (found) {
      setAuthPatient(found);
    } else {
      console.log("Attempted ID:", generatedId);
      setLoginError('Patient record not found. Please check exact spelling and date.');
    }
  };

  const handleBookAppointment = () => {
      if (!authPatient) return;
      bookAppointment(authPatient.id, apptReason, apptDate);
      alert("Appointment Requested. Awaiting Doctor Confirmation.");
      setShowApptModal(false);
      setApptReason('');
      setApptDate('');
  };

  const handleAddCondition = () => {
      if (!authPatient) return;
      addPatientCondition(authPatient.id, newCondition);
      alert("Condition added to file (Self-Reported).");
      setShowCondModal(false);
      setNewCondition('');
  };

  if (!authPatient) {
    return (
      <div className="max-w-md mx-auto mt-10 px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Patient Access</h2>
          <p className="text-slate-400">Secure Medical Digital Packet</p>
        </div>
        
        <Card className="border-t-4 border-t-medical-500 bg-slate-900/50 backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-medical-500 outline-none transition-colors"
                placeholder="e.g. Khaled Saar"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Date of Birth</label>
              <input 
                type="date" 
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-medical-500 outline-none transition-colors"
                value={loginDob}
                onChange={(e) => setLoginDob(e.target.value)}
              />
            </div>
            
            {loginError && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm text-center animate-pulse">
                {loginError}
              </div>
            )}
            
            <div className="bg-slate-800/50 p-3 rounded text-xs text-slate-500 mb-4">
               <p className="font-bold mb-2 uppercase tracking-wider">Tap to autofill demo user:</p>
               <div className="flex flex-col gap-2">
                  {/* 
                      NOTE: These dates must match generateSimulatedDOB logic in mockMesh.ts 
                      Index 0 (Khaled): 1970-01-01
                      Index 1 (Mira): 2007-08-14
                  */}
                  <button type="button" onClick={() => { setLoginName('Khaled Saar'); setLoginDob('1970-01-01'); }} className="bg-slate-700 px-3 py-2 rounded hover:bg-slate-600 text-left flex justify-between items-center transition-colors">
                    <span>Khaled Saar</span>
                    <span className="font-mono text-slate-400">1970-01-01</span>
                  </button>
                  <button type="button" onClick={() => { setLoginName('Mira Joud'); setLoginDob('2007-08-14'); }} className="bg-slate-700 px-3 py-2 rounded hover:bg-slate-600 text-left flex justify-between items-center transition-colors">
                    <span>Mira Joud</span>
                    <span className="font-mono text-slate-400">2007-08-14</span>
                  </button>
               </div>
            </div>

            <Button type="submit" className="w-full py-3 text-lg shadow-xl">
              Open Medical Packet
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const age = calculateAge(authPatient.dateOfBirth);
  
  return (
    <div className="max-w-lg mx-auto pb-20 animate-fade-in px-2 md:px-0">
      
      {/* ID CARD HEADER */}
      <div className="bg-gradient-to-br from-medical-900 to-slate-900 rounded-2xl p-6 shadow-2xl border border-medical-700/50 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M18 11H13V16H11V11H6V9H11V4H13V9H18V11Z"/></svg>
        </div>
        <div className="flex justify-between items-start relative z-10">
           <div>
             <h1 className="text-2xl font-bold text-white tracking-tight">{authPatient.name}</h1>
             <p className="text-medical-300 font-mono text-sm mt-1">{authPatient.id}</p>
           </div>
           <div className="text-right">
             <div className="text-xs text-medical-300 uppercase font-bold">Blood Type</div>
             <div className="text-3xl font-bold text-white">{authPatient.bloodType}</div>
           </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 relative z-10">
           <div>
             <div className="text-xs text-medical-300 uppercase">Date of Birth</div>
             <div className="text-lg text-white font-mono">{authPatient.dateOfBirth}</div>
             <div className="text-sm text-medical-400">Age: {age}</div>
           </div>
           <div className="text-right">
              <div className="text-xs text-medical-300 uppercase">Status</div>
              <Badge color={getStatusColor(authPatient.status)}>{authPatient.status}</Badge>
           </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-3 mb-6">
          <Button onClick={() => setShowApptModal(true)} className="text-xs py-3 bg-slate-800 border border-slate-700 hover:border-medical-500">
             📅 Book Appointment
          </Button>
          <Button onClick={() => setShowCondModal(true)} className="text-xs py-3 bg-slate-800 border border-slate-700 hover:border-medical-500">
             📝 Report Condition
          </Button>
      </div>

      {/* CRITICAL MEDICAL ALERTS */}
      <div className="space-y-4 mb-8">
         <Card title="Allergies & Conditions" className="border-l-4 border-l-yellow-500 shadow-lg">
            <div className="flex flex-wrap gap-2">
               {authPatient.allergies.length > 0 ? (
                  authPatient.allergies.map(a => (
                    <span key={a} className="px-3 py-1 bg-red-900/30 text-red-200 border border-red-800 rounded-md text-sm font-bold flex items-center gap-1">
                      ⚠️ {a}
                    </span>
                  ))
               ) : <span className="text-slate-500 text-sm">No known allergies</span>}
               
               {authPatient.conditions.map(c => (
                 <span key={c} className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-600 rounded-md text-sm">
                   {c}
                 </span>
               ))}
            </div>
         </Card>

         <Card title="Active Prescriptions" className="border-l-4 border-l-green-500 shadow-lg">
            {authPatient.activePrescriptions.length > 0 ? (
              <ul className="space-y-2">
                {authPatient.activePrescriptions.map((p, i) => (
                  <li key={i} className="flex justify-between items-center text-slate-300 text-sm border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                    <span className="font-medium">💊 {p}</span>
                    <span className="text-xs text-green-400 bg-green-900/20 px-2 py-0.5 rounded">Active</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-slate-500 text-sm italic">No active medications</p>}
         </Card>
      </div>

      {/* HISTORY */}
      <h3 className="text-slate-400 font-bold uppercase text-xs tracking-wider mb-3 pl-1">Recent History</h3>
      <div className="space-y-3 mb-8">
        {authPatient.records.map((rec, idx) => (
          <div key={rec.id} className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 shadow-sm">
             <div className="flex justify-between mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${rec.type === 'APPOINTMENT' ? 'bg-purple-900 text-purple-200' : rec.type === 'PRESCRIPTION' ? 'bg-green-900 text-green-200' : 'bg-slate-700 text-slate-300'}`}>
                  {rec.type}
                </span>
                <span className="text-xs text-slate-500 font-mono">{new Date(rec.date).toLocaleDateString()}</span>
             </div>
             <p className="text-slate-300 text-sm leading-relaxed">{rec.description}</p>
             <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 border-t border-slate-700/50 pt-2">
               <span className="font-medium text-slate-400">{rec.doctorName}</span>
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
      {showApptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm">
                  <h3 className="text-lg font-bold text-white mb-4">Request Appointment</h3>
                  <div className="space-y-3">
                      <div>
                          <label className="text-xs text-slate-400 mb-1 block">Preferred Date</label>
                          <input type="date" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm outline-none focus:border-medical-500"
                            value={apptDate} onChange={e => setApptDate(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="text-xs text-slate-400 mb-1 block">Reason for visit</label>
                          <textarea className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm outline-none focus:border-medical-500 min-h-[80px]"
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

      {showCondModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm">
                  <h3 className="text-lg font-bold text-white mb-4">Self-Report Condition</h3>
                  <div className="space-y-3">
                      <div>
                          <label className="text-xs text-slate-400 mb-1 block">Condition Name</label>
                          <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm outline-none focus:border-medical-500"
                             placeholder="e.g. Migraine, Stomach Flu..."
                             value={newCondition} onChange={e => setNewCondition(e.target.value)}
                          />
                      </div>
                      <p className="text-[10px] text-slate-500 italic">Note: This will be added to your file as self-reported and requires doctor validation.</p>
                      <div className="flex gap-3 mt-4">
                          <Button variant="secondary" onClick={() => setShowCondModal(false)} className="flex-1">Cancel</Button>
                          <Button onClick={handleAddCondition} className="flex-1">Submit</Button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
