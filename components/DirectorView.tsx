import React, { useState, useEffect } from 'react';
import { MeshState, StaffStatus, SupplyRequest } from '../types';
import { Card, Button, Badge } from './ui_components';
import { getStrategicSituationReport } from '../services/geminiService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DirectorViewProps {
  meshState: MeshState;
}

export const DirectorView: React.FC<DirectorViewProps> = ({ meshState }) => {
  const [aiReport, setAiReport] = useState<{summary: string, recommendations: string[]} | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const generateReport = async () => {
    setLoading(true);
    const report = await getStrategicSituationReport(meshState.patients, meshState.supplies);
    setAiReport(report);
    setLoading(false);
  };

  // Chart Data Preparation
  const supplyData = meshState.supplies
    .filter(s => filterCategory === 'ALL' || s.category === filterCategory)
    .map(s => ({
      name: s.item.split('(')[0],
      quantity: s.quantity,
      critical: s.criticalThreshold
    }));

  const criticalPatients = meshState.patients.filter(p => p.status === 'CRITICAL').length;
  const stablePatients = meshState.patients.filter(p => p.status === 'STABLE').length;
  
  const patientStatusData = [
    { name: 'Critical', value: criticalPatients },
    { name: 'Stable', value: stablePatients },
  ];
  const PIE_COLORS = ['#ef4444', '#22c55e'];

  // Staff Helpers
  const getStatusColor = (status: StaffStatus) => {
    switch(status) {
      case StaffStatus.AVAILABLE: return 'bg-green-500';
      case StaffStatus.BUSY: return 'bg-yellow-500';
      case StaffStatus.UNREACHABLE: return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
           <h2 className="text-2xl font-bold text-white">Crisis Command Center</h2>
           <p className="text-slate-400 text-sm">Mesh Connected Peers: <span className="text-green-400 font-mono">{meshState.connectedPeers}</span></p>
        </div>
        <Button onClick={generateReport} disabled={loading} variant="primary">
           {loading ? 'Generating...' : 'Refresh AI Situation Report'}
        </Button>
      </div>

      {/* TOP ROW: AI & Staff */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Staff Status Board */}
        <div className="lg:col-span-1">
          <Card title="Personnel Status">
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {meshState.staff.map(member => (
                <div key={member.id} className="flex items-center justify-between bg-slate-900 p-3 rounded border border-slate-800">
                   <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(member.status)} shadow-[0_0_8px_rgba(0,0,0,0.5)]`}></div>
                      <div>
                        <div className="font-medium text-sm text-slate-200">{member.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{member.role} • {member.location}</div>
                      </div>
                   </div>
                   <span className="text-xs font-mono text-slate-400">{member.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* AI Report Section */}
        <div className="lg:col-span-2">
          {aiReport ? (
             <div className="grid md:grid-cols-2 gap-6 h-full">
               <Card className="border-medical-500/50 bg-slate-800/80 h-full" title="Strategic Overview">
                 <p className="text-slate-300 leading-relaxed">{aiReport.summary}</p>
               </Card>
               <Card title="Tactical Actions" className="border-medical-500/50 bg-slate-800/80 h-full">
                 <ul className="space-y-2">
                   {aiReport.recommendations.map((rec, idx) => (
                     <li key={idx} className="flex gap-2 items-start text-sm text-slate-300">
                       <span className="text-medical-400 mt-1">➜</span>
                       {rec}
                     </li>
                   ))}
                 </ul>
               </Card>
             </div>
          ) : (
            <Card className="h-full flex items-center justify-center text-slate-500 border-dashed">
               <p>Generate AI Report to see strategic insights.</p>
            </Card>
          )}
        </div>
      </div>

      {/* MIDDLE ROW: Analytics */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Detailed Supply Levels">
          <div className="flex justify-end mb-2">
             <select 
               className="bg-slate-900 text-xs border border-slate-700 rounded px-2 py-1 text-slate-300"
               value={filterCategory}
               onChange={(e) => setFilterCategory(e.target.value)}
             >
               <option value="ALL">All Categories</option>
               <option value="MEDICINE">Medicine</option>
               <option value="TOOLS">Tools</option>
               <option value="WATER">Water</option>
               <option value="FOOD">Food</option>
             </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }}
                  cursor={{fill: '#334155'}}
                />
                <Bar dataKey="quantity" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="critical" fill="#ef4444" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Patient Triage Overview">
          <div className="h-64 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={patientStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {patientStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* BOTTOM ROW: Supply Requests & Map */}
      <div className="grid md:grid-cols-2 gap-6">
         <Card title="Pending Supply Requests">
           {meshState.supplyRequests.length === 0 ? (
             <p className="text-slate-500 text-sm italic">No pending requests.</p>
           ) : (
             <div className="space-y-2 max-h-[200px] overflow-y-auto">
               {meshState.supplyRequests.map(req => (
                 <div key={req.id} className="flex justify-between items-center bg-slate-900 p-3 rounded border-l-4 border-yellow-500">
                    <div>
                      <div className="font-bold text-slate-200">{req.itemName}</div>
                      <div className="text-xs text-slate-500">Req by: {req.requester}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-lg font-mono font-bold text-white">{req.quantity}</div>
                       <div className="text-[10px] bg-yellow-900/30 text-yellow-500 px-1 rounded">{req.status}</div>
                    </div>
                 </div>
               ))}
             </div>
           )}
         </Card>

         <Card title="Regional Heatmap (Simulated)">
            <div className="h-48 bg-slate-900 rounded border border-slate-700 relative overflow-hidden">
               <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_40%,rgba(239,68,68,0.6)_0%,transparent_40%),radial-gradient(circle_at_70%_60%,rgba(239,68,68,0.4)_0%,transparent_30%)]"></div>
               <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-1 p-2">
                  {Array.from({length: 72}).map((_, i) => (
                    <div key={i} className={`rounded-sm ${Math.random() > 0.9 ? 'bg-red-500/20 animate-pulse' : 'bg-slate-800/50'}`}></div>
                  ))}
               </div>
            </div>
         </Card>
      </div>
    </div>
  );
};