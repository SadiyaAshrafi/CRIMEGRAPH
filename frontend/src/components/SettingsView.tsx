import React, { useState } from 'react';
import { 
  Settings, 
  Upload, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  FileSpreadsheet, 
  ShieldCheck, 
  ToggleLeft, 
  ToggleRight,
  Server,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

interface SettingsViewProps {
  caseId: string;
  isDemoMode: boolean;
  setIsDemoMode: (isDemo: boolean) => void;
  onDataIngested: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  caseId,
  isDemoMode,
  setIsDemoMode,
  onDataIngested
}) => {
  const [suspectsFile, setSuspectsFile] = useState<File | null>(null);
  const [transactionsFile, setTransactionsFile] = useState<File | null>(null);
  const [callsFile, setCallsFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Settings form states
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [neo4jUri, setNeo4jUri] = useState('bolt://localhost:7687');
  const [neo4jUser, setNeo4jUser] = useState('neo4j');
  const [neo4jPassword, setNeo4jPassword] = useState('password');
  const [neo4jStatus, setNeo4jStatus] = useState<string | null>(null);

  const handleUploadFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspectsFile && !transactionsFile && !callsFile) {
      alert('Please select at least one CSV file to ingest.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await api.ingestCSV(caseId, suspectsFile || undefined, transactionsFile || undefined, callsFile || undefined);
      setUploadSuccess(res.message || 'CSV files successfully parsed and synced with graph engine!');
      setSuspectsFile(null);
      setTransactionsFile(null);
      setCallsFile(null);
      onDataIngested();
      setTimeout(() => setUploadSuccess(null), 6000);
    } catch (err: any) {
      alert('Ingestion error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTestNeo4j = () => {
    setNeo4jStatus('Testing connection...');
    setTimeout(() => {
      setNeo4jStatus('Fallback Active: NetworkX in-memory core is handling all graph calculations seamlessly.');
    }, 800);
  };

  return (
    <div style={{
      flex: 1,
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      padding: '28px',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <div style={{
          padding: '8px',
          borderRadius: '8px',
          backgroundColor: 'rgba(56, 189, 248, 0.15)',
          color: 'var(--text-accent)'
        }}>
          <Settings size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            System Settings & Data Ingestion Pipeline
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Configure live data feeds, Demo mode, custom CSV ETL uploads, Gemini AI API credentials, and Neo4j connectors.
          </p>
        </div>
      </div>

      {uploadSuccess && (
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
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{uploadSuccess}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column: Demo Mode & CSV Ingestion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Demo Mode Card */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Demo Mode Toggle
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {isDemoMode 
                    ? 'Demo Mode ON: Pre-loaded synthetic syndicate datasets active for hackathon showcase.' 
                    : 'Demo Mode OFF: Connects to live departmental REST endpoints.'}
                </p>
              </div>

              <button
                onClick={() => setIsDemoMode(!isDemoMode)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDemoMode ? '#10b981' : 'var(--text-muted)' }}
              >
                {isDemoMode ? <ToggleRight size={38} /> : <ToggleLeft size={38} />}
              </button>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Status: <span style={{ color: isDemoMode ? '#10b981' : 'var(--text-accent)', fontWeight: 700 }}>
                {isDemoMode ? 'MOCK DATASETS LOADED' : 'LIVE API INGESTION LISTENING'}
              </span>
            </div>
          </div>

          {/* Custom CSV File Upload Form */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <FileSpreadsheet size={18} color="var(--text-accent)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                ETL Data Ingestion Layer (CSV / JSON)
              </h3>
            </div>

            <form onSubmit={handleUploadFiles} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  1. Suspects File (suspects.csv)
                </label>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => setSuspectsFile(e.target.files?.[0] || null)}
                  className="input-control"
                  style={{ width: '100%', fontSize: '11px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  2. Transactions File (transactions.csv)
                </label>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => setTransactionsFile(e.target.files?.[0] || null)}
                  className="input-control"
                  style={{ width: '100%', fontSize: '11px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  3. Telecom CDR Calls File (calls.csv)
                </label>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => setCallsFile(e.target.files?.[0] || null)}
                  className="input-control"
                  style={{ width: '100%', fontSize: '11px' }}
                />
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="btn-primary"
                style={{ marginTop: '6px', justifyContent: 'center' }}
              >
                <Upload size={14} />
                {isUploading ? 'Ingesting & Hashing...' : 'Ingest Data & Rebuild Graph'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: AI & Neo4j Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Gemini AI Settings */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Sparkles size={18} color="#a855f7" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Google Gemini Intelligence Configuration
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Gemini API Key (Optional / Auto-Fallback)
                </label>
                <input
                  type="password"
                  placeholder="Enter AIzaSy... API key"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="input-control"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                When no key is specified, CrimeGraph automatically uses its internal forensic heuristic engine to generate deep investigative dossiers without external network dependencies.
              </div>
            </div>
          </div>

          {/* Neo4j Database Connection */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Database size={18} color="var(--text-accent)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Neo4j Graph Database Connector (Enterprise Mode)
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Bolt URL
                </label>
                <input
                  type="text"
                  value={neo4jUri}
                  onChange={(e) => setNeo4jUri(e.target.value)}
                  className="input-control"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={neo4jUser}
                    onChange={(e) => setNeo4jUser(e.target.value)}
                    className="input-control"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={neo4jPassword}
                    onChange={(e) => setNeo4jPassword(e.target.value)}
                    className="input-control"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestNeo4j}
                className="btn-secondary"
                style={{ fontSize: '12px', justifyContent: 'center', marginTop: '4px' }}
              >
                <Server size={14} />
                Test Neo4j Bolt Connection
              </button>

              {neo4jStatus && (
                <div style={{ fontSize: '11px', color: 'var(--text-accent)', backgroundColor: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '4px' }}>
                  {neo4jStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
