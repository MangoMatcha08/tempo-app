
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Settings, Calendar } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="bg-slate-900 text-white w-64 min-h-screen p-4">
      <div className="flex items-center justify-center mb-8">
        <h1 className="text-2xl font-bold">Tempo</h1>
      </div>
      <nav className="space-y-2">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => 
            `flex items-center p-2 rounded-md transition-colors ${
              isActive ? 'bg-slate-800 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
            }`
          }
          end
        >
          <Home className="mr-3 h-5 w-5" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink 
          to="/dashboard/schedule" 
          className={({ isActive }) => 
            `flex items-center p-2 rounded-md transition-colors ${
              isActive ? 'bg-slate-800 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <Calendar className="mr-3 h-5 w-5" />
          <span>Schedule</span>
        </NavLink>
        <NavLink 
          to="/dashboard/settings" 
          className={({ isActive }) => 
            `flex items-center p-2 rounded-md transition-colors ${
              isActive ? 'bg-slate-800 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <Settings className="mr-3 h-5 w-5" />
          <span>Settings</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
