import React from 'react';
import { 
  Network, 
  ShieldAlert, 
  FileText, 
  Blocks, 
  Settings, 
  Activity, 
  Fingerprint, 
  FolderLock,
  ChevronRight,
  Database
} from 'lucide-react';
import { CaseMetadata } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  cases: CaseMetadata[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  isDemoMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  cases,
  selectedCaseId,
  onSelectCase,
  isDemoMode
}) => {
  const navItems = [
    { id: 'home', label: 'Operations Hub', icon: Activity, badge: 'LIVE' },
    { id: 'graph', label: 'Graph Explorer', icon: Network, badge: null },
    { id: 'entity-resolution', label: 'Entity Resolution', icon: Fingerprint, badge: 'AI NLP' },
    { id: 'blockchain', label: 'Blockchain Ledger', icon: Blocks, badge: '65B' },
    { id: 'reports', label: 'Forensic Reports', icon: FileText, badge: null },
    { id: 'settings', label: 'Data & Settings', icon: Settings, badge: null },
  ];

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100%',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      zIndex: 20
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '20px 18px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)'
        }}>
          <Network size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{
            fontSize: '17px',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>CrimeGraph</span>
            <span style={{
              fontSize: '10px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--text-accent)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '1px 5px',
              borderRadius: '4px',
              fontWeight: 700
            }}>v2.5</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            AI Criminal Network Analysis
          </div>
        </div>
      </div>

      {/* Case Selector Dropdown */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <FolderLock size={12} />
          <span>Active Investigation</span>
        </div>
        <select
          value={selectedCaseId}
          onChange={(e) => onSelectCase(e.target.value)}
          className="input-control"
          style={{
            width: '100%',
            fontWeight: 600,
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-tertiary)',
            cursor: 'pointer'
          }}
        >
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        {isDemoMode && (
          <div style={{
            marginTop: '8px',
            fontSize: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--text-secondary)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 6px #10b981'
              }} />
              Demo Mode Active
            </span>
            <span style={{ color: 'var(--text-muted)' }}>CCTNS/FIU Mock</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: isActive ? '1px solid var(--border-focus)' : '1px solid transparent',
                backgroundColor: isActive ? 'var(--bg-card-hover)' : 'transparent',
                color: isActive ? 'var(--text-accent)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={18} color={isActive ? 'var(--text-accent)' : 'var(--text-muted)'} />
                <span style={{ fontSize: '13px' }}>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '2px 5px',
                  borderRadius: '4px',
                  backgroundColor: isActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: isActive ? 'var(--text-accent)' : 'var(--text-muted)'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Database size={11} /> Hybrid NetworkX / Neo4j
          </span>
          <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>ONLINE</span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
          Chain of Custody: SHA-256 Validated
        </div>
      </div>
    </aside>
  );
};
