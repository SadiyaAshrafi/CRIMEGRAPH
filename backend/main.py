import os
import io
import csv
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from backend.data_loader import get_shadowweb_data, get_phantom_mule_data, export_mock_csvs
from backend.graph_engine import GraphEngine
from backend.entity_resolution import EntityResolutionEngine
from backend.blockchain_ledger import BlockchainLedger
from backend.ai_service import AIService
from backend.models import AIExplainRequest

app = FastAPI(
    title="CrimeGraph Intelligence API",
    description="AI-Powered Criminal Network Analysis, Entity Resolution, and Blockchain Chain-of-Custody",
    version="2.5.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory State Store for Cases
cases_db: Dict[str, Dict[str, Any]] = {}
blockchain_ledgers: Dict[str, BlockchainLedger] = {}
ai_service = AIService()

def initialize_case_store():
    # 1. Operation ShadowWeb
    sw_nodes, sw_edges, sw_meta = get_shadowweb_data()
    sw_engine = GraphEngine(sw_nodes, sw_edges, "shadowweb")
    cases_db["shadowweb"] = {
        "meta": sw_meta,
        "nodes": sw_nodes,
        "edges": sw_edges,
        "engine": sw_engine
    }
    blockchain_ledgers["shadowweb"] = BlockchainLedger("shadowweb")
    # Record initial ingestion block
    blockchain_ledgers["shadowweb"].record_evidence(
        action_type="EVIDENCE_INGESTION",
        details={
            "description": "Initial data ingestion for Operation ShadowWeb (CCTNS, FIU-IND, CDR records)",
            "nodes_count": len(sw_nodes),
            "edges_count": len(sw_edges)
        }
    )

    # 2. Operation Phantom Mule
    pm_nodes, pm_edges, pm_meta = get_phantom_mule_data()
    pm_engine = GraphEngine(pm_nodes, pm_edges, "phantom_mule")
    cases_db["phantom_mule"] = {
        "meta": pm_meta,
        "nodes": pm_nodes,
        "edges": pm_edges,
        "engine": pm_engine
    }
    blockchain_ledgers["phantom_mule"] = BlockchainLedger("phantom_mule")
    blockchain_ledgers["phantom_mule"].record_evidence(
        action_type="EVIDENCE_INGESTION",
        details={
            "description": "Initial data ingestion for Operation Phantom Mule (Cyber Cell & Banking Trojans)",
            "nodes_count": len(pm_nodes),
            "edges_count": len(pm_edges)
        }
    )

    # Export sample mock CSVs to backend/data/ for convenient direct viewing/testing
    export_mock_csvs(os.path.join(os.path.dirname(__file__), "data"))

initialize_case_store()

# --- Health & Metadata ---
@app.get("/api/health")
def get_health():
    return {
        "status": "ONLINE",
        "system": "CrimeGraph Engine v2.5.0",
        "active_cases": list(cases_db.keys()),
        "graph_engine": "NetworkX High-Performance Analytic Core",
        "neo4j_bridge": "Configured (Auto-Fallback Active)",
        "ai_engine": "Gemini 3.7 Flash + Forensic Heuristics",
        "blockchain_custody": "SHA-256 Merkle-Tree Active"
    }

@app.get("/api/cases")
def list_cases():
    return [c["meta"] for c in cases_db.values()]

@app.get("/api/cases/{case_id}")
def get_case(case_id: str):
    if case_id not in cases_db:
        raise HTTPException(status_code=404, detail="Case not found")
    return cases_db[case_id]["meta"]

# --- Graph Intelligence Endpoints ---
@app.get("/api/cases/{case_id}/graph")
def get_case_graph(case_id: str):
    if case_id not in cases_db:
        raise HTTPException(status_code=404, detail="Case not found")
    
    engine: GraphEngine = cases_db[case_id]["engine"]
    graph_analytics = engine.calculate_analytics()
    return {
        "case_id": case_id,
        "meta": cases_db[case_id]["meta"],
        **graph_analytics
    }

@app.get("/api/cases/{case_id}/ego")
def get_ego_subgraph(case_id: str, node_id: str = Query(...), radius: int = Query(1)):
    if case_id not in cases_db:
        raise HTTPException(status_code=404, detail="Case not found")
    
    engine: GraphEngine = cases_db[case_id]["engine"]
    return engine.get_ego_subgraph(node_id, radius)

@app.get("/api/cases/{case_id}/path")
def get_shortest_path(case_id: str, source: str = Query(...), target: str = Query(...)):
    if case_id not in cases_db:
        raise HTTPException(status_code=404, detail="Case not found")
    
    engine: GraphEngine = cases_db[case_id]["engine"]
    path_data = engine.get_shortest_path(source, target)
    if not path_data:
        return {"found": False, "message": "No direct or indirect operational path discovered between selected nodes."}
    return {"found": True, **path_data}

# --- Entity Resolution ---
@app.get("/api/cases/{case_id}/entity-resolution")
def get_entity_resolution(case_id: str):
    if case_id not in cases_db:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case = cases_db[case_id]
    er_engine = EntityResolutionEngine(case["nodes"], case["edges"])
    matches = er_engine.detect_alias_matches()
    return {
        "case_id": case_id,
        "total_matches_found": len(matches),
        "matches": matches
    }

@app.post("/api/cases/{case_id}/merge-entities")
def merge_entities(case_id: str, payload: Dict[str, Any]):
    if case_id not in cases_db:
        raise HTTPException(status_code=404, detail="Case not found")
    
    primary_id = payload.get("primary_id")
    secondary_id = payload.get("secondary_id")
    reason = payload.get("reason", "Investigator approved AI entity resolution match")

    case = cases_db[case_id]
    nodes = case["nodes"]
    edges = case["edges"]

    primary_node = next((n for n in nodes if n["id"] == primary_id), None)
    secondary_node = next((n for n in nodes if n["id"] == secondary_id), None)

    if not primary_node or not secondary_node:
        raise HTTPException(status_code=400, detail="One or both node IDs not found")

    # Merge aliases
    combined_aliases = list(set(primary_node.get("aliases", []) + secondary_node.get("aliases", []) + [secondary_node["name"]]))
    primary_node["aliases"] = combined_aliases
    primary_node["risk_score"] = max(primary_node.get("risk_score", 50), secondary_node.get("risk_score", 50))
    primary_node["notes"] = (primary_node.get("notes", "") + f" [Merged with {secondary_node['name']}: {reason}]").strip()

    # Re-route edges from secondary to primary
    for e in edges:
        if e["source"] == secondary_id:
            e["source"] = primary_id
        if e["target"] == secondary_id:
            e["target"] = primary_id

    # Remove self-loops
    cleaned_edges = [e for e in edges if e["source"] != e["target"]]
    case["edges"] = cleaned_edges

    # Remove secondary node
    case["nodes"] = [n for n in nodes if n["id"] != secondary_id]

    # Rebuild graph engine
    case["engine"] = GraphEngine(case["nodes"], case["edges"], case_id)

    # Log to Blockchain Ledger
    blockchain_ledgers[case_id].record_evidence(
        action_type="ALIAS_MERGED",
        details={
            "primary_entity": primary_node["name"],
            "merged_entity": secondary_node["name"],
            "reason": reason,
            "resulting_aliases": combined_aliases
        }
    )

    return {
        "status": "SUCCESS",
        "message": f"Successfully merged {secondary_node['name']} into {primary_node['name']}",
        "primary_node": primary_node
    }

@app.post("/api/cases/{case_id}/flag-node")
def toggle_flag_node(case_id: str, payload: Dict[str, Any]):
    if case_id not in cases_db:
        raise HTTPException(status_code=404, detail="Case not found")
    
    node_id = payload.get("node_id")
    case = cases_db[case_id]
    target_node = next((n for n in case["nodes"] if n["id"] == node_id), None)
    if not target_node:
        raise HTTPException(status_code=404, detail="Node not found")

    target_node["is_flagged"] = not target_node.get("is_flagged", False)

    # Blockchain event
    blockchain_ledgers[case_id].record_evidence(
        action_type="SUSPECT_FLAGGED" if target_node["is_flagged"] else "SUSPECT_UNFLAGGED",
        details={
            "suspect_id": node_id,
            "suspect_name": target_node["name"],
            "flag_state": target_node["is_flagged"],
            "risk_score": target_node.get("risk_score", 50)
        }
    )

    return {"status": "SUCCESS", "is_flagged": target_node["is_flagged"]}

# --- Blockchain Ledger Endpoints ---
@app.get("/api/cases/{case_id}/blockchain/blocks")
def get_blockchain_blocks(case_id: str):
    if case_id not in blockchain_ledgers:
        raise HTTPException(status_code=404, detail="Ledger not found")
    
    ledger = blockchain_ledgers[case_id]
    return {
        "case_id": case_id,
        "total_blocks": len(ledger.chain),
        "blocks": ledger.chain
    }

@app.post("/api/cases/{case_id}/blockchain/verify")
def verify_blockchain(case_id: str):
    if case_id not in blockchain_ledgers:
        raise HTTPException(status_code=404, detail="Ledger not found")
    
    ledger = blockchain_ledgers[case_id]
    return ledger.verify_integrity()

@app.post("/api/cases/{case_id}/blockchain/simulate-tamper")
def simulate_blockchain_tamper(case_id: str, payload: Dict[str, Any]):
    if case_id not in blockchain_ledgers:
        raise HTTPException(status_code=404, detail="Ledger not found")
    
    block_index = payload.get("block_index", 1)
    ledger = blockchain_ledgers[case_id]
    return ledger.simulate_tamper(block_index)

@app.post("/api/cases/{case_id}/blockchain/restore")
def restore_blockchain(case_id: str):
    if case_id not in blockchain_ledgers:
        raise HTTPException(status_code=404, detail="Ledger not found")
    
    ledger = blockchain_ledgers[case_id]
    ledger.restore_chain()
    return {"status": "RESTORED", "integrity": ledger.verify_integrity()}

@app.get("/api/cases/{case_id}/blockchain/certificate")
def get_court_certificate(case_id: str):
    if case_id not in blockchain_ledgers:
        raise HTTPException(status_code=404, detail="Ledger not found")
    
    ledger = blockchain_ledgers[case_id]
    case_meta = cases_db[case_id]["meta"]
    return ledger.generate_court_certificate(case_meta)

# --- AI Synthesis & Explainability ---
@app.post("/api/cases/{case_id}/ai/explain")
def generate_ai_explanation(case_id: str, req: AIExplainRequest):
    if case_id not in cases_db:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case = cases_db[case_id]
    return ai_service.generate_investigative_synthesis(
        case_meta=case["meta"],
        nodes=case["nodes"],
        edges=case["edges"],
        target_type=req.target_type,
        target_id=req.target_id,
        custom_query=req.custom_query
    )

# --- CSV Ingestion & Data Export ---
@app.post("/api/cases/{case_id}/ingest/csv")
async def ingest_custom_csv(
    case_id: str,
    suspects_file: Optional[UploadFile] = File(None),
    transactions_file: Optional[UploadFile] = File(None),
    calls_file: Optional[UploadFile] = File(None)
):
    if case_id not in cases_db:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case = cases_db[case_id]
    new_nodes_count = 0
    new_edges_count = 0

    # Ingest suspects
    if suspects_file:
        content = await suspects_file.read()
        reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
        for row in reader:
            node_id = row.get("id") or f"custom_{len(case['nodes']) + 1}"
            aliases = [a.strip() for a in row.get("aliases", "").split(";") if a.strip()]
            risk_score = int(row.get("risk_score", 50))
            node_dict = {
                "id": node_id,
                "name": row.get("name", "Custom Entity"),
                "label": row.get("name", "Custom Entity"),
                "type": row.get("type", "person"),
                "aliases": aliases,
                "risk_score": risk_score,
                "risk_level": "CRITICAL" if risk_score >= 90 else "HIGH" if risk_score >= 75 else "MEDIUM",
                "role": row.get("role", "Suspect"),
                "jurisdiction": row.get("jurisdiction", "Local Jurisdiction"),
                "cctns_fir": row.get("cctns_fir", ""),
                "phone": row.get("phone", ""),
                "bank_account": row.get("bank_account", ""),
                "crypto_address": row.get("crypto_address", ""),
                "location": row.get("location", ""),
                "notes": f"Uploaded via custom CSV ingestion ({suspects_file.filename})"
            }
            case["nodes"].append(node_dict)
            new_nodes_count += 1

    # Ingest transactions
    if transactions_file:
        content = await transactions_file.read()
        reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
        for row in reader:
            edge_id = row.get("id") or f"edge_tx_{len(case['edges']) + 1}"
            amt = float(row.get("amount_inr", 0)) if row.get("amount_inr") else 0
            edge_dict = {
                "id": edge_id,
                "source": row.get("source"),
                "target": row.get("target"),
                "type": row.get("type", "FUND_TRANSFER"),
                "amount_inr": amt,
                "weight": max(1.0, amt / 1e6 if amt else 2.0),
                "timestamp": row.get("timestamp", ""),
                "confidence_score": int(row.get("confidence_score", 85)),
                "explain_trail": row.get("explain_trail", "Custom uploaded transaction record")
            }
            case["edges"].append(edge_dict)
            new_edges_count += 1

    # Ingest calls
    if calls_file:
        content = await calls_file.read()
        reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
        for row in reader:
            edge_id = row.get("id") or f"edge_call_{len(case['edges']) + 1}"
            edge_dict = {
                "id": edge_id,
                "source": row.get("caller") or row.get("source"),
                "target": row.get("receiver") or row.get("target"),
                "type": "CALL",
                "call_count": int(row.get("call_count", 1)),
                "call_duration_sec": int(row.get("call_duration_sec", 120)),
                "weight": 2.5,
                "timestamp": row.get("timestamp", ""),
                "confidence_score": int(row.get("confidence_score", 85)),
                "explain_trail": row.get("explain_trail", "Custom uploaded CDR call record")
            }
            case["edges"].append(edge_dict)
            new_edges_count += 1

    # Rebuild graph engine
    case["engine"] = GraphEngine(case["nodes"], case["edges"], case_id)

    # Blockchain event
    blockchain_ledgers[case_id].record_evidence(
        action_type="CUSTOM_CSV_INGESTION",
        details={
            "suspects_added": new_nodes_count,
            "edges_added": new_edges_count,
            "total_network_size": len(case["nodes"])
        }
    )

    return {
        "status": "SUCCESS",
        "message": f"Successfully ingested {new_nodes_count} new entities and {new_edges_count} new relationships.",
        "total_nodes": len(case["nodes"]),
        "total_edges": len(case["edges"])
    }

@app.get("/api/cases/{case_id}/export/json")
def export_case_json(case_id: str):
    if case_id not in cases_db:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case = cases_db[case_id]
    engine: GraphEngine = case["engine"]
    analytics = engine.calculate_analytics()
    ledger = blockchain_ledgers[case_id]

    payload = {
        "metadata": case["meta"],
        "graph": analytics,
        "blockchain_chain_of_custody": ledger.chain,
        "court_certificate": ledger.generate_court_certificate(case["meta"])
    }
    return payload

# --- Frontend SPA Static Files Mount ---
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Serve specific static files if they exist (favicon, manifest, etc.)
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        # Otherwise fallback to index.html for React SPA client routing
        index_file = os.path.join(frontend_dist, "index.html")
        return FileResponse(index_file)
