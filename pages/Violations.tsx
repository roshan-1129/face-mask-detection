import React, { useEffect, useState } from 'react';
import { AlertTriangle, Calendar, MapPin, Search, Filter, Check, X } from 'lucide-react';
import { getViolations } from '../services/mockBackend';
import { Violation } from '../types';

const Violations: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'REVIEWED'>('ALL');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  useEffect(() => {
    getViolations().then(data => {
      setViolations(data);
      setLoading(false);
    });
  }, []);

  // Filter Logic
  const filteredViolations = violations.filter(v => {
    const matchesSearch = v.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || v.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 min-h-full" onClick={() => setIsFilterMenuOpen(false)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Violation Log</h1>
          <p className="text-gray-400">Review security incidents and non-compliance records.</p>
        </div>
        
        <div className="flex gap-3 relative">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search ID or Location..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white pl-10 pr-4 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none w-64"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsFilterMenuOpen(!isFilterMenuOpen);
              }}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${isFilterMenuOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
            >
              <Filter size={18} />
              {filterStatus === 'ALL' ? 'Filter' : filterStatus}
            </button>

            {/* Filter Dropdown */}
            {isFilterMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-2">
                  {['ALL', 'PENDING', 'REVIEWED'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status as any)}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm flex items-center justify-between ${filterStatus === status ? 'bg-blue-500/10 text-blue-400' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                      {filterStatus === status && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredViolations.length === 0 ? (
        <div className="text-center py-20 text-gray-500 border border-dashed border-gray-800 rounded-2xl">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} />
          </div>
          <p className="text-lg font-medium text-gray-400">No violations found</p>
          <p className="text-sm">Try adjusting your search or filter criteria.</p>
          {(searchQuery || filterStatus !== 'ALL') && (
            <button 
              onClick={() => {setSearchQuery(''); setFilterStatus('ALL');}}
              className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredViolations.map((v) => (
            <div key={v.id} className="group bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 flex flex-col">
              <div className="aspect-video bg-gray-900 relative overflow-hidden">
                <img 
                  src={v.imageUrl} 
                  alt="Violation Capture" 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                  {(v.confidence * 100).toFixed(0)}% CONFIDENCE
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-white">#{v.id}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs border ${
                    v.status === 'PENDING' 
                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' 
                      : 'bg-green-500/10 text-green-500 border-green-500/20'
                  }`}>
                    {v.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-400 mb-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-500" />
                    <span>{new Date(v.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-500" />
                    <span>{v.location}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700 flex gap-2">
                   <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-xs font-medium transition-colors">
                     Details
                   </button>
                   {v.status === 'PENDING' && (
                     <button className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2 rounded-lg text-xs font-medium transition-colors">
                       Action
                     </button>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Violations;