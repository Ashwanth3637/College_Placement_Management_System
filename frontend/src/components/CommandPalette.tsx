import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  onLogout?: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Portals' | 'Help';
  icon: string;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, userRole = '', onLogout }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const role = userRole.toLowerCase().trim();

  // Define commands based on role & system navigation
  const allCommands: CommandItem[] = [
    // Navigation for Students
    ...(role === 'student' ? [
      { id: 'st-dash', title: 'Student Dashboard Overview', category: 'Navigation' as const, icon: '📊', action: () => navigate('/student/dashboard') },
      { id: 'st-jobs', title: 'Browse Campus Placement Drives & Jobs', category: 'Navigation' as const, icon: '💼', action: () => navigate('/student/campus-drives') },
      { id: 'st-apps', title: 'My Application Tracker & Timeline', category: 'Navigation' as const, icon: '📄', action: () => navigate('/student/applications') },
      { id: 'st-invs', title: 'Interview Schedule & Calendar', category: 'Navigation' as const, icon: '🗓️', action: () => navigate('/student/interviews') },
      { id: 'st-prof', title: 'Complete Student Profile & Resume', category: 'Navigation' as const, icon: '👤', action: () => navigate('/student/profile') },
      { id: 'st-res', title: 'Offer Letters & Selection Results', category: 'Navigation' as const, icon: '🏆', action: () => navigate('/student/results') },
    ] : []),

    // Navigation for Placement Officers / Admins
    ...(['officer', 'admin', 'tpo'].includes(role) ? [
      { id: 'off-dash', title: 'Executive Placement Dashboard', category: 'Navigation' as const, icon: '📈', action: () => navigate('/officer/dashboard') },
      { id: 'off-drives', title: 'Manage Placement Drives & 5-Step Wizard', category: 'Navigation' as const, icon: '🚀', action: () => navigate('/officer/drives') },
      { id: 'off-crm', title: 'Company Relationship Management (CRM)', category: 'Navigation' as const, icon: '🏢', action: () => navigate('/officer/companies') },
      { id: 'off-triage', title: 'Candidate Shortlisting & Application Triage', category: 'Navigation' as const, icon: '👥', action: () => navigate('/officer/applications') },
      { id: 'off-inv', title: 'Interview Scheduling Board & Slots', category: 'Navigation' as const, icon: '🗓️', action: () => navigate('/officer/interviews') },
      { id: 'off-verify', title: 'Student Academic Verification & Profiles', category: 'Navigation' as const, icon: '🛡️', action: () => navigate('/officer/students') },
      { id: 'off-sel', title: 'Offer Releases & Selections Manager', category: 'Navigation' as const, icon: '🎯', action: () => navigate('/officer/selections') },
      { id: 'off-rep', title: 'Accreditation Reports & Analytics Export', category: 'Navigation' as const, icon: '📊', action: () => navigate('/officer/reports') },
    ] : []),

    // Navigation for Recruiters
    ...(role === 'recruiter' ? [
      { id: 'rec-dash', title: 'Recruiter Dashboard Overview', category: 'Navigation' as const, icon: '💼', action: () => navigate('/recruiter/dashboard') },
      { id: 'rec-drives', title: 'Job Postings & Active Campus Drives', category: 'Navigation' as const, icon: '📝', action: () => navigate('/recruiter/placement-drives') },
      { id: 'rec-cands', title: 'Candidate Matching Pool & Resumes', category: 'Navigation' as const, icon: '👥', action: () => navigate('/recruiter/candidates') },
      { id: 'rec-apps', title: 'Submitted Applications Review', category: 'Navigation' as const, icon: '📑', action: () => navigate('/recruiter/applications') },
      { id: 'rec-inv', title: 'Interview Rounds & Candidate Scores', category: 'Navigation' as const, icon: '🎙️', action: () => navigate('/recruiter/interviews') },
    ] : []),

    // Navigation for Coordinators
    ...(role === 'coordinator' ? [
      { id: 'coord-dash', title: 'Coordinator Operations Hub', category: 'Navigation' as const, icon: '🏫', action: () => navigate('/coordinator/dashboard') },
      { id: 'coord-verify', title: 'Student Verification & Eligibility Check', category: 'Navigation' as const, icon: '✅', action: () => navigate('/coordinator/students') },
      { id: 'coord-att', title: 'Event & Drive Attendance Marking', category: 'Navigation' as const, icon: '📋', action: () => navigate('/coordinator/attendance') },
      { id: 'coord-ann', title: 'Broadcast Targeted Announcements', category: 'Navigation' as const, icon: '📢', action: () => navigate('/coordinator/announcements') },
    ] : []),

    // Global Actions
    { id: 'act-refresh', title: 'Refresh System Data & Sync Cache', category: 'Actions' as const, icon: '🔄', shortcut: '⌘R', action: () => window.location.reload() },
    ...(onLogout ? [
      { id: 'act-logout', title: 'Secure Sign Out from Portal', category: 'Actions' as const, icon: '🚪', action: onLogout }
    ] : [])
  ];

  const filteredCommands = allCommands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (filteredCommands.length || 1)) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '75vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #E2E8F0', gap: '12px' }}>
          <span style={{ fontSize: '18px', color: '#64748B' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search portal pages, drives, quick actions... (↑↓ to navigate, ↵ to select)"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              fontWeight: 500,
              color: '#0F172A',
              backgroundColor: 'transparent',
              fontFamily: 'Inter, sans-serif'
            }}
          />
          <kbd style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 6px',
            backgroundColor: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: '4px',
            color: '#64748B'
          }}>ESC</kbd>
        </div>

        {/* Results List */}
        <div style={{ overflowY: 'auto', padding: '8px' }}>
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔎</div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#475569' }}>No results found for "{query}"</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Try searching for 'drives', 'applications', 'students', or 'interviews'.</div>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => { cmd.action(); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#E6EEFC' : 'transparent',
                    borderLeft: isSelected ? '3px solid #1E5FCC' : '3px solid transparent',
                    transition: 'background-color 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px' }}>{cmd.icon}</span>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: isSelected ? 600 : 500, color: isSelected ? '#0B3D91' : '#1E293B' }}>
                        {cmd.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {cmd.category}
                      </div>
                    </div>
                  </div>
                  {cmd.shortcut && (
                    <kbd style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: '4px',
                      color: '#64748B',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}>{cmd.shortcut}</kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: '10px 16px',
          backgroundColor: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11.5px',
          color: '#64748B'
        }}>
          <span>Press <strong style={{ color: '#334155' }}>↵</strong> to select, <strong style={{ color: '#334155' }}>↑↓</strong> to navigate</span>
          <span>Enterprise Placement Portal</span>
        </div>
      </div>
    </div>
  );
};
