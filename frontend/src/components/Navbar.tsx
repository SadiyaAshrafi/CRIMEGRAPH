import React from 'react';
import { 
  Search, 
  Sparkles, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Radio, 
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { CaseMetadata, GraphNode } from '../types';

interface NavbarProps {
  currentCase?: CaseMetadata;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDarkTheme: boolean;
  setIsDarkTheme: (isDark: boolean) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  onSelectNodeById: (nodeId: string) => void;
  nodes: GraphNode[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCase,
  searchQuery,
  setSearchQuery,
  isDarkTheme,
  setIsDarkTheme,
  selectedModel,
  setSelectedModel,
  onSelectNodeById,
  nodes
}) => {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // Search filtering
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return nodes.filter(n => 
      n.name.toLowerCase().includes(q) ||
      n.aliases.some(a => a.toLowerCase().includes(q)) ||
      (n.phone && n.phone.includes(q)) ||
      (n.bank_account && n.bank_account.toLowerCase().includes(q)) ||
      (n.crypto_address && n.crypto_address.toLowerCase().includes(q)) ||
      (n.cctns_fir && n.cctns_fir.toLowerCase().includes(q)) ||
      (n.role && n.role.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [searchQuery, nodes]);

  return (
    <header style={{
      height: 'var(--header-height)',
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
      zIndex: 15,
      position: 'relative'
    }}>
      {/* Left: Case Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)'
            }}>
              {currentCase?.title || 'CrimeGraph Operations'}
            </h1>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-accent)',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid rgba(56, 189, 248, 0.2)'
            }}>
              {currentCase?.codename || 'CASE-LIVE'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{currentCase?.investigating_agency || 'Central Investigative Agency'}</span>
            <span>•</span>
            <span style={{ color: 'var(--risk-high)', fontWeight: 600 }}>
              {currentCase?.critical_suspects || 0} Priority Targets
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Universal Investigative Search */}
      <div style={{ flex: '1', maxWidth: '460px', position: 'relative' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search suspect, alias, phone, bank acct, crypto hash, FIR..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="input-control"
            style={{
              width: '100%',
              paddingLeft: '36px',
              paddingRight: '12px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-full)'
            }}
          />
        </div>

        {/* Live Search Dropdown Results */}
        {isSearchOpen && searchResults.length > 0 && (
          <div 
            className="glass-panel"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              zIndex: 50,
              padding: '8px',
              maxHeight: '340px',
              overflowY: 'auto'
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>
              Matching Entities ({searchResults.length})
            </div>
            {searchResults.map((node) => (
              <div
                key={node.id}
                onClick={() => {
                  onSelectNodeById(node.id);
                  setIsSearchOpen(false);
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                    {node.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {node.role} {node.aliases.length > 0 && `(AKA: ${node.aliases[0]})`}
                  </div>
                </div>
                <span className={`badge-${node.risk_level.toLowerCase()}`}>
                  {node.risk_score}/100
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: AI Model Selector & Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Model Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'var(--bg-tertiary)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)'
        }}>
          <Sparkles size={15} color="#a855f7" />
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="gemini-3.7-flash" style={{ background: '#0d1322' }}>Gemini 3.7 Flash</option>
            <option value="gemini-1.5-pro" style={{ background: '#0d1322' }}>Gemini 1.5 Pro</option>
            <option value="neural-heuristic" style={{ background: '#0d1322' }}>Forensic Heuristic Engine</option>
          </select>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => {
            const next = !isDarkTheme;
            setIsDarkTheme(next);
            document.body.className = next ? 'dark-theme' : 'light-theme';
          }}
          className="btn-secondary"
          style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
          title={isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDarkTheme ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};
