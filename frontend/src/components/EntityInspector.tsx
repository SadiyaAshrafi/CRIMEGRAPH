import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  Sparkles, 
  Phone, 
  CreditCard, 
  Coins, 
  MapPin, 
  FileText, 
  Flag, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertOctagon,
  Clock,
  UserCheck
} from 'lucide-react';
import { GraphNode, GraphEdge, AIExplainResponse } from '../types';
import { api } from '../services/api';

interface EntityInspectorProps {
  caseId: string;
  node: GraphNode | null;
  edges: GraphEdge[];
  nodes: GraphNode[];
  onClose: () => void;
  onFlagToggled: (nodeId: string, isFlagged: boolean) => void;
  onSelectConnectedNode: (nodeId: string) => void;
}

export const EntityInspector: React.FC<EntityInspectorProps> = ({
  caseId,
  node,
  edges,
  nodes,
  onClose,
  onFlagToggled,
  onSelectConnectedNode
}) => {
  const [aiReport, setAiReport] = useState<AIExplainResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);

  if (!node) return null;

  // Connected edges & neighbors
  const connectedEdges = edges.filter(e => {
    const sId = typeof e.source === 'object' ? (e.source as any).id : e.source;
    const tId = typeof e.target === 'object' ? (e.target as any).id : e.target;
    return sId === node.id || tId === node.id;
  });

  const totalInrVolume = connectedEdges.reduce((acc, e) => acc + (e.amount_inr || 0), 0);
  const totalCallsCount = connectedEdges.reduce((acc, e) => acc + (e.call_count || 0), 0);

  const handleGenerateAiDossier = async () => {
    setIsAiLoading(true);
    try {
      const res = await api.explainTarget(caseId, 'node', node.id);
      setAiReport(res);
    } catch (err) {
      console.error('AI synthesis failed:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleToggleFlag = async () => {
    setIsFlagging(true);
    try {
      const res = await api.toggleFlagNode(caseId, node.id);
      onFlagToggled(node.id, res.is_flagged);
    } catch (err) {
      console.error('Flag toggle failed:', err);
    } finally {
      setIsFlagging(false);
    }
  };

  return (
    <aside 
      className="glass-panel"
      style={{
        width: '380px',
        height: '100%',
        backgroundColor: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 25,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge-${node.risk_level.toLowerCase()}`}>
            {node.risk_level} PRIORITY
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Score: {node.risk_score}/100
          </span>
        </div>
        <button 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {/* Suspect Profile Card */}
        <div style={{ display: 'flex', gap: '14px', marginBottom: '18px' }}>
          {node.photo_url ? (
            <img 
              src={node.photo_url} 
              alt={node.name}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                objectFit: 'cover',
                border: `2px solid ${node.risk_level === 'CRITICAL' ? 'var(--risk-critical)' : 'var(--border-focus)'}`,
                boxShadow: node.risk_level === 'CRITICAL' ? '0 0 12px var(--risk-critical-glow)' : 'none'
              }} 
            />
          ) : (
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-subtle)'
            }}>
              <ShieldAlert size={28} color="var(--text-muted)" />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {node.name}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-accent)', fontWeight: 600 }}>
              {node.role}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {node.jurisdiction}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={handleGenerateAiDossier}
            disabled={isAiLoading}
            className="btn-primary"
            style={{ justifyContent: 'center', fontSize: '12px', padding: '8px' }}
          >
            <Sparkles size={14} />
            {isAiLoading ? 'Synthesizing...' : 'AI Dossier'}
          </button>
          <button
            onClick={handleToggleFlag}
            disabled={isFlagging}
            className={node.is_flagged ? "btn-danger" : "btn-secondary"}
            style={{ justifyContent: 'center', fontSize: '12px', padding: '8px' }}
          >
            <Flag size={14} />
            {node.is_flagged ? 'Flagged Target' : 'Flag Target'}
          </button>
        </div>

        {/* AI Briefing Box if generated */}
        {aiReport && (
          <div 
            className="glass-card" 
            style={{ 
              marginBottom: '20px', 
              borderColor: 'rgba(168, 85, 247, 0.4)',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(13, 20, 36, 0.9) 100%)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#c084fc', fontWeight: 700, fontSize: '12px' }}>
              <Sparkles size={14} />
              <span>{aiReport.title}</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '10px' }}>
              {aiReport.summary}
            </p>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Key Leads:
            </div>
            <ul style={{ paddingLeft: '16px', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {aiReport.key_findings.map((f, i) => (
                <li key={i} style={{ marginBottom: '2px' }}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          <div className="glass-card" style={{ padding: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Throughput</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
              ₹{(totalInrVolume / 1e7).toFixed(2)} Cr
            </div>
          </div>
          <div className="glass-card" style={{ padding: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Monitored Calls</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-accent)', marginTop: '2px' }}>
              {totalCallsCount} logs
            </div>
          </div>
          <div className="glass-card" style={{ padding: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Centrality Rank</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-amber)', marginTop: '2px' }}>
              {node.centrality_score || 0}
            </div>
          </div>
          <div className="glass-card" style={{ padding: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Betweenness</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {node.betweenness || 0}
            </div>
          </div>
        </div>

        {/* Identifiers & KYC Tokens */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
            Evidentiary Identifiers
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {node.aliases.length > 0 && (
              <div style={{ fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Aliases: </span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {node.aliases.join(', ')}
                </span>
              </div>
            )}
            {node.cctns_fir && (
              <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={13} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)' }}>CCTNS FIR:</span>
                <span className="hash-pill">{node.cctns_fir}</span>
              </div>
            )}
            {node.fiu_str_id && (
              <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={13} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)' }}>FIU STR ID:</span>
                <span className="hash-pill">{node.fiu_str_id}</span>
              </div>
            )}
            {node.phone && (
              <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={13} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{node.phone}</span>
              </div>
            )}
            {node.bank_account && (
              <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={13} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)' }}>Bank:</span>
                <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{node.bank_account}</span>
              </div>
            )}
            {node.crypto_address && (
              <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins size={13} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)' }}>Crypto:</span>
                <span className="hash-pill" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {node.crypto_address}
                </span>
              </div>
            )}
            {node.location && (
              <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)' }}>Location:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{node.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Direct Connections */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
            Connected Network Edges ({connectedEdges.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {connectedEdges.map(edge => {
              const sId = typeof edge.source === 'object' ? (edge.source as any).id : edge.source;
              const tId = typeof edge.target === 'object' ? (edge.target as any).id : edge.target;
              const otherId = sId === node.id ? tId : sId;
              const otherNode = nodes.find(n => n.id === otherId);

              return (
                <div
                  key={edge.id}
                  onClick={() => onSelectConnectedNode(otherId)}
                  className="glass-card"
                  style={{
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {otherNode?.name || otherId}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {edge.type} {edge.amount_inr ? `• ₹${(edge.amount_inr / 1e7).toFixed(1)}Cr` : edge.call_count ? `• ${edge.call_count} calls` : ''}
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
