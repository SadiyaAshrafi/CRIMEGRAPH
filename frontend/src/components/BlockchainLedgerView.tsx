import React, { useState, useEffect } from 'react';
import { 
  Blocks, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  FileCheck, 
  RefreshCw, 
  KeyRound, 
  QrCode, 
  Printer, 
  X,
  Bug,
  RotateCcw,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BlockchainBlock, BlockchainVerificationResult, CourtCertificate } from '../types';
import { api } from '../services/api';

interface BlockchainLedgerViewProps {
  caseId: string;
}

export const BlockchainLedgerView: React.FC<BlockchainLedgerViewProps> = ({ caseId }) => {
  const [blocks, setBlocks] = useState<BlockchainBlock[]>([]);
  const [verification, setVerification] = useState<BlockchainVerificationResult | null>(null);
  const [courtCert, setCourtCert] = useState<CourtCertificate | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<BlockchainBlock | null>(null);

  const fetchBlocks = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBlockchainBlocks(caseId);
      setBlocks(res.blocks || []);
      if (res.blocks && res.blocks.length > 0) {
        setSelectedBlock(res.blocks[res.blocks.length - 1]);
      }
      // Automatic initial verification
      const vRes = await api.verifyBlockchain(caseId);
      setVerification(vRes);
    } catch (err) {
      console.error('Failed to fetch blockchain:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, [caseId]);

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const vRes = await api.verifyBlockchain(caseId);
      setVerification(vRes);
      if (vRes.is_authentic) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    try {
      await api.simulateTamper(caseId, 1);
      const vRes = await api.verifyBlockchain(caseId);
      setVerification(vRes);
      const bRes = await api.getBlockchainBlocks(caseId);
      setBlocks(bRes.blocks);
    } catch (err) {
      console.error('Tamper simulation failed:', err);
    }
  };

  const handleRestoreChain = async () => {
    try {
      await api.restoreBlockchain(caseId);
      await fetchBlocks();
    } catch (err) {
      console.error('Restore failed:', err);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      const cert = await api.getCourtCertificate(caseId);
      setCourtCert(cert);
      setShowCertModal(true);
    } catch (err) {
      console.error('Failed to generate court certificate:', err);
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--text-accent)'
            }}>
              <Blocks size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                Forensic Blockchain Chain-of-Custody
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Immutable SHA-256 Merkle-tree ledger ensuring Section 65B Indian Evidence Act / BSA court admissibility.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={handleSimulateTamper}
            className="btn-danger"
            style={{ fontSize: '12px' }}
            title="Simulates unauthorized DB edit to test cryptographic alarm"
          >
            <Bug size={14} />
            Simulate Tamper
          </button>
          <button 
            onClick={handleRestoreChain}
            className="btn-secondary"
            style={{ fontSize: '12px' }}
            title="Restores authentic chain state"
          >
            <RotateCcw size={14} />
            Restore Chain
          </button>
          <button 
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="btn-primary"
            style={{ fontSize: '12px' }}
          >
            <ShieldCheck size={14} />
            {isVerifying ? 'Verifying...' : 'Verify Cryptographic Integrity'}
          </button>
          <button 
            onClick={handleGenerateCertificate}
            className="btn-secondary"
            style={{ fontSize: '12px', borderColor: 'var(--accent-purple)', color: '#c084fc' }}
          >
            <FileCheck size={14} />
            Section 65B Certificate
          </button>
        </div>
      </div>

      {/* Verification Status Banner */}
      {verification && (
        <div 
          className="glass-panel"
          style={{
            padding: '16px 20px',
            marginBottom: '24px',
            borderColor: verification.is_authentic ? '#10b981' : '#ef4444',
            backgroundColor: verification.is_authentic ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {verification.is_authentic ? (
              <CheckCircle2 size={24} color="#10b981" />
            ) : (
              <AlertTriangle size={24} color="#ef4444" className="pulse-critical" />
            )}
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: verification.is_authentic ? '#34d399' : '#f87171'
              }}>
                {verification.is_authentic 
                  ? 'Blockchain Chain of Custody: VERIFIED 100% AUTHENTIC' 
                  : 'CRITICAL SECURITY ALERT: Tampering Detected in Blockchain Ledger!'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {verification.is_authentic 
                  ? `All ${verification.total_blocks} blocks validated. Merkle Root: ${verification.merkle_root}`
                  : `Tampered blocks: #${verification.tampered_block_indices.join(', #')}. Unauthorized modification detected!`}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: verification.is_authentic ? '#10b981' : '#ef4444',
              color: '#ffffff'
            }}>
              {verification.audit_status}
            </span>
          </div>
        </div>
      )}

      {/* Block Explorer Grid: Chain on Left, Inspector on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left: Interactive Chronological Blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Chronological Block Stream ({blocks.length} Blocks)
          </div>

          {blocks.map((block) => {
            const isSelected = selectedBlock?.index === block.index;
            const isTampered = verification?.tampered_block_indices.includes(block.index);

            return (
              <div
                key={block.index}
                onClick={() => setSelectedBlock(block)}
                className="glass-card"
                style={{
                  padding: '14px 18px',
                  cursor: 'pointer',
                  borderLeft: isTampered 
                    ? '4px solid #ef4444' 
                    : isSelected 
                    ? '4px solid var(--text-accent)' 
                    : '4px solid rgba(255,255,255,0.1)',
                  backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-accent)'
                    }}>
                      BLOCK #{block.index}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-secondary)'
                    }}>
                      {block.action_type}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {block.timestamp}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Signed by: <span style={{ color: 'var(--text-secondary)' }}>{block.investigator_name} ({block.investigator_badge})</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Hash:</span>
                  <span className="hash-pill" style={{ fontSize: '10px' }}>
                    {block.evidence_hash.substring(0, 20)}...
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Block Deep Inspector */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
            Block Cryptographic Metadata
          </div>

          {selectedBlock ? (
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  Block #{selectedBlock.index} Inspector
                </h3>
                <span className="hash-pill">Nonce: {selectedBlock.nonce}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Evidence SHA-256 Hash</div>
                  <div className="hash-pill" style={{ wordBreak: 'break-all', marginTop: '3px' }}>
                    {selectedBlock.evidence_hash}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Previous Block Hash</div>
                  <div className="hash-pill" style={{ wordBreak: 'break-all', marginTop: '3px', color: 'var(--text-secondary)' }}>
                    {selectedBlock.prev_hash}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cumulative Merkle Root</div>
                  <div className="hash-pill" style={{ wordBreak: 'break-all', marginTop: '3px', color: '#c084fc' }}>
                    {selectedBlock.merkle_root}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Investigator Digital Signature (ECDSA)</div>
                  <div className="hash-pill" style={{ wordBreak: 'break-all', marginTop: '3px', color: '#34d399' }}>
                    {selectedBlock.digital_signature}
                  </div>
                </div>
              </div>

              {/* Decoded Action Details JSON */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Decoded Evidence Payload
                </div>
                <pre style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  overflowX: 'auto',
                  maxHeight: '200px'
                }}>
                  {JSON.stringify(selectedBlock.details, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a block on the left to inspect cryptographic keys.
            </div>
          )}
        </div>
      </div>

      {/* Section 65B Court Admissibility Certificate Modal */}
      {showCertModal && courtCert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div 
            className="glass-panel"
            style={{
              width: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#0d1322',
              border: '2px solid rgba(56, 189, 248, 0.4)',
              padding: '32px',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setShowCertModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            {/* Official Certificate Layout */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '20px', marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: 800, color: 'var(--text-accent)', textTransform: 'uppercase' }}>
                Forensic Digital Evidence Certificate
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginTop: '4px' }}>
                CERTIFICATE UNDER SECTION 65B
              </h1>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Indian Evidence Act, 1872 / Section 63 Bharatiya Sakshya Adhiniyam, 2023
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Certificate ID:</strong>{' '}
                <span className="hash-pill">{courtCert.certificate_id}</span>
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Case Reference:</strong> {courtCert.case_title} ({courtCert.case_id})
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Issuing Forensic Officer:</strong> {courtCert.investigating_officer}
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Generated Timestamp:</strong> {courtCert.generated_at}
              </div>

              <div style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '14px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                marginTop: '10px'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Statutory Declaration:
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  I hereby certify that the electronic records, graph topologies, telecommunication CDR logs, and financial transaction trails produced herein were ingested, parsed, and hashed in real-time within CrimeGraph's automated digital forensics pipeline. The cryptographic Merkle root hash below validates that zero alteration, deletion, or tampering has occurred since initial ingestion.
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Verified Merkle Root:</strong>
                <div className="hash-pill" style={{ wordBreak: 'break-all', marginTop: '4px' }}>
                  {courtCert.merkle_root}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700 }}>
                  <ShieldCheck size={20} />
                  <span>COURT ADMISSIBLE - CRYPTOGRAPHICALLY VALID</span>
                </div>

                <button 
                  onClick={() => window.print()}
                  className="btn-primary"
                  style={{ fontSize: '12px' }}
                >
                  <Printer size={14} />
                  Print Official Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
