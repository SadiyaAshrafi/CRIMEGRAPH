import React, { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  GitMerge, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Cpu,
  Layers,
  RefreshCw
} from 'lucide-react';
import { AliasMatch, GraphNode } from '../types';
import { api } from '../services/api';

interface EntityResolutionViewProps {
  caseId: string;
  nodes: GraphNode[];
  onMergeComplete: () => void;
}

export const EntityResolutionView: React.FC<EntityResolutionViewProps> = ({
  caseId,
  nodes,
  onMergeComplete
}) => {
  const [matches, setMatches] = useState<AliasMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const res = await api.getEntityResolution(caseId);
      setMatches(res.matches || []);
    } catch (err) {
      console.error('Failed to load entity resolution matches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [caseId]);

  const handleMerge = async (match: AliasMatch) => {
    setMergingId(match.id);
    try {
      await api.mergeEntities(
        caseId,
        match.source_entity_id,
        match.target_entity_id,
        `AI Entity Resolution: ${match.matched_rules.join('; ')}`
      );
      setSuccessMessage(`Successfully merged "${match.target_name}" into "${match.source_name}". Graph updated & committed to Blockchain!`);
      // Update local state
      setMatches(prev => prev.filter(m => m.id !== match.id));
      onMergeComplete();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Merge failed:', err);
    } finally {
      setMergingId(null);
    }
  };

  const handleDismiss = (matchId: string) => {
    setMatches(prev => prev.filter(m => m.id !== matchId));
  };

  return (
    <div style={{
      flex: 1,
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      padding: '28px',
      overflowY: 'auto'
    }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc'
            }}>
              <Fingerprint size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                AI & NLP Entity Resolution Laboratory
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Cross-correlates biometric names, phone IMEIs, banking PAN tokens, and fuzzy strings to detect criminal aliases & duplicate identities.
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={fetchMatches} 
          disabled={isLoading}
          className="btn-secondary"
        >
          <RefreshCw size={14} className={isLoading ? "radar-spinner" : ""} />
          Re-Run Matching Engine
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div 
          className="glass-panel"
          style={{
            padding: '14px 18px',
            marginBottom: '20px',
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#34d399'
          }}
        >
          <CheckCircle2 size={18} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{successMessage}</span>
        </div>
      )}

      {/* Matching Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-card">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Detected Match Candidates</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {matches.length}
          </div>
        </div>
        <div className="glass-card">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>High Confidence (&gt;80%)</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {matches.filter(m => m.confidence_percentage >= 80).length}
          </div>
        </div>
        <div className="glass-card">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cross-Domain KYC Tokens</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-accent)', marginTop: '4px' }}>
            IMEI, PAN, CDR, MCA
          </div>
        </div>
        <div className="glass-card">
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Audit Guarantee</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#c084fc', marginTop: '4px' }}>
            Blockchain Logged
          </div>
        </div>
      </div>

      {/* Matches List */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Cpu size={32} className="radar-spinner" style={{ margin: '0 auto 12px' }} color="var(--text-accent)" />
          <div>Analyzing multi-modal identity records across CCTNS, Telecom & Banking...</div>
        </div>
      ) : matches.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            All Graph Entities Resolved & Deduplicated
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            No pending alias collisions or suspicious duplicate nodes detected in this syndicate.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {matches.map((match) => (
            <div 
              key={match.id}
              className="glass-card"
              style={{
                padding: '20px',
                borderLeft: match.confidence_percentage >= 80 ? '4px solid #10b981' : '4px solid var(--accent-amber)'
              }}
            >
              {/* Top Row: Confidence & Recommendation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: match.confidence_percentage >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: match.confidence_percentage >= 80 ? '#34d399' : '#fbbf24',
                    border: `1px solid ${match.confidence_percentage >= 80 ? '#10b981' : '#f59e0b'}`
                  }}>
                    {match.confidence_percentage}% AI Confidence Match
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Action: {match.recommended_action}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleDismiss(match.id)}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleMerge(match)}
                    disabled={mergingId === match.id}
                    className="btn-primary"
                    style={{ fontSize: '12px', padding: '6px 14px' }}
                  >
                    <GitMerge size={14} />
                    {mergingId === match.id ? 'Merging...' : 'Approve & Merge Entities'}
                  </button>
                </div>
              </div>

              {/* Middle Row: Side-by-Side Entity Comparison */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: '16px',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.25)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '14px'
              }}>
                {/* Primary Entity */}
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Primary Node
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {match.source_name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-accent)' }}>
                    {match.source_role} • Risk {match.source_risk}/100
                  </div>
                </div>

                {/* Merge Arrow */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <ArrowRight size={22} color="var(--text-accent)" />
                  <span style={{ fontSize: '10px', fontWeight: 600 }}>MERGE</span>
                </div>

                {/* Target Entity */}
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Identified Duplicate / Covert Alias
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {match.target_name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-accent)' }}>
                    {match.target_role} • Risk {match.target_risk}/100
                  </div>
                </div>
              </div>

              {/* Bottom Row: Matched Rules & Evidentiary Explainability */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Forensic Corroboration Rules Triggered:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {match.matched_rules.map((rule, idx) => (
                    <span 
                      key={idx}
                      className="hash-pill"
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                    >
                      ✓ {rule}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
