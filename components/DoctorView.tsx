import React, { useState, useEffect } from 'react';
import { Patient, MedicalRecord, CriticalStatus, SupplyStock } from '../types';
import { Card, Button, Badge } from './ui_components';
import { getMedicalAssistantResponse } from '../services/geminiService';
import { updatePatient, createSupplyRequest, getMeshState } from '../services/mockMesh';

interface DoctorViewProps {
  patients: Patient[];
  onDataUpdate: () => void;
}

export const DoctorView: React.FC<DoctorViewProps> = ({ patients, onDataUpdate }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'clinical' | 'logistics'>('clinical');
  const [supplies, setSupplies] = useState<SupplyStock[]>([]);
  
  // AI State
  const [symptoms, setSymptoms] = useState('');
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  // Form State
  const [newNote, setNewNote] = useState('');

  // Logistics State
  const [selectedSupply, setSelectedSupply] = useState<string>('');
  const [requestQty, setRequestQty] = useState<number>(1);

  useEffect(() => {
    // Sync supplies when component mounts or updates
    setSupplies(getMeshState().supplies);
  }, [patients]); // Basic dependency to refresh when data changes

  useEffect(() => {
    if (selectedPatientId) {
      const p = patients.find(pat => pat.id === selectedPatientId);
      setActivePatient(p || null);
    } else {
      setActivePatient(null);
    }
  }, [selectedPatientId, patients]);

  const handleAiAssist = async () => {
    if (!activePatient || !symptoms) return;
    setAiLoading(true);
    setAiAdvice('');
    const advice = await getMedicalAssistantResponse(symptoms, activePatient);
    setAiAdvice(advice);
    setAiLoading(false);
  };

  const handleAddRecord = () => {
    if (!activePatient || !newNote) return;
    const newRecord: MedicalRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      type: 'NOTE',
      description: newNote,
      doctorName: 'Dr. Field',
      location: 'Mobile Mesh Unit'
    };
    
    const updatedPatient = {
      ...activePatient,
      records: [newRecord, ...activePatient.records],
      lastUpdated: new Date().toISOString()
    };
    
    updatePatient(updatedPatient);
    setNewNote('');
    onDataUpdate();
  };

  const handleRequestSupply = () => {
    if (!selectedSupply) return;
    const supplyItem = supplies.find(s => s.id === selectedSupply);
    if (supplyItem) {
      createSupplyRequest(supplyItem.id, supplyItem.item, requestQty, 'Dr. Field');
      setSelectedSupply('');
      setRequestQty(1);
      alert("Supply Request transmitted to Logistics.");
      onDataUpdate();
    }
  };

  const toggleStatus = () => {
    if (!activePatient) return;
    const newStatus = activePatient.status === CriticalStatus.STABLE 
      ? CriticalStatus.CRITICAL 
      : CriticalStatus.STABLE;
    
    updatePatient({ ...activePatient, status: newStatus });
    onDataUpdate();
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4 border-b border-slate-800 pb-2">
        <button 
          onClick={() => setActiveTab('clinical')}
          className={`px-4 py-2 rounded-t-lg font-medium ${activeTab === 'clinical' ? 'bg-medical-900/50 text-medical-400 border-b-2 border-medical-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Clinical View
        </button>
        <button 
           onClick={() => setActiveTab('logistics')}
           className={`px-4 py-2 rounded-t-lg font-medium ${activeTab === 'logistics' ? 'bg-medical-900/50 text-medical-400 border-b-2 border-medical-500' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Logistics & Supplies
        </button>
      </div>

      {activeTab === 'clinical' ? (
        <div className="grid lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
          {/* Sidebar: Patient List / Scanner */}
          <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2 h-full">
            <Card title="Patient Scanner" className="h-full">
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  placeholder="Scan ID or Name..." 
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:border-medical-500 outline-none"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                />
                <Button variant="secondary" onClick={() => setSelectedPatientId('')}>Clear</Button>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Nearby Patients (Mesh)</p>
                {patients.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`p-3 rounded cursor-pointer border transition-colors ${selectedPatientId === p.id ? 'bg-medical-900/30 border-medical-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                  >
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-200">{p.name}</span>
                      <Badge color={p.status === 'CRITICAL' ? 'red' : 'blue'}>{p.status}</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-mono flex justify-between">
                      <span>DOB: {p.dateOfBirth}</span>
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1 font-mono truncate">{p.id}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Main: Patient Detail */}
          <div className="lg:col-span-8 overflow-y-auto pb-10 h-full">
            {activePatient ? (
              <div className="space-y-6">
                {/* Patient Header */}
                <Card className="border-t-4 border-t-medical-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-bold text-white">{activePatient.name}</h1>
                      <div className="flex gap-4 text-sm text-slate-400 mt-1 font-mono">
                        <span>DOB: {activePatient.dateOfBirth}</span>
                        <span>Blood: {activePatient.bloodType}</span>
                        <span className="text-xs text-slate-600">ID: {activePatient.id}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={toggleStatus}
                      variant={activePatient.status === CriticalStatus.STABLE ? 'danger' : 'primary'}
                    >
                      Set {activePatient.status === CriticalStatus.STABLE ? 'Critical' : 'Stable'}
                    </Button>
                  </div>
                </Card>

                {/* AI Assistant */}
                <Card title="AI Clinical Assistant" className="border-medical-500/30 bg-slate-800/50">
                  <div className="flex gap-2 mb-4">
                    <input 
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-medical-500 outline-none"
                      placeholder="Describe current symptoms (e.g., high fever, difficulty breathing)..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                    />
                    <Button onClick={handleAiAssist} disabled={!symptoms || aiLoading}>
                      {aiLoading ? 'Analyzing...' : 'Analyze'}
                    </Button>
                  </div>
                  {aiAdvice && (
                    <div className="bg-slate-900/80 p-4 rounded border border-medical-500/20 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap animate-pulse-once">
                      <strong className="text-medical-400 block mb-2">Gemini Insight:</strong>
                      {aiAdvice}
                    </div>
                  )}
                </Card>

                {/* Medical Records & Notes */}
                <Card title="Medical Records">
                   <div className="mb-6">
                      <textarea
                        className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-medical-500 outline-none min-h-[100px]"
                        placeholder="Add treatment notes or diagnosis..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                      ></textarea>
                      <div className="mt-2 flex justify-end">
                        <Button onClick={handleAddRecord} disabled={!newNote}>Add to Record</Button>
                      </div>
                   </div>

                   <div className="space-y-4">
                      {activePatient.records.map(rec => (
                        <div key={rec.id} className="border-l-2 border-slate-600 pl-4 py-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-slate-300">{rec.type}</span>
                            <span className="text-xs text-slate-500">{new Date(rec.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-400">{rec.description}</p>
                          <p className="text-xs text-slate-600 mt-1">By {rec.doctorName} at {rec.location}</p>
                        </div>
                      ))}
                   </div>
                </Card>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                Select a patient to view records
              </div>
            )}
          </div>
        </div>
      ) : (
        // LOGISTICS VIEW
        <div className="max-w-2xl mx-auto w-full animate-fade-in">
          <Card title="Request Medical Supplies">
            <p className="text-slate-400 mb-6 text-sm">Submit supply requests to the Director node. Requests are synced across the mesh priority queue.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Item</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-medical-500 outline-none"
                  value={selectedSupply}
                  onChange={(e) => setSelectedSupply(e.target.value)}
                >
                  <option value="">-- Choose from Catalog --</option>
                  {supplies.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.category} - {s.item} ({s.quantity} {s.unit} currently available)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Quantity Needed</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white focus:border-medical-500 outline-none"
                  value={requestQty}
                  onChange={(e) => setRequestQty(parseInt(e.target.value))}
                />
              </div>

              <Button onClick={handleRequestSupply} disabled={!selectedSupply} className="w-full py-3 mt-4">
                Transmit Request
              </Button>
            </div>
          </Card>

          <div className="mt-8">
            <h3 className="text-slate-400 text-sm font-bold uppercase mb-4">Supply Catalog Reference</h3>
            <div className="grid grid-cols-1 gap-2">
               {supplies.map(s => (
                 <div key={s.id} className="flex justify-between items-center p-3 bg-slate-800 rounded border border-slate-700">
                    <div>
                      <div className="font-medium text-slate-200">{s.item}</div>
                      <div className="text-xs text-slate-500">Batch: {s.batchNum || 'N/A'} • Exp: {s.expiryDate || 'N/A'}</div>
                    </div>
                    <div className="text-right">
                       <span className={`font-mono font-bold ${s.quantity < s.criticalThreshold ? 'text-red-500' : 'text-green-500'}`}>
                         {s.quantity}
                       </span>
                       <span className="text-xs text-slate-500 ml-1">{s.unit}</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};