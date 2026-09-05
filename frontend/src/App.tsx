import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { GraphCanvas } from './components/GraphCanvas';
import { EntityInspector } from './components/EntityInspector';
import { TimelineScrubber } from './components/TimelineScrubber';
import { EntityResolutionView } from './components/EntityResolutionView';
import { BlockchainLedgerView } from './components/BlockchainLedgerView';
import { ReportBuilderView } from './components/ReportBuilderView';
import { SettingsView } from './components/SettingsView';
import { 
  CaseMetadata, 
  GraphNode, 
  GraphEdge, 
  CommunityCluster, 
  PredictedLink, 
  GraphAnalytics 
} from './types';
import { api } from './services/api';
import { Sliders, Filter, Sparkles, Layers, ShieldAlert } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & Case State
  const [currentTab, setCurrentTab] = useState<string>('graph');
  const [cases, setCases] = useState<CaseMetadata[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('shadowweb');
  const [currentCase, setCurrentCase] = useState<CaseMetadata | undefined>(undefined);

  // Graph Data
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [communities, setCommunities] = useState<CommunityCluster[]>([]);
  const [predictedLinks, setPredictedLinks] = useState<PredictedLink[]>([]);
  const [analytics, setAnalytics] = useState<GraphAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inspector & Selection
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Graph Visual Filters
  const [filterRiskMin, setFilterRiskMin] = useState<number>(0);
  const [filterEdgeTypes, setFilterEdgeTypes] = useState<string[]>([]);
  const [filterHops, setFilterHops] = useState<number>(4); // 4 = All
  const [showHulls, setShowHulls] = useState<boolean>(true);
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);

  // Timeline
  const [currentDateIndex, setCurrentDateIndex] = useState<number>(0);

  // System Settings
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.7-flash');

  // Load Cases List
  useEffect(() => {
    api.getCases()
      .then(data => {
        setCases(data);
        if (data.length > 0) {
          setSelectedCaseId(data[0].id);
          setCurrentCase(data[0]);
        }
      })
      .catch(err => console.error('Failed to load cases:', err));
  }, []);

  // Load Graph Data for Selected Case
  const loadCaseGraph = async (caseId: string) => {
    setIsLoading(true);
    try {
      const data = await api.getCaseGraph(caseId);
      setCurrentCase(data.meta);
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
      setCommunities(data.communities || []);
      setPredictedLinks(data.predicted_links || []);
      setAnalytics(data.analytics || null);
      setSelectedNode(null);
    } catch (err) {
      console.error('Failed to load graph data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCaseId) {
      loadCaseGraph(selectedCaseId);
    }
  }, [selectedCaseId]);

  // Unique chronological timestamps for timeline
  const uniqueTimestamps = React.useMemo(() => {
    const tsSet = new Set<string>();
    edges.forEach(e => {
      if (e.timestamp) tsSet.add(e.timestamp.split(' ')[0]);
    });
    return Array.from(tsSet).sort();
  }, [edges]);

  // Filter edges based on timeline scrubber
  const timeFilteredEdges = React.useMemo(() => {
    if (uniqueTimestamps.length === 0) return edges;
    const maxDate = uniqueTimestamps[currentDateIndex] || uniqueTimestamps[uniqueTimestamps.length - 1];
    return edges.filter(e => {
      if (!e.timestamp) return true;
      const d = e.timestamp.split(' ')[0];
      return d <= maxDate;
    });
  }, [edges, uniqueTimestamps, currentDateIndex]);

  const handleSelectNodeById = (nodeId: string) => {
    const target = nodes.find(n => n.id === nodeId);
    if (target) {
      setSelectedNode(target);
      setCurrentTab('graph');
    }
  };

  const handleFlagToggled = (nodeId: string, isFlagged: boolean) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, is_flagged: isFlagged } : n));
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({ ...selectedNode, is_flagged: isFlagged });
    }
  };

  const toggleEdgeTypeFilter = (type: string) => {
    setFilterEdgeTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      backgroundColor: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        cases={cases}
        selectedCaseId={selectedCaseId}
        onSelectCase={(id) => {
          setSelectedCaseId(id);
        }}
        isDemoMode={isDemoMode}
      />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Top Navigation Bar */}
        <Navbar
          currentCase={currentCase}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isDarkTheme={isDarkTheme}
          setIsDarkTheme={setIsDarkTheme}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          onSelectNodeById={handleSelectNodeById}
          nodes={nodes}
        />

        {/* Tab Router Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {currentTab === 'home' && (
            <HomeView
              caseMeta={currentCase}
              nodes={nodes}
              edges={edges}
              onNavigateTab={setCurrentTab}
              onSelectNode={(node) => setSelectedNode(node)}
            />
          )}

          {currentTab === 'graph' && (
            <div style={{ flex: 1, display: 'flex', height: '100%', position: 'relative', overflow: 'hidden' }}>
              {/* Main Graph View */}
              <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                {/* Top Filter Controls Bar */}
                <div 
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: selectedNode ? '400px' : '24px',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 10,
                    transition: 'right 0.2s ease'
                  }}
                >
                  <button
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className={showFilterPanel ? "btn-primary" : "btn-secondary"}
                    style={{ fontSize: '11px', padding: '6px 10px' }}
                  >
                    <Sliders size={13} />
                    Graph Controls
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>Min Risk:</span>
                    <input
                      type="range"
                      min={0}
                      max={90}
                      step={10}
                      value={filterRiskMin}
                      onChange={(e) => setFilterRiskMin(Number(e.target.value))}
                      style={{ width: '70px', accentColor: '#ef4444' }}
                    />
                    <span style={{ fontWeight: 700, minWidth: '24px', color: filterRiskMin >= 75 ? '#ef4444' : 'var(--text-primary)' }}>
                      {filterRiskMin}+
                    </span>
                  </div>

                  <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-subtle)' }} />

                  {/* Quick Edge Type Toggles */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {[
                      { id: 'CALL', label: 'Calls', color: '#38bdf8' },
                      { id: 'FUND_TRANSFER', label: 'Transfers', color: '#10b981' },
                      { id: 'CRYPTO_TRANSFER', label: 'Crypto', color: '#a855f7' },
                      { id: 'SHELL_DIRECTOR', label: 'Shells', color: '#f59e0b' }
                    ].map(et => {
                      const isActive = filterEdgeTypes.length === 0 || filterEdgeTypes.includes(et.id);
                      return (
                        <button
                          key={et.id}
                          onClick={() => toggleEdgeTypeFilter(et.id)}
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '3px 7px',
                            borderRadius: '4px',
                            border: `1px solid ${isActive ? et.color : 'var(--border-subtle)'}`,
                            backgroundColor: isActive ? 'rgba(0,0,0,0.3)' : 'transparent',
                            color: isActive ? et.color : 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          {et.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Extended Graph Controls Panel */}
                {showFilterPanel && (
                  <div 
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      top: '70px',
                      right: selectedNode ? '400px' : '24px',
                      padding: '16px',
                      zIndex: 15,
                      width: '280px'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                      Degree of Separation (Hops)
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                      {[
                        { hops: 1, label: '1-Hop' },
                        { hops: 2, label: '2-Hops' },
                        { hops: 3, label: '3-Hops' },
                        { hops: 4, label: 'All' }
                      ].map(h => (
                        <button
                          key={h.hops}
                          onClick={() => setFilterHops(h.hops)}
                          className={filterHops === h.hops ? "btn-primary" : "btn-secondary"}
                          style={{ flex: 1, fontSize: '11px', padding: '5px 0', justifyContent: 'center' }}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
                      Graph Layers
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={showHulls}
                          onChange={(e) => setShowHulls(e.target.checked)}
                          style={{ accentColor: 'var(--text-accent)' }}
                        />
                        <span>Louvain Criminal Cell Hulls</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={showParticles}
                          onChange={(e) => setShowParticles(e.target.checked)}
                          style={{ accentColor: 'var(--text-accent)' }}
                        />
                        <span>Real-Time Fund/Call Particle Flow</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Graph SVG Canvas */}
                <GraphCanvas
                  nodes={nodes}
                  edges={timeFilteredEdges}
                  communities={communities}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                  hoveredNode={hoveredNode}
                  setHoveredNode={setHoveredNode}
                  filterRiskMin={filterRiskMin}
                  filterEdgeTypes={filterEdgeTypes}
                  filterHops={filterHops}
                  showHulls={showHulls}
                  setShowHulls={setShowHulls}
                  showParticles={showParticles}
                  setShowParticles={setShowParticles}
                />

                {/* Timeline Scrubber */}
                {uniqueTimestamps.length > 1 && (
                  <TimelineScrubber
                    edges={edges}
                    currentDateIndex={currentDateIndex}
                    setCurrentDateIndex={setCurrentDateIndex}
                    uniqueTimestamps={uniqueTimestamps}
                  />
                )}
              </div>

              {/* Right Entity Inspector Slideout */}
              {selectedNode && (
                <EntityInspector
                  caseId={selectedCaseId}
                  node={selectedNode}
                  edges={edges}
                  nodes={nodes}
                  onClose={() => setSelectedNode(null)}
                  onFlagToggled={handleFlagToggled}
                  onSelectConnectedNode={handleSelectNodeById}
                />
              )}
            </div>
          )}

          {currentTab === 'entity-resolution' && (
            <EntityResolutionView
              caseId={selectedCaseId}
              nodes={nodes}
              onMergeComplete={() => loadCaseGraph(selectedCaseId)}
            />
          )}

          {currentTab === 'blockchain' && (
            <BlockchainLedgerView
              caseId={selectedCaseId}
            />
          )}

          {currentTab === 'reports' && (
            <ReportBuilderView
              caseMeta={currentCase}
              nodes={nodes}
              edges={edges}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              caseId={selectedCaseId}
              isDemoMode={isDemoMode}
              setIsDemoMode={setIsDemoMode}
              onDataIngested={() => loadCaseGraph(selectedCaseId)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
export default App;
