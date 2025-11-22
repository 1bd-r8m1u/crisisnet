import React, { useState, useEffect } from 'react';
import { MeshState, SupplyRequest, StaffMember, Hospital, PatientTransferRequest, StaffStatus } from '../types';
import { Card, Button, Badge } from './ui_components';
import { getMeshState, createSupplyRequest, updateSupplyRequest, acceptPatientTransfer, acceptTransportRequest, createTransportRequest, addStaffMember, updateStaffStatus, getResourceTrends, broadcastSupplyRequest } from '../services/mockMesh';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, BarChart, Bar, Legend, LabelList, AreaChart, Area, CartesianGrid } from 'recharts';

interface DirectorViewProps {
  meshState: MeshState;
}

interface MapPoint {
  x: number; y: number; name: string; id: string; type: string; patients: number; critical: number; unstable: number; capacity: number; isMyHospital: boolean; lowStock: string[];
}

export const DirectorView: React.FC<DirectorViewProps> = ({ meshState }) => {
  const [currentDirector, setCurrentDirector] = useState<StaffMember | null>(null);
  const [directors, setDirectors] = useState<StaffMember[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<MapPoint | null>(null);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'STAFF' | 'HOSPITAL_DETAIL'>('DASHBOARD');
  const [detailedHospitalId, setDetailedHospitalId] = useState<string | null>(null);
  
  // Modals & Inputs
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [transportNote, setTransportNote] = useState('');
  const [transportDest, setTransportDest] = useState('');
  const [transportType, setTransportType] = useState<'SUPPLY_RUN' | 'PATIENT_TRANSFER' | 'STAFF_ROTATION'>('SUPPLY_RUN');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'doctor' | 'nurse'>('doctor');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  
  // Filter States
  const [resourceCategory, setResourceCategory] = useState<string>('ALL');
  const [resourceScope, setResourceScope] = useState<string>('REGION'); 
  const [refreshTick, setRefreshTick] = useState(0);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
     const state = getMeshState();
     setDirectors(state.staff.filter(s => s.role === 'director'));
     setTrendData(getResourceTrends());
  }, [refreshTick]);

  const forceRefresh = () => setRefreshTick(prev => prev + 1);

  // Actions
  const handleBroadcast = (type: string) => { alert(`Emergency Broadcast: ${type} sent.`); setShowBroadcastModal(false); };
  const handleDivert = () => { alert(`Traffic diverted from ${selectedHospital?.name}`); setSelectedHospital(null); };
  const handleUpdateOrder = (id: string, status: any, externalName?: string) => { if(!currentDirector) return; updateSupplyRequest(id, status, currentDirector.id, currentDirector.name, externalName); forceRefresh(); };
  const handleBroadcastOrder = (id: string) => { broadcastSupplyRequest(id); forceRefresh(); alert("Broadcast sent."); }
  const handleAcceptTransfer = (transferId: string) => { if(!currentDirector) return; acceptPatientTransfer(transferId, currentDirector.hospitalId); forceRefresh(); };
  const submitTransportRequest = () => { if(!currentDirector) return; createTransportRequest(currentDirector.id, currentDirector.hospitalId, transportType, transportNote, transportDest); forceRefresh(); setShowTransportModal(false); setTransportNote(''); setTransportDest(''); alert("Convoy Dispatched"); }
  const handleAcceptTransport = (id: string) => { acceptTransportRequest(id); forceRefresh(); }
  const handleAddStaff = () => { if (!currentDirector) return; addStaffMember({ id: 'U' + Math.floor(Math.random() * 10000), name: newStaffName, role: newStaffRole, hospitalId: currentDirector.hospitalId, email: `${newStaffName.replace(' ', '.').toLowerCase()}@org`, phone: newStaffPhone, status: StaffStatus.AVAILABLE, lastCheckIn: new Date().toISOString() }); setShowAddStaffModal(false); forceRefresh(); }
  const handleStaffStatusChange = (id: string, newStatus: StaffStatus) => { updateStaffStatus(id, newStatus); forceRefresh(); }
  const viewHospitalDetails = (hospitalId: string) => { setDetailedHospitalId(hospitalId); setActiveTab('HOSPITAL_DETAIL'); setSelectedHospital(null); };
  const getStaffName = (id: string) => { const s = meshState.staff.find(st => st.id === id); return s ? s.name : id; }

  // Login
  if (!currentDirector) {
    return (
      <div className="max-w-3xl mx-auto mt-10 px-4 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Director Command Center</h2>
          <p className="text-slate-500">Strategic Oversight & Resource Allocation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {directors.map(dir => {
             const hosp = meshState.hospitals.find(h => h.id === dir.hospitalId);
             return (
              <button key={dir.id} onClick={() => setCurrentDirector(dir)} className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-medical-300 p-6 rounded-lg text-left transition-all shadow-sm group">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-slate-800 text-lg group-hover:text-medical-700">{dir.name}</div>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 border border-slate-200">{dir.hospitalId}</span>
                </div>
                <div className="text-sm text-slate-500">{hosp?.name}</div>
                <div className="text-xs text-slate-400 mt-1">{hosp?.province}</div>
              </button>
             );
          })}
        </div>
      </div>
    );
  }

  // Data Prep
  const mapData: MapPoint[] = meshState.hospitals.map(h => {
    const supplies = meshState.supplies.filter(s => s.hospitalId === h.id && s.quantity < s.criticalThreshold);
    return {
        x: h.coordinates.lng, y: h.coordinates.lat, name: h.name, id: h.id, type: h.type, capacity: h.capacity,
        patients: meshState.patients.filter(p => p.hospitalId === h.id).length,
        critical: meshState.patients.filter(p => p.hospitalId === h.id && p.status === 'CRITICAL').length,
        unstable: meshState.patients.filter(p => p.hospitalId === h.id && p.status === 'UNSTABLE').length,
        isMyHospital: h.id === currentDirector.hospitalId,
        lowStock: supplies.map(s => s.item)
    }
  });
  const minX = Math.min(...mapData.map(d => d.x)) - 0.05; const maxX = Math.max(...mapData.map(d => d.x)) + 0.05;
  const minY = Math.min(...mapData.map(d => d.y)) - 0.05; const maxY = Math.max(...mapData.map(d => d.y)) + 0.05;

  const incomingOrders = meshState.supplyRequests.filter(r => (r.targetHospitalId === currentDirector.hospitalId || r.targetHospitalId === 'BROADCAST') && r.status === 'PENDING');
  const orderHistory = meshState.supplyRequests.filter(r => r.status !== 'PENDING' || (r.status === 'PENDING' && r.targetHospitalId !== currentDirector.hospitalId && r.targetHospitalId !== 'BROADCAST'));
  const transferQueue = meshState.transferRequests.filter(t => t.status === 'PENDING' && t.currentHospitalId !== currentDirector.hospitalId);

  const filteredSupplies = meshState.supplies.filter(s => (resourceCategory === 'ALL' || s.category === resourceCategory) && (resourceScope === 'REGION' || s.hospitalId === resourceScope));
  const stockByItem = filteredSupplies.reduce((acc, s) => { acc[s.item] = (acc[s.item] || 0) + s.quantity; return acc; }, {} as Record<string, number>);
  const chartData = Object.keys(stockByItem).slice(0, 8).map(k => ({ name: k, value: stockByItem[k] }));
  const staffChartData = meshState.hospitals.map(h => {
      const staff = meshState.staff.filter(s => s.hospitalId === h.id);
      return { name: h.id, available: staff.filter(s => s.status === 'AVAILABLE').length, busy: staff.filter(s => s.status === 'BUSY').length, unreachable: staff.filter(s => s.status === 'UNREACHABLE').length }
  });
  const myStaff = meshState.staff.filter(s => s.hospitalId === currentDirector.hospitalId);
  const getNodeColor = (entry: MapPoint) => { if (entry.isMyHospital) return '#eab308'; if (entry.critical > 2) return '#ef4444'; if (entry.unstable > 4) return '#f97316'; return '#3b82f6'; }

  const detailedHospital = detailedHospitalId ? meshState.hospitals.find(h => h.id === detailedHospitalId) : null;
  const detailedPatients = detailedHospitalId ? meshState.patients.filter(p => p.hospitalId === detailedHospitalId) : [];
  const detailedStaff = detailedHospitalId ? meshState.staff.filter(s => s.hospitalId === detailedHospitalId) : [];
  const detailedStock = detailedHospitalId ? meshState.supplies.filter(s => s.hospitalId === detailedHospitalId) : [];

  return (
    <div className="space-y-6 animate-fade-in pb-20 relative">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
         <div><h2 className="text-xl font-bold text-slate-900">Command Node: {currentDirector.hospitalId}</h2><p className="text-xs text-slate-500">Director {currentDirector.name}</p></div>
         <div className="flex gap-3">
            <div className="flex bg-slate-100 rounded p-1 border border-slate-200">
                <button onClick={() => setActiveTab('DASHBOARD')} className={`px-3 py-1 text-xs rounded font-bold ${activeTab === 'DASHBOARD' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Ops Dashboard</button>
                <button onClick={() => setActiveTab('STAFF')} className={`px-3 py-1 text-xs rounded font-bold ${activeTab === 'STAFF' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Staff Mgmt</button>
            </div>
            <Button variant="secondary" onClick={() => setCurrentDirector(null)} className="text-xs">Logout</Button>
         </div>
      </div>

      {activeTab === 'HOSPITAL_DETAIL' && detailedHospital ? (
         <div className="space-y-6 animate-fade-in">
             <div className="flex items-center gap-4">
                 <Button variant="secondary" onClick={() => setActiveTab('DASHBOARD')} className="text-xs">← Dashboard</Button>
                 <h2 className="text-2xl font-bold text-slate-900">{detailedHospital.name} ({detailedHospital.id})</h2>
             </div>
             <div className="grid lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-1"><Card title="Hospital Status"><div className="grid grid-cols-2 gap-4 mb-6">
                     <div className="bg-slate-50 p-3 rounded border border-slate-200 text-center"><div className="text-2xl font-bold text-slate-800">{detailedHospital.capacity}</div><div className="text-[10px] text-slate-400 uppercase">Beds</div></div>
                     <div className="bg-slate-50 p-3 rounded border border-slate-200 text-center"><div className="text-2xl font-bold text-slate-800">{detailedPatients.length}</div><div className="text-[10px] text-slate-400 uppercase">Patients</div></div>
                 </div></Card></div>
                 <div className="lg:col-span-1"><Card title="Patients"><div className="space-y-2 max-h-[450px] overflow-y-auto">{detailedPatients.map(p => (
                     <div key={p.id} className="p-2 bg-slate-50 border border-slate-200 rounded flex justify-between text-sm"><span className="font-bold text-slate-700">{p.name}</span><Badge color={p.status === 'CRITICAL' ? 'red' : 'green'}>{p.status}</Badge></div>
                 ))}</div></Card></div>
                 <div className="lg:col-span-1"><Card title="Stock"><div className="space-y-2 max-h-[450px] overflow-y-auto">{detailedStock.map(s => (
                     <div key={s.id} className="p-2 bg-slate-50 border border-slate-200 rounded flex justify-between text-sm"><span className="font-bold text-slate-700">{s.item}</span><span className="font-mono">{s.quantity}</span></div>
                 ))}</div></Card></div>
             </div>
         </div>
      ) : activeTab === 'STAFF' ? (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center"><h3 className="text-xl font-bold text-slate-900">Hospital Personnel</h3><Button onClick={() => setShowAddStaffModal(true)} className="text-xs">+ Recruit Staff</Button></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{myStaff.map(member => (
                  <Card key={member.id}><div className="flex justify-between items-start mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-medical-100 text-medical-700 flex items-center justify-center font-bold">{member.name.charAt(0)}</div><div><div className="font-bold text-slate-800 text-sm">{member.name}</div><div className="text-xs text-slate-500 uppercase">{member.role}</div></div></div><Badge color={member.status === 'AVAILABLE' ? 'green' : 'gray'}>{member.status}</Badge></div></Card>
              ))}</div>
          </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 h-[450px] bg-white border border-slate-200 rounded-xl relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-slate-100 z-0"><div className="absolute inset-0 bg-[linear-gradient(#e2e8f0_1px,transparent_1px),linear-gradient(90deg,#e2e8f0_1px,transparent_1px)] bg-[size:20px_20px]"></div></div>
              <div className="absolute inset-0 z-10">
                  <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <XAxis type="number" dataKey="x" domain={[minX, maxX]} hide />
                          <YAxis type="number" dataKey="y" domain={[minY, maxY]} hide />
                          <ZAxis type="number" range={[400, 1200]} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={() => null} />
                          <Scatter name="Hospitals" data={mapData} onClick={(node: any) => { if (node.payload) setSelectedHospital(node.payload); }} className="cursor-pointer">
                              {mapData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={getNodeColor(entry)} stroke="#fff" strokeWidth={2} /> ))}
                          </Scatter>
                      </ScatterChart>
                  </ResponsiveContainer>
              </div>
            </div>
            <div className="lg:col-span-1 flex flex-col gap-4">
              <Card title="Inventory Levels" className="flex-1 flex flex-col min-h-[250px]" action={
                    <div className="flex gap-2"><select className="bg-white border border-slate-300 text-xs rounded px-2 py-1 outline-none" value={resourceScope} onChange={(e) => setResourceScope(e.target.value)}><option value="REGION">Regional</option>{meshState.hospitals.map(h => (<option key={h.id} value={h.id}>{h.id}</option>))}</select></div>
                }>
                  <div className="flex-1"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} layout="vertical" margin={{ left: 10 }}><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={90} tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}} interval={0} /><Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={18}><LabelList dataKey="value" position="right" fill="#475569" fontSize={10} /></Bar></BarChart></ResponsiveContainer></div>
              </Card>
              <Card title="7-Day Consumption" className="flex-1 min-h-[200px] flex flex-col"><div className="flex-1 text-xs"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey="day" stroke="#94a3b8" tick={{fontSize: 10}} /><YAxis stroke="#94a3b8" tick={{fontSize: 10}} /><Area type="monotone" dataKey="Insulin" stroke="#0ea5e9" fill="#e0f2fe" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></Card>
            </div>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2"><Card title="Staff Availability" className="h-full"><div className="h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={staffChartData}><XAxis dataKey="name" stroke="#475569" /><YAxis stroke="#475569" /><Bar dataKey="available" stackId="a" fill="#22c55e" barSize={40} /><Bar dataKey="busy" stackId="a" fill="#eab308" barSize={40} /><Bar dataKey="unreachable" stackId="a" fill="#ef4444" barSize={40} /></BarChart></ResponsiveContainer></div></Card></div>
             <div className="lg:col-span-1"><Card title="Incoming Requests" className="bg-white h-full">
                 <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {incomingOrders.map(req => (
                        <div key={req.id} className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-col gap-2">
                            <div className="flex justify-between"><span className="font-bold text-sm text-slate-800">{req.itemName}</span><Badge color="blue">{req.quantity}</Badge></div>
                            <div className="text-xs text-slate-500">Req: {getStaffName(req.requester)} • Origin: {req.hospitalId}</div>
                            <div className="flex gap-2"><Button className="text-[10px] py-1 flex-1" onClick={() => handleUpdateOrder(req.id, 'APPROVED')}>Approve</Button><Button variant="secondary" className="text-[10px] py-1 flex-1" onClick={() => handleUpdateOrder(req.id, 'PENDING')}>Decline</Button></div>
                        </div>
                    ))}
                    {incomingOrders.length === 0 && <div className="text-center text-slate-400 text-xs py-4">No pending requests.</div>}
                 </div>
             </Card></div>
          </div>
          
          {/* MAP POPUP */}
          {selectedHospital && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedHospital(null)}>
              <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-4 mb-6"><div className="p-3 bg-medical-50 rounded-lg border border-medical-100"><svg className="w-8 h-8 text-medical-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div><div><h3 className="text-xl font-bold text-slate-900">{selectedHospital.name}</h3><div className="flex gap-2 text-xs mt-1.5"><Badge>{selectedHospital.type}</Badge></div></div></div>
                <div className="grid grid-cols-3 gap-3 mb-6"><div className="bg-slate-50 p-3 rounded border border-slate-200 text-center"><div className="text-xs text-slate-500 font-bold">Occupancy</div><div className="text-xl font-bold text-slate-800">{selectedHospital.patients}</div></div><div className="bg-slate-50 p-3 rounded border border-slate-200 text-center"><div className="text-xs text-red-500 font-bold">Critical</div><div className="text-xl font-bold text-red-600">{selectedHospital.critical}</div></div><div className="bg-slate-50 p-3 rounded border border-slate-200 text-center"><div className="text-xs text-orange-500 font-bold">Unstable</div><div className="text-xl font-bold text-orange-500">{selectedHospital.unstable}</div></div></div>
                <div className="space-y-3"><Button className="w-full py-3" onClick={() => viewHospitalDetails(selectedHospital.id)}>View Full Details</Button><div className="grid grid-cols-2 gap-3"><Button variant="secondary" className="w-full text-xs" onClick={() => alert(`Supplies sent`)}>Dispatch Supplies</Button><Button variant="danger" className="w-full text-xs" onClick={handleDivert}>Divert Traffic</Button></div></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};