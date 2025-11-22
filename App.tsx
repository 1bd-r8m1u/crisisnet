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
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
  </svg>
);

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<Role>(Role.DOCTOR); // Default to Doctor
  const [meshState, setMeshState] = useState<MeshState>(getMeshState());

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-medical-500 selection:text-white">
      {/* Top Navigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-medical-900/30 rounded-full border border-medical-600/30">
                 <IconPulse />
              </div>
              <div>
                <h1 className="font-bold text-xl tracking-tight text-white">Crisis<span className="text-medical-500">Net</span></h1>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Mesh Online</span>
                </div>
              </div>
            </div>

            {/* Role Switcher (For Demo Purposes) */}
            <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
              {Object.values(Role).map((role) => (
                <button
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    currentRole === role 
                      ? 'bg-medical-600 text-white shadow' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6 md:hidden">
           {/* Mobile specific header elements if needed */}
        </div>
        {renderContent()}
      </main>

      {/* Status Footer */}
      <footer className="fixed bottom-0 w-full border-t border-slate-800 bg-slate-900/90 backdrop-blur-sm text-[10px] text-slate-500 py-1 px-4 flex justify-between items-center z-50">
         <div className="flex items-center gap-2">
           <IconWifi />
           <span>CONNECTED PEERS: {meshState.connectedPeers}</span>
         </div>
         <div className="font-mono">
           LAST SYNC: {new Date(meshState.lastSync).toLocaleTimeString()}
         </div>
      </footer>
    </div>
  );
};

export default App;