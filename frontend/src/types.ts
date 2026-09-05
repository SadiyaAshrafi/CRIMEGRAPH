export interface GraphNode {
  id: string;
  name: string;
  label: string;
  type: 'person' | 'bank_account' | 'phone' | 'crypto_wallet' | 'shell_company' | 'vehicle' | 'location';
  aliases: string[];
  risk_score: number;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  role: string;
  centrality_score?: number;
  pagerank?: number;
  betweenness?: number;
  degree_centrality?: number;
  closeness?: number;
  community_id?: number;
  community_name?: string;
  jurisdiction?: string;
  cctns_fir?: string;
  fiu_str_id?: string;
  phone?: string;
  bank_account?: string;
  crypto_address?: string;
  location?: string;
  last_active?: string;
  photo_url?: string;
  is_flagged?: boolean;
  notes?: string;
  metadata?: Record<string, any>;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'CALL' | 'FUND_TRANSFER' | 'CRYPTO_TRANSFER' | 'SHARED_ADDRESS' | 'SHELL_DIRECTOR' | 'CO_ACCUSED';
  label?: string;
  weight?: number;
  amount_inr?: number;
  call_duration_sec?: number;
  call_count?: number;
  timestamp?: string;
  confidence_score: number;
  explain_trail?: string;
  evidence_ids?: string[];
  metadata?: Record<string, any>;
}

export interface CaseMetadata {
  id: string;
  title: string;
  codename: string;
  description: string;
  investigating_agency: string;
  created_date: string;
  status: string;
  lead_investigator: string;
  total_suspects: number;
  critical_suspects: number;
  total_volume_inr: number;
  total_calls_monitored: number;
  blockchain_verified: boolean;
  tags: string[];
}

export interface CommunityCluster {
  community_id: number;
  name: string;
  node_ids: string[];
  size: number;
}

export interface PredictedLink {
  id: string;
  source: string;
  target: string;
  source_name: string;
  target_name: string;
  probability_score: number;
  confidence_percentage: number;
  common_intermediaries: string[];
  reasoning: string;
}

export interface GraphAnalytics {
  total_nodes: number;
  total_edges: number;
  graph_density: number;
  is_connected: boolean;
  top_kingpins: GraphNode[];
  communities_count: number;
  predicted_links_count: number;
}

export interface GraphDataResponse {
  case_id: string;
  meta: CaseMetadata;
  nodes: GraphNode[];
  edges: GraphEdge[];
  communities: CommunityCluster[];
  predicted_links: PredictedLink[];
  analytics: GraphAnalytics;
}

export interface AliasMatch {
  id: string;
  source_entity_id: string;
  source_name: string;
  source_role: string;
  source_risk: number;
  target_entity_id: string;
  target_name: string;
  target_role: string;
  target_risk: number;
  similarity_score: number;
  confidence_percentage: number;
  matched_rules: string[];
  status: 'DETECTED' | 'MERGED' | 'DISMISSED';
  recommended_action: string;
  explain_trail: string;
}

export interface BlockchainBlock {
  index: number;
  timestamp: string;
  case_id: string;
  action_type: string;
  evidence_hash: string;
  prev_hash: string;
  merkle_root: string;
  investigator_badge: string;
  investigator_name: string;
  digital_signature: string;
  nonce: number;
  is_valid: boolean;
  details: Record<string, any>;
}

export interface BlockchainVerificationResult {
  is_authentic: boolean;
  total_blocks: number;
  tampered_blocks_count: number;
  tampered_block_indices: number[];
  merkle_root: string;
  last_verified_at: string;
  audit_status: string;
  anomalies: string[];
}

export interface CourtCertificate {
  certificate_id: string;
  generated_at: string;
  case_id: string;
  case_title: string;
  investigating_officer: string;
  hash_algorithm: string;
  merkle_root: string;
  total_blocks_verified: number;
  evidence_items_count: number;
  legal_statute: string;
  tamper_status: string;
  custody_chain_summary: string;
  qr_code_data: string;
}

export interface AIExplainResponse {
  title: string;
  summary: string;
  key_findings: string[];
  confidence_level: string;
  suggested_actions: string[];
  evidence_chain: string[];
  model_used: string;
}
