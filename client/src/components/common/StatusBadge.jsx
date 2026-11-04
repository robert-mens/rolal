import React from 'react';
import MaterialIcon from '../MaterialIcon';

/**
 * Reusable Status Badge
 * Clearly distinguishes Completed, Pending, In-Play, Failed, Won, Lost, and Suspended states.
 */
export default function StatusBadge({ status, className = '' }) {
  const norm = String(status || '').toUpperCase();

  if (norm === 'COMPLETED' || norm === 'SUCCESS' || norm === 'WON') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30 uppercase ${className}`}>
        <MaterialIcon name="check_circle" size={11} className="text-[#00E676]" />
        <span>{norm === 'WON' ? 'Won' : 'Completed'}</span>
      </span>
    );
  }

  if (norm === 'PENDING' || norm === 'PROCESSING' || norm === 'IN_PLAY' || norm === 'IN PLAY') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase ${className}`}>
        <MaterialIcon name="schedule" size={11} className="text-amber-400" />
        <span>{norm === 'IN PLAY' || norm === 'IN_PLAY' ? 'In Play' : 'Pending'}</span>
      </span>
    );
  }

  if (norm === 'FAILED' || norm === 'REJECTED' || norm === 'LOST') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30 uppercase ${className}`}>
        <MaterialIcon name="cancel" size={11} className="text-red-400" />
        <span>{norm === 'LOST' ? 'Lost' : 'Failed'}</span>
      </span>
    );
  }

  if (norm === 'SUSPENDED' || norm === 'LOCKED') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase ${className}`}>
        <MaterialIcon name="lock" size={10} />
        <span>Suspended</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-[#182235] border border-[#25344D] ${className}`}>
      <span>{status || 'Unknown'}</span>
    </span>
  );
}
