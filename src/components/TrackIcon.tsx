import React from 'react';
import {
  Code,
  Terminal,
  Database,
  Cpu,
  Layers,
  MessageSquare,
  FileText,
  Mic,
  Briefcase,
  Brain,
  Users,
  Box,
} from 'lucide-react';

interface TrackIconProps {
  type: string;
  className?: string;
}

export const TrackIcon: React.FC<TrackIconProps> = ({ type, className = 'w-6 h-6' }) => {
  switch (type) {
    case 'js':
      return (
        <div className={`flex items-center justify-center font-bold text-xs bg-yellow-400 text-black rounded-md ${className}`}>
          JS
        </div>
      );
    case 'python':
      return (
        <div className={`flex items-center justify-center font-bold text-xs bg-blue-600 text-yellow-300 rounded-md ${className}`}>
          Py
        </div>
      );
    case 'node':
      return (
        <div className={`flex items-center justify-center font-bold text-xs bg-emerald-600 text-white rounded-md ${className}`}>
          <Terminal className="w-4 h-4" />
        </div>
      );
    case 'typescript':
      return (
        <div className={`flex items-center justify-center font-bold text-xs bg-blue-600 text-white rounded-md ${className}`}>
          TS
        </div>
      );
    case 'go':
      return (
        <div className={`flex items-center justify-center font-bold text-xs bg-cyan-600 text-white rounded-md ${className}`}>
          Go
        </div>
      );
    case 'sql':
      return (
        <div className={`flex items-center justify-center font-bold text-xs bg-amber-600 text-white rounded-md ${className}`}>
          <Database className="w-4 h-4" />
        </div>
      );
    case 'behavioral':
      return (
        <div className={`flex items-center justify-center bg-purple-600 text-white rounded-md ${className}`}>
          <Briefcase className="w-4 h-4" />
        </div>
      );
    case 'resume':
      return (
        <div className={`flex items-center justify-center bg-rose-600 text-white rounded-md ${className}`}>
          <FileText className="w-4 h-4" />
        </div>
      );
    case 'communication':
      return (
        <div className={`flex items-center justify-center bg-teal-600 text-white rounded-md ${className}`}>
          <Mic className="w-4 h-4" />
        </div>
      );
    case 'product':
      return (
        <div className={`flex items-center justify-center bg-indigo-600 text-white rounded-md ${className}`}>
          <Layers className="w-4 h-4" />
        </div>
      );
    case 'aptitude':
      return (
        <div className={`flex items-center justify-center bg-orange-600 text-white rounded-md ${className}`}>
          <Brain className="w-4 h-4" />
        </div>
      );
    case 'discussion':
      return (
        <div className={`flex items-center justify-center bg-violet-600 text-white rounded-md ${className}`}>
          <Users className="w-4 h-4" />
        </div>
      );
    default:
      return (
        <div className={`flex items-center justify-center bg-zinc-600 text-white rounded-md ${className}`}>
          <Code className="w-4 h-4" />
        </div>
      );
  }
};
