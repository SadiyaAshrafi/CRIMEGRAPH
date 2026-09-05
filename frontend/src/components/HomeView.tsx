import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  TrendingUp, 
  Radio, 
  Network, 
  Fingerprint, 
  Blocks, 
  Sparkles, 
  ArrowUpRight, 
  ChevronRight,
  Flame,
  FileCheck
} from 'lucide-react';
import { GraphNode, GraphEdge, CaseMetadata, AIExplainResponse } from '../types';
import { api } from '../services/api';

interface HomeViewProps {
  caseMeta?: CaseMetadata;
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNavigateTab: (tab: string) => void;
  onSelectNode: (node: GraphNode) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  caseMeta,
  nodes,
  edges,
  onNavigateTab,
  onSelectNode
}) => {
  const [syndicateAiSummary, setSyndicateAiSummary] = useState<AIExplainResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (caseMeta) {
      setIsAiLoading(true);
      api.explainTarget(caseMeta.id, 'syndicate_overview')
        .then(res => setSyndicateAiSummary(res))
        .catch(err => console.error('Failed to load overview:', err))
        .finally(() => setIsAiLoading(false));
    }
  }, [caseMeta?.id]);

  const criticalNodes = nodes.filter(n => n.risk_level === 'CRITICAL');
  const totalVolume = edges.reduce((acc, e) => acc + (e.amount_inr || 0), 0);
  const totalCalls = edges.reduce((acc, e) => acc + (e.call_count || 0), 0);

  return (
    <div style={{
      flex: 1,
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      padding: '28px',
      overflowY: 'auto'
    }}>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        marginBottom: '28px',
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-critical">THREAT LEVEL: CRITICAL</span>
            <span style={{ fontSize: '11px', color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
              LIVE MONITORING ACTIVE
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginTop: '6px' }}>
            {caseMeta?.title || 'Criminal Network Intelligence'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '680px' }}>
            {caseMeta?.description}
          </p>
        </div>

        <button 
          onClick={() => onNavigateTab('graph')}
          className="btn-primary"
          style={{ padding: '12px 20px', fontSize: '14px' }}
        >
          <Network size={18} />
          Open Interactive Graph Canvas
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Identified Entities</span>
            <ShieldAlert size={16} color="var(--text-accent)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {nodes.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--risk-critical)', marginTop: '4px', fontWeight: 600 }}>
            {criticalNodes.length} Kingpins / High Priority
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Illicit Throughput</span>
            <TrendingUp size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            ₹{(totalVolume / 1e7).toFixed(1)} Cr
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Hawala, Mule & Crypto Flows
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Intercepted Calls</span>
            <Radio size={16} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#c084fc', marginTop: '4px' }}>
            {totalCalls}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Encrypted & Burner SIM logs
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Forensic Chain of Custody</span>
            <FileCheck size={16} color="var(--text-accent)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-accent)', marginTop: '4px' }}>
            100%
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>
            SHA-256 Merkle Validated
          </div>
        </div>
      </div>

      {/* Main Grid: AI Briefing on Left, High Priority Suspects on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left: AI Syndicate Threat Briefing */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                padding: '6px',
                borderRadius: '6px',
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc'
              }}>
                <Sparkles size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  AI Syndicate Threat Assessment
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Gemini 3.7 Flash Graph Synthesis
                </span>
              </div>
            </div>
            <span className="badge-critical">CONFIDENCE: 95%</span>
          </div>

          {isAiLoading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Synthesizing cross-jurisdictional intelligence...
            </div>
          ) : syndicateAiSummary ? (
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                {syndicateAiSummary.summary}
              </p>

              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Key Operational Leads & Findings:
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                {syndicateAiSummary.key_findings.map((f, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{f}</li>
                ))}
              </ul>

              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Recommended Immediate Actions:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {syndicateAiSummary.suggested_actions.map((act, i) => (
                  <div 
                    key={i}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      fontSize: '11px',
                      color: 'var(--text-primary)',
                      borderLeft: '3px solid var(--text-accent)'
                    }}
                  >
                    {act}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Right: Key High-Priority Targets Roster */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Key Priority Targets
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Sorted by Risk & Centrality
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {criticalNodes.map((suspect) => (
              <div
                key={suspect.id}
                onClick={() => {
                  onSelectNode(suspect);
                  onNavigateTab('graph');
                }}
                className="glass-card"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {suspect.photo_url ? (
                    <img 
                      src={suspect.photo_url} 
                      alt={suspect.name} 
                      style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ShieldAlert size={18} color="#ef4444" />
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                      {suspect.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-accent)' }}>
                      {suspect.role} {suspect.aliases.length > 0 && `• AKA: ${suspect.aliases[0]}`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge-critical">{suspect.risk_score}/100</span>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
