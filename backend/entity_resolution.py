import difflib
from typing import List, Dict, Any, Tuple
import re

class EntityResolutionEngine:
    def __init__(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]):
        self.nodes = nodes
        self.edges = edges

    def _normalize_string(self, text: str) -> str:
        if not text:
            return ""
        # Lowercase, remove special characters and honorifics
        cleaned = re.sub(r"[^a-zA-Z0-9\s]", "", text.lower())
        tokens = [t for t in cleaned.split() if t not in ["mr", "dr", "shri", "bhai", "the", "fze", "llc", "ltd", "pvt"]]
        return " ".join(tokens)

    def _calculate_string_similarity(self, s1: str, s2: str) -> float:
        norm1 = self._normalize_string(s1)
        norm2 = self._normalize_string(s2)
        if not norm1 or not norm2:
            return 0.0
        if norm1 == norm2:
            return 1.0
        return difflib.SequenceMatcher(None, norm1, norm2).ratio()

    def detect_alias_matches(self) -> List[Dict[str, Any]]:
        """Scans all nodes for duplicate identities, covert aliases, and shared criminal credentials."""
        matches = []
        n_count = len(self.nodes)

        for i in range(n_count):
            for j in range(i + 1, n_count):
                node_a = self.nodes[i]
                node_b = self.nodes[j]

                # Match factors
                matched_rules = []
                score_components = []

                # Factor 1: Name & Alias similarity
                names_a = [node_a["name"]] + node_a.get("aliases", [])
                names_b = [node_b["name"]] + node_b.get("aliases", [])

                max_name_sim = 0.0
                best_name_pair = ("", "")
                for na in names_a:
                    for nb in names_b:
                        sim = self._calculate_string_similarity(na, nb)
                        if sim > max_name_sim:
                            max_name_sim = sim
                            best_name_pair = (na, nb)

                if max_name_sim >= 0.75:
                    matched_rules.append(f"High Name/Alias Similarity ({int(max_name_sim * 100)}% on '{best_name_pair[0]}' ~ '{best_name_pair[1]}')")
                    score_components.append(max_name_sim * 45)

                # Factor 2: Phone number / IMEI overlap
                meta_a = node_a.get("metadata", {})
                meta_b = node_b.get("metadata", {})

                imeis_a = set(meta_a.get("imei_list", []))
                imeis_b = set(meta_b.get("imei_list", []))
                shared_imeis = imeis_a.intersection(imeis_b)
                if shared_imeis:
                    matched_rules.append(f"Hardware Fingerprint Match: Shared Device IMEI ({list(shared_imeis)[0]})")
                    score_components.append(40)

                # Factor 3: Bank Account / PAN / Aadhaar tokens
                pan_a = meta_a.get("pan")
                pan_b = meta_b.get("pan")
                if pan_a and pan_b and pan_a == pan_b:
                    matched_rules.append(f"Financial KYC Token Match: Common PAN ({pan_a})")
                    score_components.append(45)

                # Factor 4: Common direct co-accused or frequent call connection
                direct_links = [
                    e for e in self.edges
                    if (e["source"] == node_a["id"] and e["target"] == node_b["id"]) or
                       (e["source"] == node_b["id"] and e["target"] == node_a["id"])
                ]
                if direct_links:
                    matched_rules.append(f"Direct Operational Edge: Active {direct_links[0]['type']} connection")
                    score_components.append(15)

                # Factor 5: Shared Shell Company Directorship
                if node_a.get("type") == "person" and node_b.get("type") == "shell_company":
                    directors = node_b.get("metadata", {}).get("directors", [])
                    for d in directors:
                        if self._calculate_string_similarity(node_a["name"], d) > 0.7:
                            matched_rules.append(f"Corporate Registry Match: Nominee Director of {node_b['name']}")
                            score_components.append(35)

                if matched_rules and sum(score_components) >= 35:
                    total_confidence = int(min(99, sum(score_components)))
                    
                    matches.append({
                        "id": f"alias_match_{node_a['id']}_{node_b['id']}",
                        "source_entity_id": node_a["id"],
                        "source_name": node_a["name"],
                        "source_role": node_a.get("role", "Suspect"),
                        "source_risk": node_a.get("risk_score", 50),
                        "target_entity_id": node_b["id"],
                        "target_name": node_b["name"],
                        "target_role": node_b.get("role", "Suspect"),
                        "target_risk": node_b.get("risk_score", 50),
                        "similarity_score": round(max_name_sim, 2),
                        "confidence_percentage": total_confidence,
                        "matched_rules": matched_rules,
                        "status": "DETECTED",
                        "recommended_action": "Merge Identities & Consolidate Graph Edges" if total_confidence >= 80 else "Flag for Secondary Analyst Review",
                        "explain_trail": f"AI identity matcher detected strong biometric, telecom or corporate alignment across {len(matched_rules)} independent investigative parameters."
                    })

        # Sort matches by confidence
        return sorted(matches, key=lambda x: x["confidence_percentage"], reverse=True)
