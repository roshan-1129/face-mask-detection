import React from 'react';
import { Bell, Search, User as UserIcon, Menu, Eye, Radio } from 'lucide-react';
import { User, DetectionStatus } from '../types';

interface HeaderProps {
  user: User | null;
  toggleSidebar: () => void;
  detectionStatus?: DetectionStatus;
}

const Header: React.FC<HeaderProps> = ({ user, toggleSidebar, detectionStatus }) => {
  const isAlert = detectionStatus === DetectionStatus.NO_MASK;
  const isScanning = detectionStatus === DetectionStatus.SCANNING || detectionStatus === DetectionStatus.MASK_DETECTED;

  return (
    <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-700 rounded-lg lg:hidden text-gray-400 hover:text-white"
        >
          <Menu size={20} />
        </button>
        <div className="hidden md:flex items-center relative">
          <Search className="absolute left-3 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search logs..." 
            className="bg-gray-900 text-sm text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 w-64 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Status Indicator */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors
          ${isAlert ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-gray-700/50 border-gray-600 text-gray-400'}
        `}>
           {isScanning ? (
             <>
               <span className={`w-2 h-2 rounded-full ${isAlert ? 'bg-red-500 animate-ping' : 'bg-green-500 animate-pulse'}`}></span>
               {isAlert ? 'VIOLATION DETECTED' : 'MONITORING ACTIVE'}
             </>
           ) : (
             <>
               <span className="w-2 h-2 rounded-full bg-gray-500"></span>
               STANDBY
             </>
           )}
        </div>

        <button className="relative p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
          <Bell size={20} />
          {isAlert && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-white">{user?.name || 'Guest'}</p>
            <p className="text-xs text-gray-400">{user?.role || 'Viewer'}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden border-2 border-gray-700">
            {user?.avatar ? (
              <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={18} className="text-white" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;