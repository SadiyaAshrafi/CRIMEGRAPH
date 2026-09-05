import requests
import json

def test_all():
    print("=== 1. Testing Frontend Static Server ===")
    try:
        r = requests.get("http://localhost:5173", timeout=10)
        print(f"Frontend Status: {r.status_code}, HTML received successfully ({len(r.text)} bytes)")
    except Exception as e:
        print(f"Frontend connection note: {e}")

    print("\n=== 2. Testing Backend Health ===")
    r = requests.get("http://localhost:8000/api/health", timeout=10)
    print("Health:", r.json())

    print("\n=== 3. Testing Case List ===")
    r = requests.get("http://localhost:8000/api/cases", timeout=10)
    cases = r.json()
    print(f"Cases ({len(cases)}):", [c['title'] for c in cases])

    print("\n=== 4. Testing Graph Analytics & Louvain Communities ===")
    r = requests.get("http://localhost:8000/api/cases/shadowweb/graph", timeout=10)
    data = r.json()
    print(f"Nodes: {len(data['nodes'])}, Edges: {len(data['edges'])}, Communities: {len(data['communities'])}")
    top_k = data['analytics']['top_kingpins'][0]
    print(f"Top Kingpin: {top_k['name']} | Composite Centrality: {top_k['centrality_score']}")

    print("\n=== 5. Testing AI Entity Resolution ===")
    r = requests.get("http://localhost:8000/api/cases/shadowweb/entity-resolution", timeout=10)
    er = r.json()
    print(f"Alias Matches Detected: {er['total_matches_found']}")
    for m in er['matches'][:2]:
        print(f"  - {m['source_name']} <-> {m['target_name']} ({m['confidence_percentage']}%)")

    print("\n=== 6. Testing Blockchain Integrity & Merkle Tree ===")
    r = requests.post("http://localhost:8000/api/cases/shadowweb/blockchain/verify", timeout=10)
    print("Blockchain Integrity:", r.json())

    print("\n=== 7. Testing Section 65B Digital Court Certificate ===")
    r = requests.get("http://localhost:8000/api/cases/shadowweb/blockchain/certificate", timeout=10)
    cert = r.json()
    print(f"Certificate ID: {cert['certificate_id']} | Statute: {cert['legal_statute']} | Status: {cert['tamper_status']}")

    print("\n=== 8. Testing AI Dossier Synthesis ===")
    r = requests.post("http://localhost:8000/api/cases/shadowweb/ai/explain", json={
        "case_id": "shadowweb",
        "target_type": "node",
        "target_id": "node_vicky"
    }, timeout=10)
    ai = r.json()
    print(f"AI Title: {ai['title']}")
    print(f"AI Model: {ai['model_used']}")
    print(f"AI Summary: {ai['summary'][:130]}...")

if __name__ == "__main__":
    test_all()
