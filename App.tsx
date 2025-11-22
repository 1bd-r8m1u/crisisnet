
import React, { useState, useEffect } from 'react';
import { Role, Patient, MeshState } from './types';
import { PatientView } from './components/PatientView';
import { DoctorView } from './components/DoctorView';
import { DirectorView } from './components/DirectorView';
import { getMeshState } from './services/mockMesh';
import { Button } from './components/ui_components';

// Icons
const IconPulse = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-medical-500">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12h4.5l2.25 5.25 1.5-7.5 2.25 5.25 1.5-7.5 4.5 12h2.25" />
  </svg>
);

const IconWifi = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
  </svg>
);

const EmergencyBanner: React.FC<{ message: string; sender: string; severity: string }> = ({ message, sender, severity }) => (
  <div className={`w-full px-4 py-2 flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs text-white z-[100] animate-pulse ${
    severity === 'critical' ? 'bg-red-600' : severity === 'warning' ? 'bg-orange-500' : 'bg-blue-600'
  }`}>
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      <span>EMERGENCY ALERT ({sender}): {message}</span>
  </div>
);

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<Role>(Role.DOCTOR); // Default to Doctor
  const [meshState, setMeshState] = useState<MeshState>(() => getMeshState());

  // Sync Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate getting updates from the mesh
      setMeshState(getMeshState());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    setMeshState(getMeshState());
  };

  const renderContent = () => {
    switch (currentRole) {
      case Role.PATIENT:
        return <PatientView patients={meshState.patients} />;
      case Role.DOCTOR:
        return <DoctorView patients={meshState.patients} onDataUpdate={refreshData} />;
      case Role.DIRECTOR:
        return <DirectorView meshState={meshState} />;
      default:
        return null;
    }
  };

  const activeAlert = meshState.alerts && meshState.alerts.length > 0 ? meshState.alerts[0] : null;

 return (
    <div className="min-h-screen bg-slate-50 text-slate-600 font-sans selection:bg-medical-100 selection:text-medical-900 flex flex-col">
      {activeAlert && <EmergencyBanner message={activeAlert.message} sender={activeAlert.senderName} severity={activeAlert.severity} />}

      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-medical-50 rounded-lg border border-medical-100 text-medical-600">
                 <IconPulse />
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl tracking-tight text-slate-900">
                    CRISIS<span className="text-medical-600">NET</span>
                </h1>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Federated Mesh v2.1</span>
                </div>
              </div>
            </div>

            {/* Role Switcher */}
            <div className="flex bg-slate-50 rounded-md p-1 gap-1 border border-slate-200">
              {Object.values(Role).map((role) => (
                <button
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={`px-4 py-1.5 rounded-sm text-xs font-display font-bold transition-all ${
                    currentRole === role 
                      ? 'bg-white text-medical-700 shadow-sm border border-slate-200' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {renderContent()}
      </main>

      <footer className="w-full border-t border-slate-200 bg-white/90 backdrop-blur-sm text-[10px] text-slate-400 py-1.5 px-4 flex justify-between items-center z-50 font-mono">
         <div className="flex items-center gap-2">
           <IconWifi />
           <span>MESH NODES: {meshState.connectedPeers}</span>
         </div>
         <div>
           SYNC: {new Date(meshState.lastSync).toLocaleTimeString()}
         </div>
      </footer>
    </div>
  );
};

export default App;
