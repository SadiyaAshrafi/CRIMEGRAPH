from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class GraphNode(BaseModel):
    id: str
    name: str
    label: str
    type: str = "person"  # person, bank_account, phone, crypto_wallet, shell_company, vehicle, location
    aliases: List[str] = []
    risk_score: int = 50  # 0 to 100
    risk_level: str = "MEDIUM"  # CRITICAL, HIGH, MEDIUM, LOW
    role: str = "Suspect"  # Kingpin, Hawala Operator, Mule Account, Tech Specialist, Courier, Front Company, Broker
    centrality_score: float = 0.0
    pagerank: float = 0.0
    betweenness: float = 0.0
    community_id: int = 0
    community_name: Optional[str] = None
    jurisdiction: str = "Interpol / CBI / Crime Branch"
    cctns_fir: Optional[str] = None
    fiu_str_id: Optional[str] = None
    phone: Optional[str] = None
    bank_account: Optional[str] = None
    crypto_address: Optional[str] = None
    location: Optional[str] = None
    last_active: Optional[str] = None
    photo_url: Optional[str] = None
    is_flagged: bool = False
    notes: Optional[str] = None
    metadata: Dict[str, Any] = {}

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str  # CALL, FUND_TRANSFER, CRYPTO_TRANSFER, SHARED_ADDRESS, SHELL_DIRECTOR, CO_ACCUSED
    label: Optional[str] = None
    weight: float = 1.0
    amount_inr: Optional[float] = None
    call_duration_sec: Optional[int] = None
    call_count: Optional[int] = None
    timestamp: Optional[str] = None
    confidence_score: int = 85  # 0 - 100
    explain_trail: str = ""
    evidence_ids: List[str] = []
    metadata: Dict[str, Any] = {}

class GraphData(BaseModel):
    case_id: str
    case_name: str
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    communities: List[Dict[str, Any]] = []
    analytics: Dict[str, Any] = {}

class CaseMetadata(BaseModel):
    id: str
    title: str
    codename: str
    description: str
    investigating_agency: str
    created_date: str
    status: str = "ACTIVE"  # ACTIVE, CLOSED, UNDER_SURVEILLANCE
    lead_investigator: str
    total_suspects: int
    critical_suspects: int
    total_volume_inr: float
    total_calls_monitored: int
    blockchain_verified: bool = True
    tags: List[str] = []

class AliasMatch(BaseModel):
    id: str
    source_entity_id: str
    source_name: str
    target_entity_id: str
    target_name: str
    similarity_score: float  # 0.0 to 1.0
    confidence_percentage: int  # 0 to 100
    matched_rules: List[str]  # e.g., ["Fuzzy Name 92%", "Shared IMEI 865421...", "Shared PAN Card"]
    status: str = "DETECTED"  # DETECTED, MERGED, DISMISSED
    recommended_action: str
    explain_trail: str

class BlockchainBlock(BaseModel):
    index: int
    timestamp: str
    case_id: str
    action_type: str  # EVIDENCE_INGESTION, ALIAS_MERGED, SUSPECT_FLAGGED, REPORT_GENERATED, GRAPH_SNAPSHOT
    evidence_hash: str
    prev_hash: str
    merkle_root: str
    investigator_badge: str
    investigator_name: str
    digital_signature: str
    nonce: int
    is_valid: bool = True
    details: Dict[str, Any] = {}

class CourtCertificate(BaseModel):
    certificate_id: str
    generated_at: str
    case_id: str
    case_title: str
    investigating_officer: str
    hash_algorithm: str = "SHA-256"
    merkle_root: str
    total_blocks_verified: int
    evidence_items_count: int
    legal_statute: str = "Indian Evidence Act Section 65B / Bharatiya Sakshya Adhiniyam (BSA) 2023"
    tamper_status: str = "VERIFIED_AUTHENTIC"
    qr_code_data: str

class AIExplainRequest(BaseModel):
    case_id: str
    target_type: str  # "node", "edge", "community", "syndicate_overview"
    target_id: Optional[str] = None
    custom_query: Optional[str] = None

class AIExplainResponse(BaseModel):
    title: str
    summary: str
    key_findings: List[str]
    confidence_level: str
    suggested_actions: List[str]
    evidence_chain: List[str]
    model_used: str = "Gemini 3.7 Flash Intelligence Engine"
