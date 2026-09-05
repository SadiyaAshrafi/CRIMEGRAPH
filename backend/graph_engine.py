import networkx as nx
from typing import List, Dict, Any, Tuple, Optional
import os

class GraphEngine:
    def __init__(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]], case_id: str = "shadowweb"):
        self.case_id = case_id
        self.raw_nodes = {n["id"]: dict(n) for n in nodes}
        self.raw_edges = [dict(e) for e in edges]
        self.G = nx.Graph()
        self.DiG = nx.DiGraph()
        self._build_graph()

    def _build_graph(self):
        self.G.clear()
        self.DiG.clear()

        # Add nodes
        for node_id, node_data in self.raw_nodes.items():
            self.G.add_node(node_id, **node_data)
            self.DiG.add_node(node_id, **node_data)

        # Add edges
        for edge in self.raw_edges:
            src = edge["source"]
            tgt = edge["target"]
            if src in self.raw_nodes and tgt in self.raw_nodes:
                self.G.add_edge(src, tgt, **edge)
                self.DiG.add_edge(src, tgt, **edge)

    def calculate_analytics(self) -> Dict[str, Any]:
        """Calculates centralities, PageRank, communities, and syndicate risk distribution."""
        if len(self.G.nodes) == 0:
            return {}

        # 1. Centralities
        deg_centrality = nx.degree_centrality(self.G)
        between_centrality = nx.betweenness_centrality(self.G, weight="weight")
        closeness_centrality = nx.closeness_centrality(self.G)
        
        try:
            pagerank = nx.pagerank(self.G, weight="weight", max_iter=200)
        except Exception:
            pagerank = {n: 1.0 / len(self.G.nodes) for n in self.G.nodes}

        # 2. Community Detection (Louvain / Greedy Modularity)
        communities = []
        try:
            mod_communities = list(nx.community.greedy_modularity_communities(self.G))
            comm_names = ["Leadership & Hawala Core", "Mule & Smurfing Network", "Logistics & Physical Transit", "Tech & Cyber Support"]
            
            for idx, comm in enumerate(mod_communities):
                c_name = comm_names[idx] if idx < len(comm_names) else f"Cell #{idx + 1}"
                communities.append({
                    "community_id": idx,
                    "name": c_name,
                    "node_ids": list(comm),
                    "size": len(comm)
                })
        except Exception:
            communities = [{"community_id": 0, "name": "Primary Syndicate", "node_ids": list(self.G.nodes), "size": len(self.G.nodes)}]

        # 3. Update node attributes
        node_comm_map = {}
        for c in communities:
            for n_id in c["node_ids"]:
                node_comm_map[n_id] = (c["community_id"], c["name"])

        enriched_nodes = []
        for n_id, n_data in self.raw_nodes.items():
            deg = round(deg_centrality.get(n_id, 0.0), 3)
            bet = round(between_centrality.get(n_id, 0.0), 3)
            pr = round(pagerank.get(n_id, 0.0), 3)
            close = round(closeness_centrality.get(n_id, 0.0), 3)
            
            comm_info = node_comm_map.get(n_id, (0, "General"))
            
            # Composite Centrality Score (0.0 to 1.0 normalized)
            composite_centrality = round(0.4 * bet + 0.35 * pr + 0.25 * deg, 3)

            n_copy = dict(n_data)
            n_copy["centrality_score"] = composite_centrality
            n_copy["betweenness"] = bet
            n_copy["pagerank"] = pr
            n_copy["degree_centrality"] = deg
            n_copy["closeness"] = close
            n_copy["community_id"] = comm_info[0]
            n_copy["community_name"] = comm_info[1]
            
            # Keep orange/red for high priority
            if n_copy.get("risk_score", 0) >= 90:
                n_copy["risk_level"] = "CRITICAL"
            elif n_copy.get("risk_score", 0) >= 75:
                n_copy["risk_level"] = "HIGH"
            elif n_copy.get("risk_score", 0) >= 50:
                n_copy["risk_level"] = "MEDIUM"
            else:
                n_copy["risk_level"] = "LOW"

            enriched_nodes.append(n_copy)

        # 4. Predict Hidden Links (Adamic-Adar / Jaccard)
        predicted_links = self.predict_hidden_links()

        analytics_summary = {
            "total_nodes": len(enriched_nodes),
            "total_edges": len(self.raw_edges),
            "graph_density": round(nx.density(self.G), 4),
            "is_connected": nx.is_connected(self.G) if len(self.G.nodes) > 0 else False,
            "top_kingpins": sorted(enriched_nodes, key=lambda x: x["centrality_score"], reverse=True)[:3],
            "communities_count": len(communities),
            "predicted_links_count": len(predicted_links)
        }

        return {
            "nodes": enriched_nodes,
            "edges": self.raw_edges,
            "communities": communities,
            "predicted_links": predicted_links,
            "analytics": analytics_summary
        }

    def predict_hidden_links(self) -> List[Dict[str, Any]]:
        """Surface non-obvious hidden connections using topological link prediction."""
        predictions = []
        if len(self.G.nodes) < 3:
            return predictions

        # Non-edges in undirected graph
        non_edges = list(nx.non_edges(self.G))
        if not non_edges:
            return predictions

        try:
            # Jaccard Coefficient
            jaccard_scores = list(nx.jaccard_coefficient(self.G, non_edges))
            # Sort by score
            top_jaccard = sorted(jaccard_scores, key=lambda x: x[2], reverse=True)[:5]

            for u, v, score in top_jaccard:
                if score > 0.15:
                    u_node = self.raw_nodes.get(u, {})
                    v_node = self.raw_nodes.get(v, {})
                    common_nbrs = list(nx.common_neighbors(self.G, u, v))
                    common_names = [self.raw_nodes.get(n, {}).get("name", n) for n in common_nbrs]

                    conf = int(min(98, round(score * 120 + len(common_nbrs) * 15)))
                    predictions.append({
                        "id": f"pred_{u}_{v}",
                        "source": u,
                        "target": v,
                        "source_name": u_node.get("name", u),
                        "target_name": v_node.get("name", v),
                        "probability_score": round(score, 3),
                        "confidence_percentage": conf,
                        "common_intermediaries": common_names,
                        "reasoning": f"Shares {len(common_nbrs)} critical intermediary nodes ({', '.join(common_names[:2])}) with high transaction & communication overlap."
                    })
        except Exception:
            pass

        return predictions

    def get_shortest_path(self, source_id: str, target_id: str) -> Optional[Dict[str, Any]]:
        """Trace the money laundering chain or command line between any 2 suspects."""
        if not self.G.has_node(source_id) or not self.G.has_node(target_id):
            return None

        try:
            path_nodes = nx.shortest_path(self.G, source=source_id, target=target_id)
            path_edges = []
            for i in range(len(path_nodes) - 1):
                u = path_nodes[i]
                v = path_nodes[i+1]
                edge_data = self.G.get_edge_data(u, v)
                path_edges.append({
                    "source": u,
                    "target": v,
                    "details": edge_data
                })

            return {
                "source": source_id,
                "target": target_id,
                "hops": len(path_nodes) - 1,
                "path_node_ids": path_nodes,
                "path_nodes": [self.raw_nodes.get(nid, {}) for nid in path_nodes],
                "path_edges": path_edges
            }
        except nx.NetworkXNoPath:
            return None

    def get_ego_subgraph(self, center_node_id: str, radius: int = 1) -> Dict[str, Any]:
        """Filters network by N-degrees of separation around a target suspect."""
        if not self.G.has_node(center_node_id):
            return {"nodes": [], "edges": []}

        subgraph = nx.ego_graph(self.G, n=center_node_id, radius=radius)
        sub_nodes = [self.raw_nodes[nid] for nid in subgraph.nodes if nid in self.raw_nodes]
        sub_edges = [e for e in self.raw_edges if e["source"] in subgraph.nodes and e["target"] in subgraph.nodes]

        return {
            "center_node": center_node_id,
            "radius": radius,
            "nodes": sub_nodes,
            "edges": sub_edges,
            "total_nodes": len(sub_nodes),
            "total_edges": len(sub_edges)
        }
