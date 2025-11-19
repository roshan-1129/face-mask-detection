import React, { useEffect, useState } from 'react';
import { Users, ShieldAlert, UserCheck, Activity, Clock, AlertTriangle, Megaphone } from 'lucide-react';
import { getDailyStats } from '../services/mockBackend';
import { DailyStats } from '../types';

const StatCard: React.FC<{ title: string; value: string | number; subtext: string; icon: React.ElementType; color: string }> = ({ 
  title, value, subtext, icon: Icon, color 
}) => (
  <div className="glass-panel p-6 rounded-2xl border-t border-gray-700 hover:border-gray-600 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
    </div>
    <p className="text-sm text-gray-500">{subtext}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DailyStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await getDailyStats();
      setStats(data);
    };
    fetchStats();
    // Refresh every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div className="p-8 text-center text-gray-500">Loading dashboard analytics...</div>;

  const maxTraffic = Math.max(...stats.hourlyTraffic.map(t => t.count));
  const peakTime = stats.hourlyTraffic.find(t => t.count === maxTraffic);

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Security Overview</h1>
          <p className="text-gray-400">Real-time monitoring dashboard for {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          System Operational
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Entries" 
          value={stats.totalEntries} 
          subtext="+12% from yesterday" 
          icon={Users} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Mask Compliant" 
          value={stats.masksDetected} 
          subtext={`${stats.maskComplianceRate}% compliance rate`} 
          icon={UserCheck} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Violations Detected" 
          value={stats.violations} 
          subtext="Requires attention" 
          icon={ShieldAlert} 
          color="bg-red-500" 
        />
        <StatCard 
          title="Active Cameras" 
          value="4" 
          subtext="All systems nominal" 
          icon={Activity} 
          color="bg-purple-500" 
        />
      </div>

      {/* Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Peak Hours & Advisory Panel */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ShieldAlert size={18} className="text-orange-400" />
              Security Deployment Advisory
            </h3>
            <span className="text-xs font-mono text-gray-500 px-2 py-1 bg-gray-800 rounded border border-gray-700">
              AI PREDICTIVE ANALYSIS
            </span>
          </div>
          
          <div className="flex-1 flex flex-col space-y-6">
            {/* Main Recommendation Box */}
            {peakTime && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5 flex flex-col md:flex-row gap-5 items-start">
                <div className="p-3 bg-orange-500/20 rounded-full shrink-0 text-orange-400">
                  <Megaphone size={24} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-2">
                    Critical Alert: High Influx at {peakTime.hour}
                  </h4>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    Analysis of entry logs indicates maximum foot traffic density occurs between <span className="text-white font-semibold">{peakTime.hour} - {parseInt(peakTime.hour) + 1}:00</span> ({peakTime.count} entries detected). 
                    The risk of mask violations increases by 40% during this window.
                  </p>
                  <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-3">
                    <p className="text-orange-200 text-xs font-bold uppercase tracking-wide mb-1">
                      Action Required
                    </p>
                    <p className="text-orange-100 text-sm">
                      Deploy additional security personnel to Main Entrance 15 minutes prior to {peakTime.hour}. Ensure strict mask enforcement during this peak window.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Crowd Density Timeline */}
            <div>
               <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity size={14} />
                  Crowd Density Timeline & Risk Levels
               </h4>
               <div className="space-y-3">
                  {stats.hourlyTraffic.map((item, idx) => {
                     const intensity = (item.count / maxTraffic) * 100;
                     const isCritical = intensity > 80;
                     const isModerate = intensity > 50 && intensity <= 80;
                     
                     return (
                        <div key={idx} className="flex items-center gap-3 group">
                           <span className="text-xs font-mono text-gray-400 w-12">{item.hour}</span>
                           <div className="flex-1 h-10 bg-gray-800/50 rounded-lg relative overflow-hidden flex items-center px-3 border border-transparent group-hover:border-gray-700 transition-all">
                              {/* Background Bar */}
                              <div 
                                 className={`absolute top-0 left-0 bottom-0 opacity-10 transition-all duration-500 ${isCritical ? 'bg-red-500' : isModerate ? 'bg-yellow-500' : 'bg-blue-500'}`} 
                                 style={{ width: `${intensity}%` }}
                              ></div>
                              {/* Progress Line */}
                              <div 
                                 className={`absolute bottom-0 left-0 h-0.5 transition-all duration-500 ${isCritical ? 'bg-red-500' : isModerate ? 'bg-yellow-500' : 'bg-blue-500'}`} 
                                 style={{ width: `${intensity}%` }}
                              ></div>
                              
                              {/* Text Content */}
                              <span className="relative text-xs text-gray-300 z-10 flex justify-between w-full items-center">
                                 <span className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500 animate-pulse' : isModerate ? 'bg-yellow-500' : 'bg-blue-500'}`}></span>
                                    {item.count} Visitors
                                 </span>
                                 {isCritical && (
                                   <span className="flex items-center gap-1 text-red-400 font-bold tracking-wider text-[10px] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                     <AlertTriangle size={10} /> CRITICAL
                                   </span>
                                 )}
                                 {isModerate && <span className="text-yellow-400 font-bold tracking-wider text-[10px]">ELEVATED</span>}
                                 {!isCritical && !isModerate && <span className="text-blue-400 font-bold tracking-wider text-[10px]">NORMAL</span>}
                              </span>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
          </div>
        </div>

        {/* Side Activity Feed */}
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock size={18} className="text-purple-400" />
              Recent Alerts
            </h3>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex gap-4 items-start p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer border border-transparent hover:border-gray-700">
                <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-red-500' : 'bg-gray-600'}`}></div>
                <div>
                  <p className="text-sm text-gray-300 leading-snug">
                    {i === 0 ? 'Mask violation detected at Main Entrance' : 'Routine system check completed'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                     <Clock size={10} /> {i * 15 + 2} minutes ago
                  </p>
                </div>
              </div>
            ))}
            
            <div className="pt-4 mt-4 border-t border-gray-700">
               <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 rounded-lg transition-colors">
                  View Full Log
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;