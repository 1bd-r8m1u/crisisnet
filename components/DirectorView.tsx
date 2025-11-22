
import React, { useState, useEffect } from 'react';
import { MeshState, SupplyRequest, StaffMember, Hospital, PatientTransferRequest, StaffStatus } from '../types';
import { Card, Button, Badge } from './ui_components';
import { getMeshState, updateSupplyRequest, acceptPatientTransfer, acceptTransportRequest, createTransportRequest, addStaffMember, updateStaffStatus, getResourceTrends, broadcastSupplyRequest, rejectPatientTransfer, broadcastEmergencyAlert } from '../services/mockMesh';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface DirectorViewProps {
  meshState: MeshState;
}

interface MapPoint {
  x: number; y: number; name: string; id: string; type: string; patients: number; critical: number; unstable: number; capacity: number; isMyHospital: boolean; lowStock: string[];
}

// Custom Node Renderer for the Map
const CustomMapNode = (props: any) => {
  const { cx, cy, payload } = props;
  
  // Different shapes/colors for different hospital types
  const isField = payload.type === 'Field';
  const isClinic = payload.type === 'Clinic';
  const isGeneral = payload.type === 'General' || payload.type === 'Referral';
  
  // Status colors
  const isCritical = payload.critical > 2;
  const isWarning = payload.unstable > 4;
  const strokeColor = isCritical ? '#ef4444' : isWarning ? '#f97316' : '#3b82f6';
  const fillColor = payload.isMyHospital ? '#eab308' : '#ffffff';

  return (
    <g className="cursor-pointer hover:opacity-80 transition-opacity">
       {/* Pulsating ring for critical nodes */}
       {isCritical && (
         <circle cx={cx} cy={cy} r={25} fill="none" stroke="#ef4444" strokeWidth={1} opacity={0.5}>
            <animate attributeName="r" from="15" to="35" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
         </circle>
       )}

       {/* Main Node Body */}
       <circle cx={cx} cy={cy} r={isGeneral ? 12 : 8} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
       
       {/* Inner Icon */}
       <text x={cx} y={cy} dy={4} textAnchor="middle" fontSize={isGeneral ? 10 : 8} fill={payload.isMyHospital ? '#fff' : '#475569'} fontWeight="bold" style={{ pointerEvents: 'none' }}>
         {isField ? '⛺' : isClinic ? '✚' : 'H'}
       </text>

       {/* Label */}
       <text x={cx} y={cy + 24} textAnchor="middle" fontSize={8} fill="#1e293b" fontWeight="600" className="font-mono uppercase tracking-wider bg-white">
          {payload.id}
       </text>
    </g>
  );
};

