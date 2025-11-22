
import React, { useState, useEffect } from 'react';
import { MeshState, SupplyRequest, StaffMember, Hospital, PatientTransferRequest, StaffStatus } from '../types';
import { Card, Button, Badge } from './ui_components';
import { getMeshState, createSupplyRequest, updateSupplyRequest, acceptPatientTransfer, acceptTransportRequest, createTransportRequest, addStaffMember, updateStaffStatus, getResourceTrends, broadcastSupplyRequest } from '../services/mockMesh';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  Legend,
  LabelList,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';

interface DirectorViewProps {
  meshState: MeshState;
}

interface MapPoint {
  x: number;
  y: number;
  name: string;
  id: string;
  type: string;
  patients: number;
  critical: number;
  unstable: number;
  capacity: number;
  isMyHospital: boolean;
  lowStock: string[];
}

export const DirectorView: React.FC<DirectorViewProps> = ({ meshState }) => {
  const [currentDirector, setCurrentDirector] = useState<StaffMember | null>(null);
  const [directors, setDirectors] = useState<StaffMember[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<MapPoint | null>(null);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'STAFF' | 'HOSPITAL_DETAIL'>('DASHBOARD');
  const [detailedHospitalId, setDetailedHospitalId] = useState<string | null>(null);
  
  // Modals
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  
  // Transport Inputs
  const [transportNote, setTransportNote] = useState('');
  const [transportDest, setTransportDest] = useState('');
  const [transportType, setTransportType] = useState<'SUPPLY_RUN' | 'PATIENT_TRANSFER' | 'STAFF_ROTATION'>('SUPPLY_RUN');
  
  // Add Staff Inputs
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'doctor' | 'nurse'>('doctor');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  
  // Filter States
  const [resourceCategory, setResourceCategory] = useState<string>('ALL');
  const [resourceScope, setResourceScope] = useState<string>('REGION'); // 'REGION' or specific Hospital ID
  const [refreshTick, setRefreshTick] = useState(0);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
     const state = getMeshState();
     setDirectors(state.staff.filter(s => s.role === 'director'));
     setTrendData(getResourceTrends());
  }, [refreshTick]);

  const forceRefresh = () => setRefreshTick(prev => prev + 1);

  // --- ACTIONS ---
  const handleBroadcast = (type: string) => {
    alert(`Emergency Broadcast: ${type} signal sent to all mesh nodes.`);
    setShowBroadcastModal(false);
  };

  const handleDivert = () => {
    alert(`Traffic diverted away from ${selectedHospital?.name}`);
    setSelectedHospital(null);
  };

  const handleUpdateOrder = (id: string, status: 'APPROVED' | 'FULFILLED' | 'IN_PROGRESS' | 'PENDING' | 'FULFILLED_EXTERNAL', externalName?: string) => {
    if(!currentDirector) return;
    updateSupplyRequest(id, status, currentDirector.id, currentDirector.name, externalName);
    forceRefresh();
  };
  
  const handleBroadcastOrder = (id: string) => {
      broadcastSupplyRequest(id);
      forceRefresh();
      alert("Request broadcasted to all mesh directors.");
  }

  const handleAcceptTransfer = (transferId: string) => {
      if(!currentDirector) return;
      acceptPatientTransfer(transferId, currentDirector.hospitalId);
      forceRefresh();
  };

  const submitTransportRequest = () => {
      if(!currentDirector) return;
      createTransportRequest(
          currentDirector.id, 
          currentDirector.hospitalId, 
          transportType, 
          transportNote,
          transportDest
      );
      forceRefresh();
      setShowTransportModal(false);
      setTransportNote('');
      setTransportDest('');
      alert("Logistics Convoy Dispatched");
  }
  
  const handleAcceptTransport = (id: string) => {
      acceptTransportRequest(id);
      forceRefresh();
  }

  const handleAddStaff = () => {
      if (!currentDirector) return;
      const newStaff: StaffMember = {
          id: 'U' + Math.floor(Math.random() * 10000),
          name: newStaffName,
          role: newStaffRole,
          hospitalId: currentDirector.hospitalId,
          email: `${newStaffName.replace(' ', '.').toLowerCase()}@${currentDirector.hospitalId.toLowerCase()}.org`,
          phone: newStaffPhone,
          status: StaffStatus.AVAILABLE,
          lastCheckIn: new Date().toISOString()
      };
      addStaffMember(newStaff);
      setNewStaffName('');
      setNewStaffPhone('');
      setShowAddStaffModal(false);
      forceRefresh();
  }

  const handleStaffStatusChange = (id: string, newStatus: StaffStatus) => {
      updateStaffStatus(id, newStatus);
      forceRefresh();
  }

  const viewHospitalDetails = (hospitalId: string) => {
      setDetailedHospitalId(hospitalId);
      setActiveTab('HOSPITAL_DETAIL');
      setSelectedHospital(null);
  };

  const getStaffName = (id: string) => {
      const s = meshState.staff.find(st => st.id === id);
      return s ? s.name : id;
  }

  // --- LOGIN VIEW ---
  if (!currentDirector) {
    return (
      <div className="max-w-3xl mx-auto mt-10 px-4 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Director Command Center</h2>
          <p className="text-slate-400">Strategic Oversight & Resource Allocation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {directors.map(dir => {
             const hosp = meshState.hospitals.find(h => h.id === dir.hospitalId);
             return (
              <button 
                key={dir.id}
                onClick={() => setCurrentDirector(dir)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-medical-500 p-6 rounded-xl text-left transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-white text-lg group-hover:text-medical-300">{dir.name}</div>
                  <span className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-400">{dir.hospitalId}</span>
                </div>
                <div className="text-sm text-slate-400">{hosp?.name}</div>
                <div className="text-xs text-slate-500 mt-1">{hosp?.province}</div>
              </button>
             );
          })}
        </div>
      </div>
    );
  }

  // --- DASHBOARD DATA PREP ---
  const mapData: MapPoint[] = meshState.hospitals.map(h => {
    const supplies = meshState.supplies.filter(s => s.hospitalId === h.id && s.quantity < s.criticalThreshold);
    return {
        x: h.coordinates.lng,
        y: h.coordinates.lat,
        name: h.name,
        id: h.id,
        type: h.type,
        capacity: h.capacity,
        patients: meshState.patients.filter(p => p.hospitalId === h.id).length,
        critical: meshState.patients.filter(p => p.hospitalId === h.id && p.status === 'CRITICAL').length,
        unstable: meshState.patients.filter(p => p.hospitalId === h.id && p.status === 'UNSTABLE').length,
        isMyHospital: h.id === currentDirector.hospitalId,
        lowStock: supplies.map(s => s.item)
    }
  });

  const minX = Math.min(...mapData.map(d => d.x)) - 0.05;
  const maxX = Math.max(...mapData.map(d => d.x)) + 0.05;
  const minY = Math.min(...mapData.map(d => d.y)) - 0.05;
  const maxY = Math.max(...mapData.map(d => d.y)) + 0.05;

  // ORDERS LOGIC
  const incomingOrders = meshState.supplyRequests.filter(r => 
      (r.targetHospitalId === currentDirector.hospitalId || r.targetHospitalId === 'BROADCAST') 
      && r.status === 'PENDING'
  );
  
  // History: Anything approved/fulfilled involving my hospital
  const orderHistory = meshState.supplyRequests.filter(r => 
      r.status !== 'PENDING' || (r.status === 'PENDING' && r.targetHospitalId !== currentDirector.hospitalId && r.targetHospitalId !== 'BROADCAST')
  );
  
  const transferQueue = meshState.transferRequests.filter(t => t.status === 'PENDING' && t.currentHospitalId !== currentDirector.hospitalId);

  // CHARTS - AGGREGATION LOGIC
  const filteredSupplies = meshState.supplies.filter(s => {
      const matchesCategory = resourceCategory === 'ALL' || s.category === resourceCategory;
      const matchesScope = resourceScope === 'REGION' || s.hospitalId === resourceScope;
      return matchesCategory && matchesScope;
  });

  const stockByItem = filteredSupplies.reduce((acc, s) => {
    acc[s.item] = (acc[s.item] || 0) + s.quantity;
    return acc;
  }, {} as Record<string, number>);
  
  const chartData = Object.keys(stockByItem).slice(0, 8).map(k => ({ name: k, value: stockByItem[k] }));

  const staffChartData = meshState.hospitals.map(h => {
      const staff = meshState.staff.filter(s => s.hospitalId === h.id);
      return {
          name: h.id,
          available: staff.filter(s => s.status === 'AVAILABLE').length,
          busy: staff.filter(s => s.status === 'BUSY').length,
          unreachable: staff.filter(s => s.status === 'UNREACHABLE').length
      }
  });

  const myStaff = meshState.staff.filter(s => s.hospitalId === currentDirector.hospitalId);

  const getNodeColor = (entry: MapPoint) => {
    if (entry.isMyHospital) return '#eab308';
    if (entry.critical > 2) return '#ef4444'; 
    if (entry.unstable > 4) return '#f97316'; 
    return '#3b82f6'; 
  }

  // Detailed View Data
  const detailedHospital = detailedHospitalId ? meshState.hospitals.find(h => h.id === detailedHospitalId) : null;
  const detailedPatients = detailedHospitalId ? meshState.patients.filter(p => p.hospitalId === detailedHospitalId) : [];
  const detailedStaff = detailedHospitalId ? meshState.staff.filter(s => s.hospitalId === detailedHospitalId) : [];
  const detailedStock = detailedHospitalId ? meshState.supplies.filter(s => s.hospitalId === detailedHospitalId) : [];

  return (
    <div className="space-y-6 animate-fade-in pb-20 relative">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
         <div>
           <h2 className="text-xl font-bold text-white">Command Node: {currentDirector.hospitalId}</h2>
           <p className="text-xs text-slate-400">Director {currentDirector.name}</p>
         </div>
         <div className="flex gap-3">
            <div className="flex bg-slate-800 rounded p-1">
                <button 
                   onClick={() => setActiveTab('DASHBOARD')}
                   className={`px-3 py-1 text-xs rounded ${activeTab === 'DASHBOARD' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                    Ops Dashboard
                </button>
                <button 
                   onClick={() => setActiveTab('STAFF')}
                   className={`px-3 py-1 text-xs rounded ${activeTab === 'STAFF' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                    Staff Mgmt
                </button>
            </div>
            <Button variant="secondary" onClick={() => setCurrentDirector(null)} className="text-xs">Logout</Button>
         </div>
      </div>

      {/* VIEW LOGIC SWITCHER */}
      {activeTab === 'HOSPITAL_DETAIL' && detailedHospital ? (
         <div className="space-y-6 animate-fade-in">
             <div className="flex items-center gap-4">
                 <Button variant="secondary" onClick={() => setActiveTab('DASHBOARD')} className="text-xs">← Back to Dashboard</Button>
                 <h2 className="text-2xl font-bold text-white">{detailedHospital.name} ({detailedHospital.id})</h2>
                 <Badge>{detailedHospital.type}</Badge>
             </div>

             <div className="grid lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-1">
                     <Card title="Hospital Status">
                         <div className="grid grid-cols-2 gap-4 mb-6">
                             <div className="bg-slate-800 p-3 rounded text-center border border-slate-700">
                                <div className="text-2xl font-bold text-white">{detailedHospital.capacity}</div>
                                <div className="text-[10px] text-slate-400 uppercase">Total Beds</div>
                             </div>
                             <div className="bg-slate-800 p-3 rounded text-center border border-slate-700">
                                <div className="text-2xl font-bold text-white">{detailedPatients.length}</div>
                                <div className="text-[10px] text-slate-400 uppercase">Current Patients</div>
                             </div>
                         </div>
                         <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Medical Staff</h4>
                         <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                             {detailedStaff.map(s => (
                                 <div key={s.id} className="flex justify-between items-center bg-slate-800/50 p-2 rounded">
                                     <div>
                                         <div className="text-sm font-bold text-white">{s.name}</div>
                                         <div className="text-[10px] text-slate-500 uppercase">{s.role}</div>
                                     </div>
                                     <Badge color={s.status === 'AVAILABLE' ? 'green' : 'red'}>{s.status}</Badge>
                                 </div>
                             ))}
                         </div>
                     </Card>
                 </div>

                 <div className="lg:col-span-1">
                     <Card title="Patient Roster">
                         <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
                             {detailedPatients.map(p => (
                                 <div key={p.id} className="p-3 bg-slate-800 border border-slate-700 rounded flex justify-between items-center">
                                     <div>
                                         <div className="text-sm font-bold text-white">{p.name}</div>
                                         <div className="text-[10px] text-slate-400">{p.conditions.join(', ')}</div>
                                     </div>
                                     <div className={`text-xs font-bold ${
                                         p.status === 'CRITICAL' ? 'text-red-500' : 
                                         p.status === 'UNSTABLE' ? 'text-orange-500' : 'text-green-500'
                                     }`}>
                                         {p.status}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </Card>
                 </div>

                 <div className="lg:col-span-1">
                     <Card title="Inventory">
                         <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
                             {detailedStock.map(s => (
                                 <div key={s.id} className="flex justify-between items-center p-2 bg-slate-800 border border-slate-700 rounded">
                                     <div>
                                         <div className="text-sm font-bold text-white">{s.item}</div>
                                         <div className="text-[10px] text-slate-500 uppercase">{s.category}</div>
                                     </div>
                                     <div className="text-right">
                                         <div className={`text-sm font-bold font-mono ${s.quantity < s.criticalThreshold ? 'text-red-500' : 'text-white'}`}>
                                             {s.quantity}
                                         </div>
                                         <div className="text-[10px] text-slate-500">{s.unit}</div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </Card>
                 </div>
             </div>
         </div>
      ) : activeTab === 'STAFF' ? (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Hospital Personnel</h3>
                  <Button onClick={() => setShowAddStaffModal(true)} className="text-xs">
                      + Recruit Staff
                  </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myStaff.map(member => (
                      <Card key={member.id} className="border-slate-700">
                          <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                      member.role === 'doctor' ? 'bg-medical-600' : 'bg-purple-600'
                                  }`}>
                                      {member.name.charAt(0)}
                                  </div>
                                  <div>
                                      <div className="font-bold text-white text-sm">{member.name}</div>
                                      <div className="text-xs text-slate-500 uppercase">{member.role} • {member.id}</div>
                                  </div>
                              </div>
                              <Badge color={
                                  member.status === 'AVAILABLE' ? 'green' : 
                                  member.status === 'BUSY' ? 'orange' : 
                                  member.status === 'UNREACHABLE' ? 'red' : 'gray'
                              }>{member.status}</Badge>
                          </div>
                          <div className="space-y-2 text-xs text-slate-400 mb-4">
                              <div>📞 {member.phone}</div>
                              <div>📧 {member.email}</div>
                              <div>🕒 Last Check-in: {new Date(member.lastCheckIn).toLocaleTimeString()}</div>
                          </div>
                          <div className="pt-3 border-t border-slate-700">
                              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Update Status</label>
                              <select 
                                  className="w-full bg-slate-900 border border-slate-600 rounded p-1.5 text-xs text-white outline-none"
                                  value={member.status}
                                  onChange={(e) => handleStaffStatusChange(member.id, e.target.value as StaffStatus)}
                              >
                                  {Object.values(StaffStatus).map(s => (
                                      <option key={s} value={s}>{s}</option>
                                  ))}
                              </select>
                          </div>
                      </Card>
                  ))}
              </div>
          </div>
      ) : (
        <>
          {/* DASHBOARD CONTENT */}
          <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 h-[450px] bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden shadow-xl group">
              {/* SATELLITE BACKGROUND */}
              <div className="absolute inset-0 bg-slate-900 z-0">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/8/87/Map_of_the_Gaza_Strip_2023-12-02.png" 
                    alt="Satellite Map" 
                    className="w-full h-full object-cover filter contrast-125 brightness-75 opacity-60 mix-blend-luminosity"
                    onError={(e) => e.currentTarget.style.display = 'none'} 
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_1px,#000_1px),linear-gradient(90deg,transparent_1px,#000_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>
              </div>

              <div className="absolute top-4 left-4 z-10 bg-slate-900/90 p-3 rounded border border-slate-700 shadow-lg pointer-events-none backdrop-blur-md">
                <h3 className="text-xs font-bold text-medical-400 uppercase tracking-wider mb-2">Live Uplink: Gaza Sector</h3>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                      <span className="text-[10px] text-slate-300">Operational Node</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span>
                      <span className="text-[10px] text-slate-300">Critical Load</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
                      <span className="text-[10px] text-slate-300">Unstable Load</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]"></span>
                      <span className="text-[10px] text-slate-300">My Facility</span>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 z-10">
                  <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <XAxis type="number" dataKey="x" domain={[minX, maxX]} hide />
                          <YAxis type="number" dataKey="y" domain={[minY, maxY]} hide />
                          <ZAxis type="number" range={[400, 1200]} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={() => null} />
                          <Scatter 
                              name="Hospitals" 
                              data={mapData}
                              onClick={(node) => {
                                  // @ts-ignore 
                                  if (node.payload) setSelectedHospital(node.payload);
                              }}
                              className="cursor-pointer"
                          >
                              {mapData.map((entry, index) => (
                              <Cell 
                                  key={`cell-${index}`} 
                                  fill={getNodeColor(entry)} 
                                  stroke="rgba(255,255,255,0.8)"
                                  strokeWidth={2}
                                  className="transition-all duration-300 hover:opacity-100 hover:scale-110 shadow-2xl"
                              />
                              ))}
                          </Scatter>
                      </ScatterChart>
                  </ResponsiveContainer>
              </div>
            </div>

            {/* RESOURCE OVERVIEW */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <Card 
                title="Inventory Levels" 
                className="flex-1 flex flex-col min-h-[250px]"
                action={
                    <div className="flex gap-2">
                        <select 
                            className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1 outline-none focus:border-medical-500 max-w-[80px]"
                            value={resourceScope}
                            onChange={(e) => setResourceScope(e.target.value)}
                        >
                            <option value="REGION">Regional (All)</option>
                            {meshState.hospitals.map(h => (
                                <option key={h.id} value={h.id}>{h.id}</option>
                            ))}
                        </select>
                        <select 
                            className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1 outline-none focus:border-medical-500 max-w-[80px]"
                            value={resourceCategory}
                            onChange={(e) => setResourceCategory(e.target.value)}
                        >
                            <option value="ALL">All Types</option>
                            <option value="MEDICINE">Meds</option>
                            <option value="TOOLS">Supplies</option>
                            <option value="BLOOD">Blood</option>
                        </select>
                    </div>
                }
              >
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={90} 
                            tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 500}} 
                            interval={0}
                          />
                          <Tooltip 
                            cursor={{fill: '#334155', opacity: 0.2}} 
                            contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px'}} 
                          />
                          <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={18}>
                             <LabelList dataKey="value" position="right" fill="#fff" fontSize={10} />
                          </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
              </Card>

              {/* RESOURCE TREND CHART */}
              <Card title="7-Day Consumption Trend" className="flex-1 min-h-[200px] flex flex-col">
                  <div className="flex-1 text-xs">
                     <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                             <defs>
                                <linearGradient id="colorInsulin" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorBand" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                             <XAxis dataKey="day" stroke="#64748b" tick={{fontSize: 10}} />
                             <YAxis stroke="#64748b" tick={{fontSize: 10}} />
                             <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px'}} />
                             <Area type="monotone" dataKey="Insulin" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorInsulin)" strokeWidth={2} />
                             <Area type="monotone" dataKey="Bandages" stroke="#22c55e" fillOpacity={1} fill="url(#colorBand)" strokeWidth={2} />
                         </AreaChart>
                     </ResponsiveContainer>
                  </div>
              </Card>
            </div>
          </div>
          
          {/* MIDDLE: STAFF & ORDERS */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card title="Staff Availability Levels" className="h-full">
                  <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={staffChartData} margin={{top: 20, right: 30, left: 0, bottom: 0}}>
                              <XAxis dataKey="name" stroke="#475569" fontSize={12} />
                              <YAxis stroke="#475569" fontSize={12} />
                              <Tooltip 
                                    contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px'}}
                                    cursor={{fill: '#334155', opacity: 0.2}} 
                              />
                              <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                              <Bar dataKey="available" name="Available" stackId="a" fill="#22c55e" barSize={40} />
                              <Bar dataKey="busy" name="Busy" stackId="a" fill="#eab308" barSize={40} />
                              <Bar dataKey="unreachable" name="Unreachable" stackId="a" fill="#ef4444" barSize={40} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card title="Incoming Priority Requests" className="border-l-4 border-l-yellow-500 bg-slate-900 h-full">
                  {incomingOrders.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 italic text-sm flex flex-col items-center">
                      <span className="text-2xl mb-2">✓</span>
                      No pending requests.
                  </div>
                  ) : (
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                      {incomingOrders.map(req => {
                        const isBroadcast = req.targetHospitalId === 'BROADCAST';
                        const isInternal = req.hospitalId === currentDirector.hospitalId;
                        
                        return (
                          <div key={req.id} className={`bg-slate-800/50 p-4 rounded-lg border ${isBroadcast ? 'border-blue-500/50 bg-blue-900/10' : 'border-slate-700'} flex flex-col gap-3 transition-all hover:border-slate-500`}>
                              <div>
                                  <div className="flex justify-between items-start">
                                      <div className="font-bold text-white text-sm flex items-center gap-2">
                                          {req.severity === 'critical' && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                                          {req.itemName}
                                      </div>
                                      {isBroadcast && <Badge color="blue">Broadcast</Badge>}
                                  </div>
                                  
                                  {req.patientName && (
                                      <div className="text-xs bg-slate-800 p-1 rounded border border-slate-700 mt-1 text-blue-200 inline-block">
                                          For Patient: {req.patientName}
                                      </div>
                                  )}
                                  <div className="text-xs text-slate-400 mt-1">
                                      <span className="text-medical-400 font-mono">{req.requesterName || getStaffName(req.requester)}</span> • Needs <span className="text-white font-bold">{req.quantity}</span> units
                                      <div className="text-[10px] text-slate-500 mt-0.5">Origin: {req.hospitalId}</div>
                                  </div>
                              </div>
                              <div className="flex gap-2 w-full flex-wrap">
                                  <Button 
                                      className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-500 flex-1 whitespace-nowrap"
                                      onClick={() => handleUpdateOrder(req.id, 'APPROVED')}
                                  >
                                      {isBroadcast ? 'Accept & Send' : 'Approve'}
                                  </Button>
                                  
                                  {/* If internal request and not yet broadcasted, allow broadcast */}
                                  {isInternal && !isBroadcast && (
                                      <Button 
                                          className="text-xs px-3 py-1.5 bg-blue-700 hover:bg-blue-600 flex-1"
                                          onClick={() => handleBroadcastOrder(req.id)}
                                      >
                                          Broadcast
                                      </Button>
                                  )}

                                  {/* If it is a broadcast, allow NGO Handover */}
                                  {isBroadcast && (
                                      <Button 
                                          className="text-xs px-3 py-1.5 bg-purple-700 hover:bg-purple-600 flex-1 whitespace-nowrap"
                                          // Fixed: Passed correct number of arguments to handleUpdateOrder (3 args)
                                          onClick={() => handleUpdateOrder(req.id, 'FULFILLED_EXTERNAL', 'Intl. Aid Org')}
                                      >
                                          Delegate to NGO
                                      </Button>
                                  )}

                                  {/* Only show decline for direct requests */}
                                  {!isBroadcast && (
                                      <Button 
                                          className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 flex-1"
                                          onClick={() => handleUpdateOrder(req.id, 'PENDING')} // Logic should essentially archive it
                                      >
                                          Decline
                                      </Button>
                                  )}
                              </div>
                          </div>
                        );
                      })}
                  </div>
                  )}
              </Card>
            </div>
          </div>

          {/* BOTTOM: LOGISTICS & ORDERS */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="lg:col-span-1">
                <Card title="Transport Logistics" className="h-full">
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {meshState.transportRequests && meshState.transportRequests.length > 0 ? (
                            meshState.transportRequests.map(tr => (
                                <div key={tr.id} className="p-3 bg-slate-800/30 border border-slate-700 rounded flex justify-between items-center">
                                    <div>
                                        <div className="text-sm font-bold text-slate-300">{tr.type.replace('_',' ')}</div>
                                        <div className="text-xs text-slate-500">
                                            {tr.originHospitalId} ➜ {tr.destinationHospitalId || 'Multi-Point'}
                                        </div>
                                        <div className="text-[10px] text-slate-500 italic">"{tr.notes}"</div>
                                    </div>
                                    {tr.status === 'SCHEDULED' ? (
                                        <Button onClick={() => handleAcceptTransport(tr.id)} className="text-[10px] px-2 py-1 bg-blue-600">Dispatch</Button>
                                    ) : (
                                        <Badge color={tr.status === 'EN_ROUTE' ? 'blue' : 'gray'}>{tr.status}</Badge>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-slate-500 text-center py-4 italic">No active convoys or transport logs.</div>
                        )}
                        
                        <div className="pt-4 border-t border-slate-800/50">
                            <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">Incoming Patient Transfers</h4>
                            {transferQueue.length === 0 ? (
                                <div className="text-xs text-slate-600">No patients awaiting transfer to your facility.</div>
                            ) : (
                                <div className="space-y-2">
                                    {transferQueue.map(tf => (
                                        <div key={tf.id} className="flex justify-between items-center bg-slate-800 p-2 rounded border border-slate-700">
                                            <div className="flex items-center gap-2">
                                                {tf.urgency === 'IMMEDIATE' && <span className="text-lg">🚨</span>}
                                                <div>
                                                    <div className="text-xs font-bold text-white">{tf.patientName}</div>
                                                    <div className="text-[10px] text-slate-500">From: {tf.currentHospitalId}</div>
                                                </div>
                                            </div>
                                            <Button onClick={() => handleAcceptTransfer(tf.id)} className="text-[10px] px-2 py-1 bg-green-700 hover:bg-green-600">
                                                Accept
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-1">
                <Card title="Network Order Feed" className="h-full">
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {[...orderHistory].map(req => {
                        // Highlight Critical Items
                        const isBlood = req.itemName.toLowerCase().includes('blood') || req.resourceType === 'Blood';
                        const isTrauma = req.itemName.toLowerCase().includes('trauma') || req.resourceType === 'Tools';
                        const isNGO = req.status === 'FULFILLED_EXTERNAL';
                        
                        return (
                            <div key={req.id} className={`flex justify-between items-center text-sm p-2 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 rounded ${isBlood ? 'bg-red-950/20' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                        req.status === 'PENDING' ? 'bg-yellow-500' : 
                                        req.status === 'APPROVED' ? 'bg-green-500' : 
                                        isNGO ? 'bg-purple-500' : 'bg-blue-500'
                                    }`}></span>
                                    
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-300 text-xs font-bold">
                                                {req.hospitalId} <span className="text-slate-500">➜</span> {req.targetHospitalId === 'BROADCAST' ? 'NETWORK' : req.targetHospitalId}
                                            </span>
                                            {/* Critical Icons */}
                                            {isBlood && <span title="Critical Blood Request">🩸</span>}
                                            {isTrauma && <span title="Trauma Supplies">🧰</span>}
                                        </div>
                                        
                                        <span className={`text-xs ${isBlood ? 'text-red-300 font-bold' : 'text-white'}`}>{req.itemName}</span>
                                        
                                        <div className="text-[10px] text-slate-500 mt-0.5 flex flex-col">
                                            {req.resourceType && <span className="text-medical-500 uppercase text-[9px] tracking-wider">{req.resourceType}</span>}
                                            
                                            {/* Requester / Approver Trail */}
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <span>Req: {req.requesterName || getStaffName(req.requester)}</span>
                                            </div>
                                            {req.status === 'APPROVED' && (
                                                <span className="text-green-400/70 flex items-center gap-1">
                                                    ✓ Approved by: {req.approverName || (req.approverId ? getStaffName(req.approverId) : 'Unknown')}
                                                </span>
                                            )}
                                            {isNGO && (
                                                <span className="text-purple-400/70 flex items-center gap-1">
                                                    🤝 Fulfilled by: {req.externalEntityName || 'External NGO'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Badge color={req.status === 'APPROVED' ? 'green' : isNGO ? 'teal' : 'yellow'}>
                                    {isNGO ? 'NGO AID' : req.status}
                                </Badge>
                            </div>
                        );
                    })}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="flex gap-3">
                            <Button 
                                variant="danger"
                                className="text-xs flex-1 flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                                onClick={() => setShowBroadcastModal(true)}
                            >
                                🚨 Broadcast Emergency
                            </Button>
                            <Button 
                                className="text-xs flex-1 bg-slate-700 hover:bg-slate-600"
                                onClick={() => setShowTransportModal(true)}
                            >
                                🚚 Request Transport
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
          </div>
        </>
      )}

      {/* MAP INTERACTION OVERLAY */}
      {selectedHospital && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedHospital(null)}>
          <div className="bg-slate-900 border border-slate-700 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button 
                onClick={() => setSelectedHospital(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 rounded-full p-1"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-medical-900/30 rounded-xl border border-medical-700/50">
                    <svg className="w-8 h-8 text-medical-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{selectedHospital.name}</h3>
                    <div className="flex gap-2 text-xs mt-1.5">
                        <Badge>{selectedHospital.type}</Badge>
                        <span className="text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded">{selectedHospital.id}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-800/50 p-3 rounded border border-slate-700 text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Occupancy</div>
                    <div className="text-xl font-bold text-white mt-1">{selectedHospital.patients}</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded border border-slate-700 text-center relative overflow-hidden">
                    {selectedHospital.critical > 5 && <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>}
                    <div className="text-[10px] text-red-400 uppercase font-bold">Critical</div>
                    <div className="text-xl font-bold text-red-400 mt-1">{selectedHospital.critical}</div>
                </div>
                <div className="bg-slate-800/50 p-3 rounded border border-slate-700 text-center relative overflow-hidden">
                    {selectedHospital.unstable > 5 && <div className="absolute inset-0 bg-orange-500/10 animate-pulse"></div>}
                    <div className="text-[10px] text-orange-400 uppercase font-bold">Unstable</div>
                    <div className="text-xl font-bold text-orange-400 mt-1">{selectedHospital.unstable}</div>
                </div>
            </div>
            
            {selectedHospital.lowStock.length > 0 && (
                <div className="mb-6 p-3 bg-red-900/20 border border-red-800 rounded text-xs">
                    <div className="font-bold text-red-400 uppercase mb-1 flex items-center gap-2">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        Low Stock Alerts
                    </div>
                    <div className="text-red-200">{selectedHospital.lowStock.join(', ')}</div>
                </div>
            )}

            <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Regional Command Actions</h4>
                <Button className="w-full justify-center py-3" onClick={() => viewHospitalDetails(selectedHospital.id)}>
                    View Full Details
                </Button>
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" className="w-full justify-center text-xs" onClick={() => alert(`Supply drop scheduled for ${selectedHospital.name}`)}>
                        Dispatch Supplies
                    </Button>
                    <Button variant="danger" className="w-full justify-center text-xs" onClick={handleDivert}>
                        Divert Traffic
                    </Button>
                </div>
            </div>
          </div>
        </div>
      )}
      
      {/* BROADCAST MODAL */}
      {showBroadcastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
             <div className="bg-red-900/20 border border-red-800 bg-slate-900 rounded-xl p-6 w-full max-w-sm">
                 <h3 className="text-xl font-bold text-red-400 mb-2">Emergency Broadcast</h3>
                 <p className="text-sm text-slate-400 mb-6">Select signal type to transmit to all active mesh nodes.</p>
                 <div className="space-y-3">
                     <button onClick={() => handleBroadcast('MASS_CASUALTY')} className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold text-sm">MASS CASUALTY EVENT</button>
                     <button onClick={() => handleBroadcast('OUTBREAK')} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded font-bold text-sm">DISEASE OUTBREAK</button>
                     <button onClick={() => handleBroadcast('SUPPLY_FAILURE')} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-3 rounded font-bold text-sm">CRITICAL SUPPLY FAILURE</button>
                     <button onClick={() => setShowBroadcastModal(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded text-xs mt-4">Cancel</button>
                 </div>
             </div>
          </div>
      )}

      {/* TRANSPORT MODAL */}
      {showTransportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
             <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm">
                 <h3 className="text-lg font-bold text-white mb-4">Deploy Transport Convoy</h3>
                 <div className="space-y-3">
                     <div>
                        <label className="text-xs text-slate-400 block mb-1">Mission Type</label>
                        <select 
                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-medical-500"
                            value={transportType}
                            onChange={(e) => setTransportType(e.target.value as any)}
                        >
                            <option value="SUPPLY_RUN">Supply Run</option>
                            <option value="PATIENT_TRANSFER">Patient Transfer</option>
                            <option value="STAFF_ROTATION">Staff Rotation</option>
                        </select>
                     </div>
                     <div>
                        <label className="text-xs text-slate-400 block mb-1">Destination (Optional)</label>
                        <input className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-medical-500" 
                            placeholder="Specific Hospital ID or Leave Blank"
                            value={transportDest} onChange={e => setTransportDest(e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="text-xs text-slate-400 block mb-1">Mission Notes</label>
                        <textarea className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-medical-500 min-h-[80px]" 
                            placeholder="Reason for transport, cargo manifest..."
                            value={transportNote} onChange={e => setTransportNote(e.target.value)}
                        ></textarea>
                     </div>
                     <div className="flex gap-3 mt-4">
                         <Button variant="secondary" onClick={() => setShowTransportModal(false)} className="flex-1">Cancel</Button>
                         <Button onClick={submitTransportRequest} className="flex-1">Dispatch</Button>
                     </div>
                 </div>
             </div>
          </div>
      )}

      {/* ADD STAFF MODAL */}
      {showAddStaffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
             <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm">
                 <h3 className="text-lg font-bold text-white mb-4">Recruit New Personnel</h3>
                 <div className="space-y-3">
                     <div>
                         <label className="text-xs text-slate-400 block mb-1">Full Name</label>
                         <input 
                             className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-medical-500"
                             value={newStaffName}
                             onChange={(e) => setNewStaffName(e.target.value)}
                         />
                     </div>
                     <div>
                         <label className="text-xs text-slate-400 block mb-1">Role</label>
                         <select 
                             className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-medical-500"
                             value={newStaffRole}
                             onChange={(e) => setNewStaffRole(e.target.value as any)}
                         >
                             <option value="doctor">Doctor</option>
                             <option value="nurse">Nurse</option>
                         </select>
                     </div>
                     <div>
                         <label className="text-xs text-slate-400 block mb-1">Phone Number</label>
                         <input 
                             className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-medical-500"
                             value={newStaffPhone}
                             onChange={(e) => setNewStaffPhone(e.target.value)}
                         />
                     </div>
                     <div className="flex gap-3 mt-4">
                         <Button variant="secondary" onClick={() => setShowAddStaffModal(false)} className="flex-1">Cancel</Button>
                         <Button onClick={handleAddStaff} className="flex-1">Add to Roster</Button>
                     </div>
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};
