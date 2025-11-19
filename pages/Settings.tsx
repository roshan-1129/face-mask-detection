import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, Server, Save } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
        <SettingsIcon className="text-gray-400" /> System Settings
      </h1>

      <div className="space-y-6">
        {/* Alert Settings */}
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell size={18} className="text-blue-400" /> Notification Preferences
          </h2>
          <div className="space-y-4">
            {['Enable Voice Alerts', 'Send Email to Security', 'Log to Cloud Database', 'Desktop Notifications'].map((label, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-gray-300">{label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={i < 3} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Model Settings */}
        <div className="glass-panel p-6 rounded-2xl">
           <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Server size={18} className="text-purple-400" /> AI Model Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label className="block text-sm font-medium text-gray-400 mb-2">Detection Engine</label>
               <select disabled className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none opacity-90 cursor-pointer">
                 <option>Sentinel-Local-V1 (Active)</option>
                 <option>Gemini Cloud (Disabled)</option>
               </select>
               <p className="text-xs text-green-500 mt-1">Running locally. No API quota limits.</p>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-400 mb-2">Confidence Threshold</label>
               <input type="range" min="50" max="95" defaultValue="70" className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
               <div className="flex justify-between text-xs text-gray-500 mt-1">
                 <span>Sensitive (50%)</span>
                 <span>Strict (95%)</span>
               </div>
             </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button className="px-6 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">Cancel</button>
          <button className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
            <Save size={18} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