export const DirectorView: React.FC<DirectorViewProps> = ({ meshState }) => {
  const [currentDirector, setCurrentDirector] = useState<StaffMember | null>(null);
  const [directors, setDirectors] = useState<StaffMember[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<MapPoint | null>(null);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'STAFF' | 'HOSPITAL_DETAIL' | 'TRANSFERS'>('DASHBOARD');
  const [detailedHospitalId, setDetailedHospitalId] = useState<string | null>(null);
  
  // Modals & Inputs
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'doctor' | 'nurse'>('doctor');
  const [newStaffPhone, setNewStaffPhone] = useState('');

  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'info' | 'warning' | 'critical'>('info');
  
  // Filter States
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
     const state = getMeshState();
     setDirectors(state.staff.filter(s => s.role === 'director'));
  }, [refreshTick]);

  const forceRefresh = () => setRefreshTick(prev => prev + 1);

  // Actions
  const handleDivert = () => { alert(`Traffic diverted from ${selectedHospital?.name}`); setSelectedHospital(null); };
  const handleUpdateOrder = (id: string, status: any, externalName?: string) => { if(!currentDirector) return; updateSupplyRequest(id, status, currentDirector.id, currentDirector.name, externalName); forceRefresh(); };
  const handleBroadcastOrder = (id: string) => { broadcastSupplyRequest(id); forceRefresh(); alert("Request Broadcasted to Mesh Network"); };
  const handleAcceptTransfer = (transferId: string) => { if(!currentDirector) return; acceptPatientTransfer(transferId, currentDirector.hospitalId); forceRefresh(); };
  const handleRejectTransfer = (transferId: string) => { rejectPatientTransfer(transferId); forceRefresh(); };
  const handleAddStaff = () => { if (!currentDirector) return; addStaffMember({ id: 'U' + Math.floor(Math.random() * 10000), name: newStaffName, role: newStaffRole, hospitalId: currentDirector.hospitalId, email: `${newStaffName.replace(' ', '.').toLowerCase()}@org`, phone: newStaffPhone, status: StaffStatus.AVAILABLE, lastCheckIn: new Date().toISOString() }); setShowAddStaffModal(false); setNewStaffName(''); setNewStaffPhone(''); forceRefresh(); }
  const viewHospitalDetails = (hospitalId: string) => { setDetailedHospitalId(hospitalId); setActiveTab('HOSPITAL_DETAIL'); setSelectedHospital(null); };
  
  const handleSendBroadcast = () => {
      if(!currentDirector) return;
      broadcastEmergencyAlert(alertMessage, alertSeverity, currentDirector.name);
      setShowBroadcastModal(false);
      setAlertMessage('');
      forceRefresh();
      alert("Emergency Alert Broadcasted.");
  };

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
  const networkFeed = meshState.supplyRequests.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const externalTransfers = meshState.transferRequests.filter(t => t.currentHospitalId !== currentDirector.hospitalId && t.status === 'PENDING');

  const myStaff = meshState.staff.filter(s => s.hospitalId === currentDirector.hospitalId);
  const detailedHospital = detailedHospitalId ? meshState.hospitals.find(h => h.id === detailedHospitalId) : null;
  const detailedPatients = detailedHospitalId ? meshState.patients.filter(p => p.hospitalId === detailedHospitalId) : [];
  const detailedStock = detailedHospitalId ? meshState.supplies.filter(s => s.hospitalId === detailedHospitalId) : [];

  // HEATMAP MATRIX DATA PREP
  const keyResources = ['Insulin', 'Bandages', 'Antibiotics', 'IV Fluids', 'Trauma Kits'];
  const hospitalIds = meshState.hospitals.map(h => h.id);
  
  const getStockLevelColor = (qty: number, thresh: number) => {
      if (qty === 0) return 'bg-slate-200 text-slate-400'; // Empty/Unknown
      if (qty < thresh) return 'bg-red-500 text-white';
      if (qty < thresh * 2) return 'bg-yellow-400 text-yellow-900';
      return 'bg-green-500 text-white';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 relative">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
         <div><h2 className="text-xl font-bold text-slate-900">Command Node: {currentDirector.hospitalId}</h2><p className="text-xs text-slate-500">Director {currentDirector.name}</p></div>
         <div className="flex gap-3">
            <div className="flex bg-slate-100 rounded p-1 border border-slate-200">
                <button onClick={() => setActiveTab('DASHBOARD')} className={`px-3 py-1 text-xs rounded font-bold ${activeTab === 'DASHBOARD' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Ops Dashboard</button>
                <button onClick={() => setActiveTab('TRANSFERS')} className={`px-3 py-1 text-xs rounded font-bold ${activeTab === 'TRANSFERS' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Transfers {externalTransfers.length > 0 && `(${externalTransfers.length})`}</button>
                <button onClick={() => setActiveTab('STAFF')} className={`px-3 py-1 text-xs rounded font-bold ${activeTab === 'STAFF' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Staff Mgmt</button>
            </div>
            <Button variant="danger" onClick={() => setShowBroadcastModal(true)} className="text-xs shadow-md animate-pulse">📢 Broadcast Alert</Button>
            <Button variant="secondary" onClick={() => setCurrentDirector(null)} className="text-xs">Logout</Button>
         </div>
      </div>

      {/* CONTENT TABS */}
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
      ) : activeTab === 'TRANSFERS' ? (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Cross-Border Patient Transfers</h3>
                    <p className="text-sm text-slate-500">Review requests from other network nodes.</p>
                  </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {externalTransfers.length === 0 ? <div className="p-12 text-center text-slate-400 bg-slate-50 rounded border border-dashed col-span-2">No pending external transfers.</div> : 
                  externalTransfers.map(tf => (
                      <div key={tf.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden">
                          <div className={`absolute top-0 left-0 w-1 h-full ${tf.urgency === 'IMMEDIATE' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                          <div className="flex justify-between items-start pl-2">
                              <div>
                                  <div className="font-bold text-slate-900 text-lg">{tf.patientName}</div>
                                  <div className="text-xs text-slate-500 font-mono">ID: {tf.patientId}</div>
                              </div>
                              <Badge color={tf.urgency === 'IMMEDIATE' ? 'red' : 'green'}>{tf.urgency}</Badge>
                          </div>
                          
                          <div className="bg-slate-50 p-3 rounded text-sm text-slate-700 pl-2 border border-slate-100">
                             <span className="font-bold text-xs text-slate-400 uppercase block mb-1">Reason for Transfer</span>
                             "{tf.reason}"
                          </div>

                          <div className="flex justify-between items-center text-xs text-slate-500 pl-2">
                             <span>Origin: <span className="font-bold text-slate-700">{tf.currentHospitalId}</span></span>
                             {tf.suggestedTargetHospitalId && <span>Suggested: <span className="font-bold text-blue-600">{tf.suggestedTargetHospitalId}</span></span>}
                          </div>

                          <div className="flex gap-2 mt-2 pl-2">
                              <Button onClick={() => handleAcceptTransfer(tf.id)} className="flex-1 bg-blue-600 hover:bg-blue-700">Accept</Button>
                              <Button variant="secondary" onClick={() => handleRejectTransfer(tf.id)} className="flex-1">Reject</Button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      ) : activeTab === 'STAFF' ? (
          <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-900">Hospital Personnel</h3>
                  <Button onClick={() => setShowAddStaffModal(true)} className="text-xs">+ Recruit Staff</Button>
              </div>
              <Card className="overflow-hidden p-0">
                  <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                          <tr>
                              <th className="px-6 py-3">Name</th>
                              <th className="px-6 py-3">Role</th>
                              <th className="px-6 py-3">Contact</th>
                              <th className="px-6 py-3">Status</th>
                              <th className="px-6 py-3">Last Check-in</th>
                          </tr>
                      </thead>
                      <tbody>
                          {myStaff.map(member => (
                              <tr key={member.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                                  <td className="px-6 py-4 font-bold text-slate-900">{member.name}</td>
                                  <td className="px-6 py-4">
                                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs uppercase font-bold">{member.role}</span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-500">{member.phone}</td>
                                  <td className="px-6 py-4">
                                      <Badge color={member.status === 'AVAILABLE' ? 'green' : member.status === 'BUSY' ? 'orange' : 'gray'}>
                                          {member.status}
                                      </Badge>
                                  </td>
                                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                                      {new Date(member.lastCheckIn).toLocaleString()}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </Card>
          </div>
      ) : (
        <>
          {/* OPS DASHBOARD */}
          <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
            {/* MAP CARD */}
            <div className="lg:col-span-2 h-[450px] bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px]"></div>
              <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur p-2 rounded border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Live Mesh Topology
                  </h3>
              </div>
              
              <div className="absolute inset-0 z-10">
                  <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
                          <XAxis type="number" dataKey="x" domain={[minX, maxX]} hide />
                          <YAxis type="number" dataKey="y" domain={[minY, maxY]} hide />
                          <ZAxis type="number" range={[100, 400]} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={() => null} />
                          {/* Mesh Links */}
                          {mapData.map((node, i) => (
                              i < mapData.length - 1 && (
                                <ReferenceLine 
                                    key={i} 
                                    segment={[{ x: node.x, y: node.y }, { x: mapData[i+1].x, y: mapData[i+1].y }]} 
                                    stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth={1}
                                />
                              )
                          ))}
                          <Scatter name="Hospitals" data={mapData} onClick={(node: any) => { if (node.payload) setSelectedHospital(node.payload); }} shape={<CustomMapNode />}>
                              {mapData.map((entry, index) => ( <Cell key={`cell-${index}`} /> ))}
                          </Scatter>
                      </ScatterChart>
                  </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-1 flex flex-col gap-4">
               {/* NETWORK FEED */}
               <Card title="Network Feed" className="flex-1 flex flex-col overflow-hidden">
                  <div className="overflow-y-auto custom-scrollbar pr-2 flex-1 space-y-3 max-h-[400px]">
                      {networkFeed.map(order => (
                          <div key={order.id} className={`p-3 rounded border text-xs ${order.hospitalId === currentDirector.hospitalId ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex justify-between font-bold text-slate-700 mb-1">
                                  <span>{new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  <span className={order.status === 'APPROVED' ? 'text-green-600' : order.status === 'FULFILLED_EXTERNAL' ? 'text-purple-600' : 'text-orange-600'}>
                                      {order.status === 'FULFILLED_EXTERNAL' ? 'NGO FULFILLED' : order.status}
                                  </span>
                              </div>
                              <div className="font-bold text-slate-900 mb-1">{order.itemName}</div>
                              <div className="flex justify-between text-slate-500">
                                  <span>Req: {order.requesterName || order.requester}</span>
                                  <span>{order.hospitalId} {order.targetHospitalId === 'BROADCAST' ? '📡' : '→'} {order.targetHospitalId}</span>
                              </div>
                          </div>
                      ))}
                  </div>
               </Card>
            </div>
          </div>

          {/* RESOURCE MATRIX & REQUESTS */}
          <div className="grid lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2">
                 <Card title="Regional Inventory Matrix" className="h-full">
                     <div className="overflow-x-auto">
                         <table className="w-full text-xs text-left border-collapse">
                             <thead>
                                 <tr>
                                     <th className="p-2 border-b border-slate-200 font-bold text-slate-500">Node</th>
                                     {keyResources.map(res => <th key={res} className="p-2 border-b border-slate-200 font-bold text-slate-500 text-center">{res}</th>)}
                                 </tr>
                             </thead>
                             <tbody>
                                 {hospitalIds.map(hid => (
                                     <tr key={hid} className={hid === currentDirector.hospitalId ? "bg-blue-50/30" : ""}>
                                         <td className="p-2 border-b border-slate-100 font-bold font-mono text-slate-700">{hid}</td>
                                         {keyResources.map(res => {
                                             const stocks = meshState.supplies.filter(s => s.hospitalId === hid && s.item.includes(res));
                                             const total = stocks.reduce((sum, s) => sum + s.quantity, 0);
                                             const thresh = stocks[0]?.criticalThreshold || 50;
                                             return (
                                                 <td key={res} className="p-1 border-b border-slate-100 text-center">
                                                     <div className={`w-full h-8 rounded-sm flex items-center justify-center font-bold shadow-sm text-[10px] ${getStockLevelColor(total, thresh)}`}>
                                                         {total}
                                                     </div>
                                                 </td>
                                             )
                                         })}
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                 </Card>
             </div>
             
             <div className="lg:col-span-1">
                 <Card title="Incoming Requests" className="bg-white h-full">
                     <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {incomingOrders.map(req => {
                            const isBroadcast = req.targetHospitalId === 'BROADCAST';
                            return (
                                <div key={req.id} className={`p-3 rounded border flex flex-col gap-2 ${isBroadcast ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex justify-between">
                                        <span className="font-bold text-sm text-slate-800">{req.itemName}</span>
                                        <Badge color={req.severity === 'critical' ? 'red' : 'blue'}>{req.quantity}</Badge>
                                    </div>
                                    
                                    <div className="text-xs text-slate-500 flex justify-between">
                                        <span>From: {req.hospitalId}</span>
                                        {isBroadcast && <span className="font-bold text-purple-600">📡 Broadcast</span>}
                                    </div>

                                    <div className="flex gap-2 mt-1">
                                        <Button className="text-[10px] py-1 flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleUpdateOrder(req.id, 'APPROVED')}>
                                            Approve (Local)
                                        </Button>
                                        
                                        {!isBroadcast ? (
                                            <Button variant="secondary" className="text-[10px] py-1 flex-1" onClick={() => handleBroadcastOrder(req.id)}>
                                                📡 Broadcast
                                            </Button>
                                        ) : (
                                            <Button className="text-[10px] py-1 flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => handleUpdateOrder(req.id, 'FULFILLED_EXTERNAL', 'Global Aid NGO')}>
                                                Delegate NGO
                                            </Button>
                                        )}
                                        
                                        <Button variant="secondary" className="text-[10px] py-1 px-2" onClick={() => handleUpdateOrder(req.id, 'PENDING')}>✕</Button>
                                    </div>
                                </div>
                            );
                        })}
                        {incomingOrders.length === 0 && <div className="text-center text-slate-400 text-xs py-4">No pending requests.</div>}
                     </div>
                 </Card>
             </div>
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

      {/* BROADCAST MODAL */}
      {showBroadcastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white border-2 border-red-500 rounded-xl p-6 w-full max-w-md shadow-2xl">
                  <h3 className="text-xl font-bold text-red-600 mb-1 uppercase tracking-wider flex items-center gap-2">
                      ⚠️ Broadcast Emergency
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">This message will be sent to all network nodes immediately.</p>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Alert Message</label>
                          <textarea 
                             className="w-full border border-slate-300 rounded p-3 text-sm outline-none focus:border-red-500 min-h-[100px]"
                             placeholder="e.g. MASS CASUALTY EVENT AT H100. DIVERT ALL TRAFFIC."
                             value={alertMessage}
                             onChange={e => setAlertMessage(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Severity Level</label>
                          <div className="flex gap-2">
                              <button onClick={() => setAlertSeverity('info')} className={`flex-1 py-2 text-xs border rounded font-bold ${alertSeverity === 'info' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-white border-slate-200'}`}>INFO</button>
                              <button onClick={() => setAlertSeverity('warning')} className={`flex-1 py-2 text-xs border rounded font-bold ${alertSeverity === 'warning' ? 'bg-orange-100 border-orange-500 text-orange-800' : 'bg-white border-slate-200'}`}>WARNING</button>
                              <button onClick={() => setAlertSeverity('critical')} className={`flex-1 py-2 text-xs border rounded font-bold ${alertSeverity === 'critical' ? 'bg-red-100 border-red-500 text-red-800' : 'bg-white border-slate-200'}`}>CRITICAL</button>
                          </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                          <Button variant="secondary" onClick={() => setShowBroadcastModal(false)} className="flex-1">Cancel</Button>
                          <Button variant="danger" onClick={handleSendBroadcast} className="flex-1">SEND ALERT</Button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* STAFF MODAL */}
      {showAddStaffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-md shadow-2xl">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Recruit New Personnel</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs text-slate-500 mb-1 font-bold">Full Name</label>
                          <input className="w-full border border-slate-300 rounded p-2 text-sm" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} placeholder="Dr. Name Surname" />
                      </div>
                      <div>
                          <label className="block text-xs text-slate-500 mb-1 font-bold">Role</label>
                          <select className="w-full border border-slate-300 rounded p-2 text-sm bg-white" value={newStaffRole} onChange={e => setNewStaffRole(e.target.value as any)}>
                              <option value="doctor">Doctor</option>
                              <option value="nurse">Nurse</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs text-slate-500 mb-1 font-bold">Phone Contact</label>
                          <input className="w-full border border-slate-300 rounded p-2 text-sm" value={newStaffPhone} onChange={e => setNewStaffPhone(e.target.value)} placeholder="+100..." />
                      </div>
                      <div className="flex gap-3 mt-6">
                          <Button variant="secondary" onClick={() => setShowAddStaffModal(false)} className="flex-1">Cancel</Button>
                          <Button onClick={handleAddStaff} className="flex-1 bg-green-600 hover:bg-green-700">Recruit</Button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
