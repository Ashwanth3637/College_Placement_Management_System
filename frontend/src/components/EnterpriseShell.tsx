import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';
import { API_BASE_URL } from '../config/api';
import { Menu, Building2, Search, Bell, ChevronDown, UserCheck, LogOut, Check } from 'lucide-react';

export interface NavItem {
 id: string;
 label: string;
 icon: string;
 path?: string;
 badge?: number | string;
 badgeVariant?: 'primary' | 'success' | 'warning' | 'danger';
}

interface EnterpriseShellProps {
 children: React.ReactNode;
 user: any;
 onLogout: () => void;
 navItems: NavItem[];
 activeTab: string;
 onTabChange: (tabId: string) => void;
 pageTitle: string;
 pageSubtitle?: string;
 pageActions?: React.ReactNode;
 breadcrumbs?: { label: string; path?: string }[];
}

export const EnterpriseShell: React.FC<EnterpriseShellProps> = ({
 children,
 user,
 onLogout,
 navItems,
 activeTab,
 onTabChange,
 pageTitle,
 pageSubtitle,
 pageActions,
 breadcrumbs = [],
}) => {
 const navigate = useNavigate();
 const location = useLocation();
 const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
  try {
   return localStorage.getItem('cpms_sidebar_collapsed') === 'true';
  } catch (e) {
   return false;
  }
 });
 const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
 const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
 const [showNotifications, setShowNotifications] = useState(false);
 const [showUserMenu, setShowUserMenu] = useState(false);
 const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
 const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

 const role = (user?.role || 'student').toLowerCase().trim();

 const toggleSidebar = () => {
  if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
    setMobileDrawerOpen(prev => !prev);
  } else {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try {
      localStorage.setItem('cpms_sidebar_collapsed', String(next));
    } catch (e) {}
  }
 };

 const handleRoleSwitch = (targetRole: string) => {
  setShowRoleSwitcher(false);
  // Switch demo role credentials
  if (targetRole === 'student') {
   const demoUser = { name: 'Ashwanth S', email: 'ashwanth@college.edu', role: 'student', department: 'Computer Science & Engineering' };
   localStorage.setItem('user', JSON.stringify(demoUser));
   navigate('/student/dashboard');
   window.location.reload();
  } else if (targetRole === 'officer') {
   const demoUser = { name: 'Placement Director', email: 'admin@college.edu', role: 'admin' };
   localStorage.setItem('user', JSON.stringify(demoUser));
   navigate('/officer/dashboard');
   window.location.reload();
  }
 };

 // Global ⌘K keyboard listener
 useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
   if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    setIsCommandPaletteOpen(prev => !prev);
   }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
 }, []);

 const [notifications, setNotifications] = useState<any[]>([]);

 const fetchNotifications = async () => {
  try {
   const email = (user?.email || '').toLowerCase().trim();
   const userId = user?.id || user?._id || '';
   const res = await fetch(`${API_BASE_URL}/api/notifications?email=${encodeURIComponent(email)}&userId=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}`);
   if (res.ok) {
    const data = await res.json();
    if (Array.isArray(data)) {
     setNotifications(data);
    }
   }
  } catch (err) {}
 };

 useEffect(() => {
  fetchNotifications();
  const interval = setInterval(fetchNotifications, 10000);
  window.addEventListener('cpms_new_notification', fetchNotifications);
  window.addEventListener('storage', fetchNotifications);
  return () => {
   clearInterval(interval);
   window.removeEventListener('cpms_new_notification', fetchNotifications);
   window.removeEventListener('storage', fetchNotifications);
  };
 }, [user?.email, role]);

 const handleMarkAllRead = async () => {
  try {
   await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user?.id || user?._id, email: user?.email })
   });
   setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  } catch (err) {}
 };

 const handleMarkSingleRead = async (id: string) => {
  try {
   await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, { method: 'PUT' });
   setNotifications(prev => prev.map(n => (n._id === id || n.id === id) ? { ...n, isRead: true } : n));
  } catch (err) {}
 };

 const unreadCount = notifications.filter(n => !n.isRead).length;

 return (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
   <CommandPalette
    isOpen={isCommandPaletteOpen}
    onClose={() => setIsCommandPaletteOpen(false)}
    userRole={role}
    onLogout={onLogout}
   />

   {/* 1. FIXED TOP HEADER (64px) */}
   <header
    className="enterprise-top-header"
    style={{
     position: 'fixed',
     top: 0,
     left: 0,
     right: 0,
     height: '64px',
     backgroundColor: '#0B3D91', // Institutional Deep Blue
     color: '#FFFFFF',
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'space-between',
     padding: '0 16px',
     zIndex: 1000,
     boxShadow: '0 2px 8px rgba(11, 61, 145, 0.25)',
     borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    }}
   >
    {/* Left: Brand & Sidebar Toggle */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
     <button
      onClick={toggleSidebar}
      title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      aria-label="Toggle Navigation Sidebar"
      style={{
       background: 'rgba(255, 255, 255, 0.12)',
       border: 'none',
       color: '#FFFFFF',
       width: '36px',
       height: '36px',
       borderRadius: '8px',
       cursor: 'pointer',
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'center',
       fontSize: '16px',
       transition: 'background-color 0.15s ease',
       flexShrink: 0
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
     >
      <Menu size={18} />
     </button>

     <div
      style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', minWidth: 0 }}
      onClick={() => {
       if (role === 'student') navigate('/student/dashboard');
       else navigate('/officer/dashboard');
      }}
     >
      <div
       style={{
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        color: '#0B3D91',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
       }}
      >
       <Building2 size={20} />
      </div>
      <div className="enterprise-brand-text" style={{ minWidth: 0, overflow: 'hidden' }}>
       <div style={{ fontSize: '14.5px', fontWeight: 800, letterSpacing: '-0.2px', lineHeight: 1.2, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
        CAMPUS PLACEMENT PORTAL
       </div>
       <div style={{ fontSize: '10.5px', color: '#93C5FD', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
        Enterprise Placement Cell
       </div>
      </div>
     </div>
    </div>

    {/* Center: Global Search Bar (⌘K Trigger) */}
    <div className="enterprise-search-wrapper" style={{ flex: 1, maxWidth: '400px', margin: '0 16px' }}>
     <button
      onClick={() => setIsCommandPaletteOpen(true)}
      style={{
       width: '100%',
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'space-between',
       backgroundColor: 'rgba(255, 255, 255, 0.12)',
       border: '1px solid rgba(255, 255, 255, 0.2)',
       borderRadius: '8px',
       padding: '7px 12px',
       color: '#E2E8F0',
       fontSize: '12.5px',
       cursor: 'pointer',
       transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
       e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
       e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
      }}
      onMouseLeave={e => {
       e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
       e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      }}
     >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
       <Search size={14} color="#CBD5E1" />
       <span style={{ color: '#CBD5E1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Search jobs, drives, applicants...</span>
      </div>
      <kbd
       style={{
        fontSize: '10px',
        fontWeight: 600,
        padding: '2px 5px',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        borderRadius: '4px',
        color: '#FFFFFF',
        fontFamily: 'JetBrains Mono, monospace',
        flexShrink: 0
       }}
      >
       ⌘K
      </kbd>
     </button>
    </div>

    {/* Right: Actions, Notifications, Role Switcher, Profile */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
     {/* Quick Role Switcher Pill */}
     <div className="enterprise-role-switcher" style={{ position: 'relative' }}>
      <button
       onClick={() => { setShowRoleSwitcher(!showRoleSwitcher); setShowNotifications(false); setShowUserMenu(false); }}
       style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        borderRadius: '20px',
        padding: '4px 10px',
        color: '#FFFFFF',
        fontSize: '11.5px',
        fontWeight: 600,
        cursor: 'pointer',
       }}
      >
       <UserCheck size={13} />
       <span style={{ textTransform: 'uppercase', letterSpacing: '0.3px' }}>
        {role === 'admin' ? 'Officer' : role}
       </span>
       <ChevronDown size={11} />
      </button>

      {showRoleSwitcher && (
       <div
        style={{
         position: 'absolute',
         top: '110%',
         right: 0,
         width: '210px',
         backgroundColor: '#FFFFFF',
         borderRadius: '10px',
         boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
         border: '1px solid #E2E8F0',
         padding: '6px',
         zIndex: 2000,
         color: '#1E293B',
        }}
       >
        <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
         Switch Test Persona
        </div>
        {[
         { id: 'student', label: 'Student Persona', icon: '' },
         { id: 'officer', label: 'Placement Officer / Admin', icon: '️' },
        ].map(p => (
         <button
          key={p.id}
          onClick={() => handleRoleSwitch(p.id)}
          style={{
           width: '100%',
           display: 'flex',
           alignItems: 'center',
           gap: '8px',
           padding: '8px 10px',
           borderRadius: '6px',
           border: 'none',
           backgroundColor: (role === p.id || (p.id === 'officer' && ['officer', 'admin', 'tpo'].includes(role))) ? '#E6EEFC' : 'transparent',
           color: (role === p.id || (p.id === 'officer' && ['officer', 'admin', 'tpo'].includes(role))) ? '#0B3D91' : '#334155',
           fontWeight: (role === p.id || (p.id === 'officer' && ['officer', 'admin', 'tpo'].includes(role))) ? 600 : 500,
           fontSize: '12.5px',
           cursor: 'pointer',
           textAlign: 'left',
          }}
         >
          <span>{p.icon}</span>
          <span>{p.label}</span>
         </button>
        ))}
       </div>
      )}
     </div>

     {/* Notifications Center */}
     <div style={{ position: 'relative' }}>
      <button
       onClick={() => { setShowNotifications(!showNotifications); setShowRoleSwitcher(false); setShowUserMenu(false); }}
       title="Notifications"
       style={{
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.12)',
        border: 'none',
        color: '#FFFFFF',
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
       }}
      >
       <Bell size={18} />
       {unreadCount > 0 && (
        <span
         style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          minWidth: '16px',
          height: '16px',
          backgroundColor: '#EF4444',
          color: '#FFFFFF',
          borderRadius: '8px',
          border: '1.5px solid #0B3D91',
          fontSize: '9.5px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 3px',
         }}
        >
         {unreadCount > 9 ? '9+' : unreadCount}
        </span>
       )}
      </button>

      {showNotifications && (
       <div
        style={{
         position: 'absolute',
         top: '110%',
         right: 0,
         width: '360px',
         backgroundColor: '#FFFFFF',
         borderRadius: '12px',
         boxShadow: '0 15px 35px rgba(0,0,0,0.18)',
         border: '1px solid #E2E8F0',
         overflow: 'hidden',
         zIndex: 2000,
         color: '#1E293B',
        }}
       >
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>Notifications</span>
          {unreadCount > 0 && (
           <span style={{ fontSize: '10.5px', backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '2px 7px', borderRadius: '10px', fontWeight: 700 }}>
            {unreadCount} new
           </span>
          )}
         </div>
         {unreadCount > 0 && (
          <span onClick={handleMarkAllRead} style={{ fontSize: '11px', color: '#1E5FCC', fontWeight: 600, cursor: 'pointer' }}>Mark all read</span>
         )}
        </div>
        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
         {notifications.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
           <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔔</div>
           <div style={{ fontWeight: 600, color: '#334155' }}>No notifications yet</div>
           <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '4px' }}>Updates regarding drives, shortlists, and rounds will appear here.</div>
          </div>
         ) : (
          notifications.map(item => (
           <div
            key={item._id || item.id}
            onClick={() => handleMarkSingleRead(item._id || item.id)}
            style={{
             padding: '12px 16px',
             borderBottom: '1px solid #F1F5F9',
             backgroundColor: !item.isRead ? '#F0F5FD' : '#FFFFFF',
             cursor: 'pointer',
             transition: 'background-color 0.15s ease',
            }}
           >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px', gap: '8px' }}>
             <strong style={{ fontSize: '12.5px', color: '#0F172A', fontWeight: !item.isRead ? 700 : 600 }}>{item.title}</strong>
             <span style={{ fontSize: '10px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'}
             </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>{item.message || item.desc}</p>
            {item.company && (
             <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '10.5px', color: '#2563EB', fontWeight: 600 }}>
              {item.company}
             </span>
            )}
           </div>
          ))
         )}
        </div>
        <div style={{ padding: '10px', textAlign: 'center', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
         <button
          onClick={() => setShowNotifications(false)}
          style={{ background: 'none', border: 'none', color: '#1E5FCC', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
         >
          Close Center
         </button>
        </div>
       </div>
      )}
     </div>

     {/* User Profile Avatar Dropdown */}
     <div style={{ position: 'relative' }}>
      <div
       onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); setShowRoleSwitcher(false); }}
       style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
       }}
      >
       <div
        style={{
         width: '32px',
         height: '32px',
         borderRadius: '50%',
         backgroundColor: '#1E5FCC',
         color: '#FFFFFF',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         fontWeight: 700,
         fontSize: '13px',
         border: '1.5px solid rgba(255, 255, 255, 0.4)',
        }}
       >
        {(user?.name || 'U').charAt(0).toUpperCase()}
       </div>
       <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 600, lineHeight: 1.2, color: '#FFFFFF' }}>
         {user?.name || 'User'}
        </span>
        <span style={{ fontSize: '10px', color: '#93C5FD' }}>
         {user?.email || 'user@college.edu'}
        </span>
       </div>
       <span style={{ fontSize: '10px', color: '#CBD5E1', marginLeft: '2px' }}>▼</span>
      </div>

      {showUserMenu && (
       <div
        style={{
         position: 'absolute',
         top: '110%',
         right: 0,
         width: '220px',
         backgroundColor: '#FFFFFF',
         borderRadius: '10px',
         boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
         border: '1px solid #E2E8F0',
         padding: '6px',
         zIndex: 2000,
         color: '#1E293B',
        }}
       >
        <div style={{ padding: '8px 10px', borderBottom: '1px solid #F1F5F9' }}>
         <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{user?.name || 'User'}</div>
         <div style={{ fontSize: '11px', color: '#64748B' }}>{user?.email || 'user@college.edu'}</div>
         <div style={{ fontSize: '10.5px', color: '#0F766E', fontWeight: 600, marginTop: '2px', textTransform: 'capitalize' }}>
          ● Active: {role}
         </div>
        </div>

        <button
         onClick={() => { setShowUserMenu(false); setIsCommandPaletteOpen(true); }}
         style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 10px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: 'transparent',
          color: '#334155',
          fontSize: '12.5px',
          cursor: 'pointer',
          textAlign: 'left',
          marginTop: '4px',
         }}
        >
         <span>⌨️</span>
         <span>Command Palette (⌘K)</span>
        </button>

        <button
         onClick={onLogout}
         style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 10px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: '#FEE2E2',
          color: '#B91C1C',
          fontWeight: 600,
          fontSize: '12.5px',
          cursor: 'pointer',
          textAlign: 'left',
          marginTop: '4px',
         }}
        >
         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> <span>Sign Out</span>
        </button>
       </div>
      )}
     </div>
    </div>
   </header>

   {/* 2. BODY LAYOUT: COLLAPSIBLE SIDEBAR + MAIN CONTENT */}
   <div style={{ display: 'flex', flex: 1, marginTop: '64px' }}>
    {/* Mobile Backdrop */}
    {mobileDrawerOpen && (
      <div
        className="enterprise-sidebar-backdrop"
        onClick={() => setMobileDrawerOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 1040,
        }}
      />
    )}

    {/* SIDEBAR (240px or 64px) */}
    <aside
     className={`enterprise-sidebar-aside ${mobileDrawerOpen ? 'mobile-open' : ''}`}
     style={{
      width: sidebarCollapsed ? '68px' : '240px',
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid #E2E8F0',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: '64px',
      bottom: 0,
      left: 0,
      zIndex: 1050,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      overflowY: 'auto',
      overflowX: 'hidden',
     }}
    >
     {/* Navigation Items */}
     <div style={{ padding: '12px 8px', flex: 1 }}>
      {!sidebarCollapsed && (
       <div
        style={{
         fontSize: '11px',
         fontWeight: 700,
         color: '#94A3B8',
         textTransform: 'uppercase',
         letterSpacing: '0.06em',
         padding: '6px 12px 8px',
        }}
       >
        Navigation
       </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
       {navItems.map(item => {
        const isActive = activeTab === item.id;
        return (
         <button
          key={item.id}
          onClick={() => {
            onTabChange(item.id);
            setMobileDrawerOpen(false);
          }}
          title={sidebarCollapsed ? item.label : undefined}
          style={{
           width: '100%',
           display: 'flex',
           alignItems: 'center',
           justifyContent: sidebarCollapsed ? 'center' : 'space-between',
           padding: sidebarCollapsed ? '12px 0' : '10px 14px',
           borderRadius: '8px',
           border: 'none',
           backgroundColor: isActive ? '#E6EEFC' : 'transparent',
           color: isActive ? '#0B3D91' : '#475569',
           fontWeight: isActive ? 600 : 500,
           fontSize: '13.5px',
           cursor: 'pointer',
           position: 'relative',
           transition: 'all 0.15s ease',
           borderLeft: isActive ? '3.5px solid #1E5FCC' : '3.5px solid transparent',
          }}
          onMouseEnter={e => {
           if (!isActive) e.currentTarget.style.backgroundColor = '#F8FAFC';
          }}
          onMouseLeave={e => {
           if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
          }}
         >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
           <span style={{ fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item.icon}
           </span>
           {!sidebarCollapsed && (
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
             {item.label}
            </span>
           )}
          </div>

          {!sidebarCollapsed && item.badge !== undefined && (
           <span
            style={{
             fontSize: '11px',
             fontWeight: 700,
             padding: '2px 7px',
             borderRadius: '10px',
             backgroundColor:
              item.badgeVariant === 'danger'
               ? '#FEE2E2'
               : item.badgeVariant === 'success'
               ? '#DCFCE7'
               : item.badgeVariant === 'warning'
               ? '#FEF3C7'
               : '#E6EEFC',
             color:
              item.badgeVariant === 'danger'
               ? '#B91C1C'
               : item.badgeVariant === 'success'
               ? '#15803D'
               : item.badgeVariant === 'warning'
               ? '#B45309'
               : '#1E5FCC',
            }}
           >
            {item.badge}
           </span>
          )}
         </button>
        );
       })}
      </div>
     </div>

     {/* Footer Controls in Sidebar */}
     <div
      style={{
       padding: '12px 10px',
       borderTop: '1px solid #E2E8F0',
       backgroundColor: '#F8FAFC',
       display: 'flex',
       flexDirection: 'column',
       gap: '6px',
      }}
     >
      {!sidebarCollapsed ? (
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#64748B' }}>
        <span>Density:</span>
        <div style={{ display: 'flex', gap: '4px' }}>
         <button
          onClick={() => setDensity('comfortable')}
          style={{
           padding: '2px 6px',
           borderRadius: '4px',
           border: '1px solid',
           borderColor: density === 'comfortable' ? '#1E5FCC' : '#CBD5E1',
           backgroundColor: density === 'comfortable' ? '#E6EEFC' : '#FFFFFF',
           color: density === 'comfortable' ? '#0B3D91' : '#64748B',
           fontSize: '11px',
           fontWeight: 600,
           cursor: 'pointer',
          }}
         >
          Comfortable
         </button>
         <button
          onClick={() => setDensity('compact')}
          style={{
           padding: '2px 6px',
           borderRadius: '4px',
           border: '1px solid',
           borderColor: density === 'compact' ? '#1E5FCC' : '#CBD5E1',
           backgroundColor: density === 'compact' ? '#E6EEFC' : '#FFFFFF',
           color: density === 'compact' ? '#0B3D91' : '#64748B',
           fontSize: '11px',
           fontWeight: 600,
           cursor: 'pointer',
          }}
         >
          Compact
         </button>
        </div>
       </div>
      ) : null}
     </div>
    </aside>

    {/* MAIN CONTENT AREA */}
    <main
     className="enterprise-main-content"
     style={{
      flex: 1,
      marginLeft: sidebarCollapsed ? '68px' : '240px',
      padding: '24px 32px 60px',
      minHeight: 'calc(100vh - 64px)',
      transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: '#F8FAFC',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflowX: 'hidden',
     }}
    >
     {/* Breadcrumb Bar */}
     {breadcrumbs.length > 0 && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#64748B', marginBottom: '12px' }}>
       <span
        style={{ cursor: 'pointer', color: '#1E5FCC', fontWeight: 500 }}
        onClick={() => {
         if (role === 'student') navigate('/student/dashboard');
         else navigate('/officer/dashboard');
        }}
       >
        Portal
       </span>
       {breadcrumbs.map((b, i) => (
        <React.Fragment key={i}>
         <span>/</span>
         <span
          style={{
           color: i === breadcrumbs.length - 1 ? '#0F172A' : '#1E5FCC',
           fontWeight: i === breadcrumbs.length - 1 ? 600 : 500,
           cursor: b.path ? 'pointer' : 'default',
          }}
          onClick={() => b.path && navigate(b.path)}
         >
          {b.label}
         </span>
        </React.Fragment>
       ))}
      </div>
     )}

     {/* Page Title & Action Bar */}
     <div
      style={{
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'space-between',
       marginBottom: '24px',
       paddingBottom: '16px',
       borderBottom: '1px solid #E2E8F0',
       flexWrap: 'wrap',
       gap: '16px',
      }}
     >
      <div>
       <h1
        style={{
         margin: 0,
         fontSize: '24px',
         fontWeight: 700,
         color: '#0F172A',
         letterSpacing: '-0.3px',
        }}
       >
        {pageTitle}
       </h1>
       {pageSubtitle && (
        <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#64748B' }}>
         {pageSubtitle}
        </p>
       )}
      </div>

      {pageActions && (
       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {pageActions}
       </div>
      )}
     </div>

     {/* Injected Page Content */}
     <div className={density === 'compact' ? 'density-compact' : 'density-comfortable'}>
      {children}
     </div>
    </main>
   </div>
  </div>
 );
};
