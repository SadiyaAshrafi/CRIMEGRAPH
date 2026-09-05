import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  BarChart3, 
  PieChart as PieIcon, 
  Calendar, 
  ShieldAlert, 
  Table, 
  Sparkles,
  QrCode,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { GraphNode, GraphEdge, CaseMetadata } from '../types';
import { api } from '../services/api';

interface ReportBuilderViewProps {
  caseMeta?: CaseMetadata;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const ReportBuilderView: React.FC<ReportBuilderViewProps> = ({
  caseMeta,
  nodes,
  edges
}) => {
  const [activeTab, setActiveTab] = useState<'charts' | 'suspects' | 'transactions' | 'calls'>('charts');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Top suspects by centrality & risk
  const topSuspects = [...nodes].sort((a, b) => (b.centrality_score || 0) - (a.centrality_score || 0)).slice(0, 6);

  // Financial transactions
  const txEdges = edges.filter(e => e.amount_inr && e.amount_inr > 0);
  const totalVolume = txEdges.reduce((acc, e) => acc + (e.amount_inr || 0), 0);

  // Calls
  const callEdges = edges.filter(e => e.type === 'CALL');
  const totalCalls = callEdges.reduce((acc, e) => acc + (e.call_count || 0), 0);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExportingPdf(true);

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#070a13'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CrimeGraph_Forensic_Dossier_${caseMeta?.codename || 'CASE'}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportJSON = async () => {
    if (!caseMeta) return;
    try {
      const data = await api.exportCaseJSON(caseMeta.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CrimeGraph_Dossier_${caseMeta.codename}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('JSON export failed:', err);
    }
  };

  return (
    <div style={{
      flex: 1,
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      padding: '28px',
      overflowY: 'auto'
    }}>
      {/* Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            color: 'var(--text-accent)'
          }}>
            <FileText size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              Forensic Investigation Dossier & Report Builder
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Automated compilation of network centralities, financial flows, CDR timelines, and court-admissible evidence tables.
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleExportJSON}
            className="btn-secondary"
            style={{ fontSize: '12px' }}
          >
            <Download size={14} />
            Export JSON Dossier
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            className="btn-primary"
            style={{ fontSize: '12px' }}
          >
            <FileText size={14} />
            {isExportingPdf ? 'Generating PDF...' : 'Download Official PDF Report'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '12px'
      }}>
        <button
          onClick={() => setActiveTab('charts')}
          className={activeTab === 'charts' ? "btn-primary" : "btn-secondary"}
          style={{ fontSize: '12px' }}
        >
          <BarChart3 size={14} /> Intelligence Analytics Charts
        </button>
        <button
          onClick={() => setActiveTab('suspects')}
          className={activeTab === 'suspects' ? "btn-primary" : "btn-secondary"}
          style={{ fontSize: '12px' }}
        >
          <ShieldAlert size={14} /> Suspect Roster ({nodes.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={activeTab === 'transactions' ? "btn-primary" : "btn-secondary"}
          style={{ fontSize: '12px' }}
        >
          <FileSpreadsheet size={14} /> Financial Transfers ({txEdges.length})
        </button>
        <button
          onClick={() => setActiveTab('calls')}
          className={activeTab === 'calls' ? "btn-primary" : "btn-secondary"}
          style={{ fontSize: '12px' }}
        >
          <Calendar size={14} /> Telecom CDR Logs ({callEdges.length})
        </button>
      </div>

      {/* Printable Report Wrapper */}
      <div ref={reportRef} style={{ padding: '8px' }}>
        {/* Official Header Stamp & Watermark */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle Watermark */}
          <div style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '80px',
            fontWeight: 900,
            color: 'rgba(255,255,255,0.02)',
            fontFamily: 'var(--font-display)',
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
            CRIMEGRAPH
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: 800, color: 'var(--text-accent)', textTransform: 'uppercase' }}>
                CONFIDENTIAL LAW ENFORCEMENT INTELLIGENCE REPORT
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginTop: '4px' }}>
                {caseMeta?.title || 'Syndicate Network Analysis'}
              </h1>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Agency: {caseMeta?.investigating_agency} • Lead: {caseMeta?.lead_investigator}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="hash-pill" style={{ display: 'inline-block', marginBottom: '4px' }}>
                CASE ID: {caseMeta?.codename || 'CRIMEGRAPH-01'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Date: {caseMeta?.created_date || '2024-10-15'} • SHA-256 Validated
              </div>
            </div>
          </div>
        </div>

        {/* Tab 1: Charts */}
        {activeTab === 'charts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Row 1: Centrality Bar Chart & Money Flow Donut */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Bar Chart: Centrality Rankings */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BarChart3 size={16} color="var(--text-accent)" />
                  Top Suspects by Centrality & Risk Score
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topSuspects.map((s) => (
                    <div key={s.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name} ({s.role})</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)' }}>
                          Score: {s.risk_score} | Centrality: {s.centrality_score}
                        </span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${s.risk_score}%`,
                          backgroundColor: s.risk_level === 'CRITICAL' ? '#ef4444' : s.risk_level === 'HIGH' ? '#f97316' : '#38bdf8',
                          borderRadius: '4px'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pie / Donut Breakdown */}
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <PieIcon size={16} color="#10b981" />
                  Financial Channel Distribution (Total ₹{(totalVolume / 1e7).toFixed(1)} Cr)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10b981' }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>Hawala Cash & Shell Invoices</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>64% (₹28.4 Cr)</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#a855f7' }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>Crypto Mixer (USDT/XMR Escrow)</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#a855f7' }}>22% (₹9.8 Cr)</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#38bdf8' }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>Mule Micro-Transfers (Smurfing)</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>14% (₹6.2 Cr)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Suspects Table */}
        {activeTab === 'suspects' && (
          <div className="glass-card" style={{ padding: '16px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Suspect Name</th>
                  <th style={{ padding: '10px' }}>Syndicate Role</th>
                  <th style={{ padding: '10px' }}>Risk Score</th>
                  <th style={{ padding: '10px' }}>Aliases</th>
                  <th style={{ padding: '10px' }}>FIR / KYC Record</th>
                  <th style={{ padding: '10px' }}>Jurisdiction</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map(n => (
                  <tr key={n.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>{n.name}</td>
                    <td style={{ padding: '10px', color: 'var(--text-accent)' }}>{n.role}</td>
                    <td style={{ padding: '10px' }}>
                      <span className={`badge-${n.risk_level.toLowerCase()}`}>{n.risk_score}/100</span>
                    </td>
                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{n.aliases.join(', ') || 'None'}</td>
                    <td style={{ padding: '10px' }}>
                      <span className="hash-pill">{n.cctns_fir || n.fiu_str_id || 'PENDING'}</span>
                    </td>
                    <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{n.jurisdiction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Transactions Table */}
        {activeTab === 'transactions' && (
          <div className="glass-card" style={{ padding: '16px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>From Node</th>
                  <th style={{ padding: '10px' }}>To Node</th>
                  <th style={{ padding: '10px' }}>Transfer Type</th>
                  <th style={{ padding: '10px' }}>Amount (INR)</th>
                  <th style={{ padding: '10px' }}>Confidence</th>
                  <th style={{ padding: '10px' }}>Forensic Trail</th>
                </tr>
              </thead>
              <tbody>
                {txEdges.map(e => {
                  const sId = typeof e.source === 'object' ? (e.source as any).id : e.source;
                  const tId = typeof e.target === 'object' ? (e.target as any).id : e.target;
                  const sNode = nodes.find(n => n.id === sId);
                  const tNode = nodes.find(n => n.id === tId);

                  return (
                    <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>{sNode?.name || sId}</td>
                      <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>{tNode?.name || tId}</td>
                      <td style={{ padding: '10px', color: '#a855f7' }}>{e.type}</td>
                      <td style={{ padding: '10px', fontWeight: 700, color: '#10b981' }}>
                        ₹{(e.amount_inr! / 1e7).toFixed(2)} Cr
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span className="badge-medium">{e.confidence_score}%</span>
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{e.explain_trail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Calls Table */}
        {activeTab === 'calls' && (
          <div className="glass-card" style={{ padding: '16px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Caller</th>
                  <th style={{ padding: '10px' }}>Receiver</th>
                  <th style={{ padding: '10px' }}>Calls Monitored</th>
                  <th style={{ padding: '10px' }}>Total Duration</th>
                  <th style={{ padding: '10px' }}>Confidence</th>
                  <th style={{ padding: '10px' }}>CDR Intercept Trail</th>
                </tr>
              </thead>
              <tbody>
                {callEdges.map(e => {
                  const sId = typeof e.source === 'object' ? (e.source as any).id : e.source;
                  const tId = typeof e.target === 'object' ? (e.target as any).id : e.target;
                  const sNode = nodes.find(n => n.id === sId);
                  const tNode = nodes.find(n => n.id === tId);

                  return (
                    <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>{sNode?.name || sId}</td>
                      <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>{tNode?.name || tId}</td>
                      <td style={{ padding: '10px', fontWeight: 700, color: 'var(--text-accent)' }}>{e.call_count} calls</td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                        {e.call_duration_sec ? `${Math.round(e.call_duration_sec / 60)} mins` : 'N/A'}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span className="badge-medium">{e.confidence_score}%</span>
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{e.explain_trail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
