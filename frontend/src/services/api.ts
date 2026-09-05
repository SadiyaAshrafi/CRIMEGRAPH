import {
  CaseMetadata,
  GraphDataResponse,
  AliasMatch,
  BlockchainBlock,
  BlockchainVerificationResult,
  CourtCertificate,
  AIExplainResponse
} from '../types';

const API_BASE = '/api';

export const api = {
  // Cases
  async getCases(): Promise<CaseMetadata[]> {
    const res = await fetch(`${API_BASE}/cases`);
    if (!res.ok) throw new Error('Failed to fetch cases');
    return res.json();
  },

  async getCaseGraph(caseId: string): Promise<GraphDataResponse> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/graph`);
    if (!res.ok) throw new Error('Failed to fetch graph data');
    return res.json();
  },

  async getEgoSubgraph(caseId: string, nodeId: string, radius: number = 1): Promise<any> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/ego?node_id=${encodeURIComponent(nodeId)}&radius=${radius}`);
    if (!res.ok) throw new Error('Failed to fetch ego subgraph');
    return res.json();
  },

  async getShortestPath(caseId: string, source: string, target: string): Promise<any> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/path?source=${encodeURIComponent(source)}&target=${encodeURIComponent(target)}`);
    if (!res.ok) throw new Error('Failed to compute shortest path');
    return res.json();
  },

  // Entity Resolution
  async getEntityResolution(caseId: string): Promise<{ case_id: string; total_matches_found: number; matches: AliasMatch[] }> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/entity-resolution`);
    if (!res.ok) throw new Error('Failed to fetch entity resolution');
    return res.json();
  },

  async mergeEntities(caseId: string, primaryId: string, secondaryId: string, reason: string): Promise<any> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/merge-entities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ primary_id: primaryId, secondary_id: secondaryId, reason })
    });
    if (!res.ok) throw new Error('Failed to merge entities');
    return res.json();
  },

  async toggleFlagNode(caseId: string, nodeId: string): Promise<{ status: string; is_flagged: boolean }> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/flag-node`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ node_id: nodeId })
    });
    if (!res.ok) throw new Error('Failed to toggle flag');
    return res.json();
  },

  // Blockchain Ledger
  async getBlockchainBlocks(caseId: string): Promise<{ case_id: string; total_blocks: number; blocks: BlockchainBlock[] }> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/blockchain/blocks`);
    if (!res.ok) throw new Error('Failed to fetch blockchain blocks');
    return res.json();
  },

  async verifyBlockchain(caseId: string): Promise<BlockchainVerificationResult> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/blockchain/verify`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to verify blockchain');
    return res.json();
  },

  async simulateTamper(caseId: string, blockIndex: number): Promise<any> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/blockchain/simulate-tamper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ block_index: blockIndex })
    });
    if (!res.ok) throw new Error('Failed to simulate tamper');
    return res.json();
  },

  async restoreBlockchain(caseId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/blockchain/restore`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to restore blockchain');
    return res.json();
  },

  async getCourtCertificate(caseId: string): Promise<CourtCertificate> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/blockchain/certificate`);
    if (!res.ok) throw new Error('Failed to fetch court certificate');
    return res.json();
  },

  // AI Synthesis
  async explainTarget(caseId: string, targetType: string, targetId?: string, customQuery?: string): Promise<AIExplainResponse> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/ai/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_id: caseId,
        target_type: targetType,
        target_id: targetId,
        custom_query: customQuery
      })
    });
    if (!res.ok) throw new Error('Failed to generate AI explanation');
    return res.json();
  },

  // Ingestion & Export
  async ingestCSV(caseId: string, suspectsFile?: File, transactionsFile?: File, callsFile?: File): Promise<any> {
    const formData = new FormData();
    if (suspectsFile) formData.append('suspects_file', suspectsFile);
    if (transactionsFile) formData.append('transactions_file', transactionsFile);
    if (callsFile) formData.append('calls_file', callsFile);

    const res = await fetch(`${API_BASE}/cases/${caseId}/ingest/csv`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to ingest CSV files');
    return res.json();
  },

  async exportCaseJSON(caseId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/export/json`);
    if (!res.ok) throw new Error('Failed to export case JSON');
    return res.json();
  }
};
