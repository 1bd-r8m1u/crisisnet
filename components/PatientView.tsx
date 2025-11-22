import React, { useState } from 'react';
import { Patient } from '../types';
import { Card, Badge, Button } from './ui_components';
import { generatePatientId } from '../services/mockMesh';

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

// --- Subcomponents for Patient UI ---

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-3 text-sm font-medium rounded-full transition-all duration-300 ${active ? 'bg-medical-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
  >
    {children}
  </button>
);

// --- Main Component ---

export const PatientView: React.FC<PatientViewProps> = ({ patients }) => {
  const [authPatient, setAuthPatient] = useState<Patient | null>(null);
  const [loginName, setLoginName] = useState('');
  const [loginDob, setLoginDob] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'letters'>('overview');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const generatedId = generatePatientId(loginName, loginDob);
    const found = patients.find(p => p.id === generatedId);
    
    if (found) {
      setAuthPatient(found);
    } else {
      setLoginError('Record not found. Please check your details.');
    }
  };

  if (!authPatient) {
    // Login Stage
    return (
      <div className="max-w-md mx-auto mt-10 px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to CrisisNet</h2>
          <p className="text-slate-400">Secure Patient Portal</p>
        </div>
        
        <Card className="border-t-4 border-t-medical-500 bg-slate-900/50 backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-medical-500 outline-none transition-colors"
                placeholder="e.g. John Doe"
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
              <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm text-center">
                {loginError}
              </div>
            )}

            <Button type="submit" className="w-full py-3 text-lg shadow-xl">
              Access Records
            </Button>
          </form>
        </Card>
        
        <p className="text-center text-xs text-slate-500 mt-8">
          Your data is stored locally on the mesh network. <br/>
          No internet connection required.
        </p>
      </div>
    );
  }

  // Authenticated View
  const age = calculateAge(authPatient.dateOfBirth);
  const upcomingAppointments = authPatient.records.filter(r => r.type === 'APPOINTMENT' && new Date(r.date) > new Date(new Date().setDate(new Date().getDate() - 1)));
  
  return (
    <div className="max-w-lg mx-auto pb-20 animate-fade-in">
      
      {/* Header Greeting */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Hello, {authPatient.name.split(' ')[0]}</h1>
          <p className="text-slate-400 text-sm">ID: {authPatient.id}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-medical-900/50 border border-medical-500 flex items-center justify-center text-medical-400 font-bold text-lg">
          {authPatient.name.charAt(0)}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-900 p-1 rounded-full mb-6 border border-slate-800">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
        <TabButton active={activeTab === 'letters'} onClick={() => setActiveTab('letters')}>Letters</TabButton>
        <TabButton active={activeTab === 'records'} onClick={() => setActiveTab('records')}>History</TabButton>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            <Card className="text-center border-none bg-gradient-to-b from-slate-800 to-slate-900">
               <div className="flex flex-col items-center">
                 
                 <div className="w-full grid grid-cols-3 gap-2 text-center pb-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Blood</p>
                      <p className="text-lg font-bold text-white">{authPatient.bloodType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Age</p>
                      <p className="text-lg font-bold text-white">{age}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Status</p>
                      <span className={`inline-block w-3 h-3 rounded-full mt-1.5 ${authPatient.status === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                    </div>
                 </div>

                 {/* UPCOMING APPOINTMENTS */}
                 {upcomingAppointments.length > 0 ? (
                    <div className="w-full bg-blue-900/20 border border-blue-800 rounded-xl p-4 text-left mt-2">
                      <div className="flex items-center gap-2 mb-2 text-blue-300">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                         </svg>
                         <span className="font-bold text-sm">Upcoming Appointment</span>
                      </div>
                      {upcomingAppointments.map(appt => (
                        <div key={appt.id} className="mb-2 last:mb-0">
                           <p className="text-lg font-bold text-white">{new Date(appt.date).toLocaleDateString()}</p>
                           <p className="text-sm text-slate-300">{appt.description}</p>
                           <div className="mt-1 text-xs text-slate-400 flex justify-between">
                             <span>{appt.location}</span>
                             <span>{appt.doctorName}</span>
                           </div>
                        </div>
                      ))}
                    </div>
                 ) : (
                   <div className="w-full p-4 bg-slate-800/50 rounded-xl text-slate-500 text-sm mt-2 border border-slate-700 border-dashed">
                     No upcoming appointments scheduled.
                   </div>
                 )}

               </div>
            </Card>

            <div className="grid grid-cols-1 gap-4">
              <Card title="My Conditions">
                {authPatient.conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {authPatient.conditions.map(c => (
                      <span key={c} className="px-3 py-1 bg-slate-700 rounded-full text-slate-200 text-sm border border-slate-600">
                        {c}
                      </span>
                    ))}
                  </div>
                ) : <p className="text-slate-500 italic">No chronic conditions reported.</p>}
              </Card>

              <Card title="Allergies">
                {authPatient.allergies.length > 0 ? (
                   <div className="flex flex-wrap gap-2">
                     {authPatient.allergies.map(a => (
                       <span key={a} className="px-3 py-1 bg-red-900/30 rounded-full text-red-200 text-sm border border-red-800">
                         {a}
                       </span>
                     ))}
                   </div>
                ) : <p className="text-slate-500 italic">No known allergies.</p>}
              </Card>
            </div>
          </>
        )}

        {/* LETTERS TAB */}
        {activeTab === 'letters' && (
          <div className="space-y-4">
            {authPatient.records.filter(r => r.type === 'LETTER' || r.type === 'DIAGNOSIS').length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <p>No correspondence on file.</p>
              </div>
            ) : (
              authPatient.records
                .filter(r => r.type === 'LETTER' || r.type === 'DIAGNOSIS')
                .map(doc => (
                <div key={doc.id} className="bg-white text-slate-900 p-6 rounded-lg shadow-lg max-w-full mx-auto relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-medical-600"></div>
                  <div className="flex justify-between items-start mb-6 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="font-bold text-xl text-slate-800">Medical Summary</h3>
                      <p className="text-sm text-slate-500">{doc.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-slate-600">{new Date(doc.date).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-400 uppercase">Ref: {doc.id}</p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-sm font-bold text-slate-700 mb-1">RE: {authPatient.name} (DOB: {authPatient.dateOfBirth})</p>
                    <p className="text-sm text-slate-600">Attending: {doc.doctorName}</p>
                  </div>

                  <div className="prose prose-sm text-slate-800 mb-6">
                    <p className="leading-relaxed">
                      {doc.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 text-xs font-bold">DR</div>
                        <div className="text-xs text-slate-500">
                          Signed electronically<br/>
                          {doc.doctorName}
                        </div>
                     </div>
                     <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                       {doc.type}
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* RECORDS TAB */}
        {activeTab === 'records' && (
          <Card title="Full Medical History" className="pb-2">
             <div className="divide-y divide-slate-800">
               {authPatient.records.map(rec => (
                 <div key={rec.id} className="py-4 first:pt-0">
                   <div className="flex justify-between mb-1">
                      <Badge color="blue">{rec.type}</Badge>
                      <span className="text-xs text-slate-500 font-mono">{new Date(rec.date).toLocaleDateString()}</span>
                   </div>
                   <p className="text-slate-300 text-sm mt-2">{rec.description}</p>
                   <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <span>👨‍⚕️ {rec.doctorName}</span>
                      <span>📍 {rec.location}</span>
                   </div>
                 </div>
               ))}
             </div>
          </Card>
        )}

      </div>
      
      <div className="mt-8 text-center">
        <Button variant="secondary" onClick={() => setAuthPatient(null)} className="mx-auto text-sm">
          Log Out
        </Button>
      </div>
    </div>
  );
};