# 🛡️ CrimeGraph (CrimeScope)
### Crimescope AI Criminal Network Intelligence & Forensic Graph Analytics*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![D3.js](https://img.shields.io/badge/Graph_Vis-D3.js_v7-F9A03C.svg?style=flat-square&logo=d3.js&logoColor=white)](https://d3js.org/)
[![NetworkX](https://img.shields.io/badge/Graph_Engine-NetworkX-blue.svg?style=flat-square)](https://networkx.org/)
[![Google Gemini](https://img.shields.io/badge/AI_Engine-Gemini_LLM-8E75B2.svg?style=flat-square&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Blockchain](https://img.shields.io/badge/Evidence_Custody-SHA--256_Merkle-000000.svg?style=flat-square)](https://en.wikipedia.org/wiki/Merkle_tree)
## 📌 Executive Summary
**CrimeGraph** is an enterprise-grade criminal intelligence platform designed for law enforcement and cybercrime investigative agencies. It ingests multi-source data (Call Data Records, FIU-IND financial trails, FIRs, and cyber logs), maps complex syndicated crime networks into an interactive knowledge graph, resolves covert aliases, runs centrality algorithms to detect kingpins, and cryptographically preserves evidence chains.

## ⚡ Key Highlights for Judges

| Feature | Description | Impact |
| :--- | :--- | :--- |
| 🕸️ **Interactive D3 Graph Canvas** | Force-directed graph visualization with real-time physics, temporal time-scrubbing, and risk heatmaps. | Uncovers hidden connections across thousands of CDR/banking edges. |
| 👑 **Kingpin & Mule Detection** | NetworkX-powered PageRank, Degree, Closeness, and Betweenness Centrality metrics. | Identifies syndicate leaders and money mules automatically. |
| 🔍 **AI Entity Resolution** | Fuzzy string matching + multi-factor credential clustering (phone, PAN, IMEI, accounts). | De-anonymizes criminals using multiple aliases and fake passports. |
| 🤖 **GenAI Forensic Dossiers** | Gemini AI synthesizes actionable dossiers, relationship rationales, and raid recommendations. | Reduces intelligence briefing prep from days to seconds. |
| ⛓️ **Tamper-Proof Custody Ledger** | Cryptographic SHA-256 Merkle-tree blockchain audit log (Section 65B / BSA compliant). | Ensures digital evidence is admissible in court. |
| 📑 **Court-Ready PDF Reports** | One-click exportable intelligence dossiers with graph snapshots and hash proofs. | Provides ready-to-present documentation for prosecutors. |

---

## 🏛️ System Architecture

```mermaid
flowchart LR
    A[📂 Ingestion Engine<br/>CDR, FIU, CCTNS, FIRs] --> B[⚙️ Core Graph Engine<br/>NetworkX + Centrality Analysis]
    A --> C[🔍 Entity Resolution<br/>Fuzzy Matching & Alias Linking]
    
    B --> D[🤖 AI Forensic Synthesizer<br/>Gemini 3.7 / Heuristics]
    C --> D
    
    D --> E[⛓️ Blockchain Ledger<br/>SHA-256 Merkle Audit Chain]
    B & C & D & E --> F[🖥️ React 19 + D3.js UI<br/>Interactive Graph & Case Room]

**Technology Stack**
Frontend: React 19, TypeScript, Vite, D3.js (v7), Lucide Icons, jsPDF / html2canvas
Backend API: Python 3.11+, FastAPI, Uvicorn, Pydantic v2
Graph & ML Analytics: NetworkX, Scipy, Scikit-learn (Louvain Modularity, Centralities)
AI & Forensics: Google Gemini API + Specialized Law Enforcement Heuristics Engine
Security & Integrity: SHA-256 Cryptographic Block Hashing & Merkle Root Tree

