import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Layers, 
  Play, 
  Pause, 
  Filter, 
  Eye, 
  ShieldAlert,
  Sparkles,
  Sliders
} from 'lucide-react';
import { GraphNode, GraphEdge, CommunityCluster } from '../types';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  communities: CommunityCluster[];
  selectedNode: GraphNode | null;
  onSelectNode: (node: GraphNode | null) => void;
  hoveredNode: GraphNode | null;
  setHoveredNode: (node: GraphNode | null) => void;
  filterRiskMin: number;
  filterEdgeTypes: string[];
  filterHops: number;
  showHulls: boolean;
  setShowHulls: (show: boolean) => void;
  showParticles: boolean;
  setShowParticles: (show: boolean) => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  communities,
  selectedNode,
  onSelectNode,
  hoveredNode,
  setHoveredNode,
  filterRiskMin,
  filterEdgeTypes,
  filterHops,
  showHulls,
  setShowHulls,
  showParticles,
  setShowParticles
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Filtered nodes & edges based on controls
  const { visibleNodes, visibleEdges } = React.useMemo(() => {
    // 1. Filter by minimum risk
    let nList = nodes.filter(n => (n.risk_score || 0) >= filterRiskMin);
    let nIds = new Set(nList.map(n => n.id));

    // 2. Filter edges by edge type and node presence
    let eList = edges.filter(e => {
      const srcId = typeof e.source === 'object' ? (e.source as any).id : e.source;
      const tgtId = typeof e.target === 'object' ? (e.target as any).id : e.target;
      return nIds.has(srcId) && nIds.has(tgtId) && (filterEdgeTypes.length === 0 || filterEdgeTypes.includes(e.type));
    });

    // 3. Degree of separation filter around selected node
    if (selectedNode && filterHops < 4) {
      const reachable = new Set<string>([selectedNode.id]);
      let currentHop = new Set<string>([selectedNode.id]);

      for (let h = 0; h < filterHops; h++) {
        const nextHop = new Set<string>();
        eList.forEach(e => {
          const s = typeof e.source === 'object' ? (e.source as any).id : e.source;
          const t = typeof e.target === 'object' ? (e.target as any).id : e.target;
          if (currentHop.has(s) && !reachable.has(t)) {
            reachable.add(t);
            nextHop.add(t);
          }
          if (currentHop.has(t) && !reachable.has(s)) {
            reachable.add(s);
            nextHop.add(s);
          }
        });
        currentHop = nextHop;
      }

      nList = nList.filter(n => reachable.has(n.id));
      nIds = new Set(nList.map(n => n.id));
      eList = eList.filter(e => {
        const s = typeof e.source === 'object' ? (e.source as any).id : e.source;
        const t = typeof e.target === 'object' ? (e.target as any).id : e.target;
        return nIds.has(s) && nIds.has(t);
      });
    }

    return { visibleNodes: nList, visibleEdges: eList };
  }, [nodes, edges, filterRiskMin, filterEdgeTypes, filterHops, selectedNode]);

  // Main D3 Simulation Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || visibleNodes.length === 0) return;

    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clean slate

    // Definitions (Glow filters, Arrow markers)
    const defs = svg.append('defs');

    // Arrow markers for directed edges
    const markerColors = [
      { id: 'arrow-call', color: '#38bdf8' },
      { id: 'arrow-fund', color: '#10b981' },
      { id: 'arrow-crypto', color: '#a855f7' },
      { id: 'arrow-shell', color: '#f59e0b' },
      { id: 'arrow-default', color: '#94a3b8' }
    ];

    markerColors.forEach(m => {
      defs.append('marker')
        .attr('id', m.id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 28) // offset past node circle
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', m.color);
    });

    // Root Group for Zoom & Pan
    const g = svg.append('g').attr('class', 'graph-root');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Simulation Data Clone
    const simNodes = visibleNodes.map(d => ({ ...d }));
    const nodeMap = new Map(simNodes.map(n => [n.id, n]));

    const simLinks = visibleEdges
      .map(e => {
        const sId = typeof e.source === 'object' ? (e.source as any).id : e.source;
        const tId = typeof e.target === 'object' ? (e.target as any).id : e.target;
        return {
          ...e,
          source: nodeMap.get(sId) || sId,
          target: nodeMap.get(tId) || tId
        };
      })
      .filter(l => typeof l.source === 'object' && typeof l.target === 'object');

    // D3 Simulation Setup
    const simulation = d3.forceSimulation(simNodes as any)
      .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance(140).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-480))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.08))
      .force('collision', d3.forceCollide().radius(45).strength(0.7));

    simulationRef.current = simulation;

    // Layer 1: Community Hulls
    const hullGroup = g.append('g').attr('class', 'hulls-layer');

    // Layer 2: Edges
    const linkGroup = g.append('g').attr('class', 'links-layer');
    const links = linkGroup.selectAll('.graph-link')
      .data(simLinks)
      .enter()
      .append('g')
      .attr('class', 'graph-link');

    // Link Lines
    const linkLines = links.append('path')
      .attr('fill', 'none')
      .attr('stroke-width', (d: any) => Math.min(6, Math.max(2, (d.weight || 1.5) * 1.2)))
      .attr('stroke', (d: any) => {
        if (d.type === 'CALL') return '#38bdf8';
        if (d.type === 'FUND_TRANSFER') return '#10b981';
        if (d.type === 'CRYPTO_TRANSFER') return '#a855f7';
        if (d.type === 'SHELL_DIRECTOR') return '#f59e0b';
        return '#64748b';
      })
      .attr('stroke-dasharray', (d: any) => d.type === 'CALL' ? '5,4' : 'none')
      .attr('stroke-opacity', 0.65)
      .attr('marker-end', (d: any) => {
        if (d.type === 'CALL') return 'url(#arrow-call)';
        if (d.type === 'FUND_TRANSFER') return 'url(#arrow-fund)';
        if (d.type === 'CRYPTO_TRANSFER') return 'url(#arrow-crypto)';
        if (d.type === 'SHELL_DIRECTOR') return 'url(#arrow-shell)';
        return 'url(#arrow-default)';
      });

    // Link Labels (Amounts / Calls)
    const linkLabels = links.append('text')
      .attr('font-size', '9px')
      .attr('font-family', 'var(--font-mono)')
      .attr('fill', '#94a3b8')
      .attr('text-anchor', 'middle')
      .attr('dy', -4)
      .text((d: any) => {
        if (d.amount_inr) return `₹${(d.amount_inr / 1e7).toFixed(1)}Cr`;
        if (d.call_count) return `${d.call_count} calls`;
        return d.type?.replace('_', ' ');
      });

    // Layer 3: Animated Edge Particles
    const particleGroup = g.append('g').attr('class', 'particles-layer');
    let particles: any[] = [];
    if (showParticles) {
      simLinks.forEach((l: any, idx) => {
        particles.push({ link: l, progress: (idx * 0.23) % 1.0, speed: 0.008 });
      });
    }

    const particleCircles = particleGroup.selectAll('.edge-particle')
      .data(particles)
      .enter()
      .append('circle')
      .attr('class', 'edge-particle')
      .attr('r', 3.5)
      .attr('fill', (d: any) => {
        if (d.link.type === 'FUND_TRANSFER') return '#34d399';
        if (d.link.type === 'CRYPTO_TRANSFER') return '#c084fc';
        return '#38bdf8';
      })
      .attr('filter', 'drop-shadow(0 0 4px #38bdf8)');

    // Layer 4: Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes-layer');
    const nodeElements = nodeGroup.selectAll('.graph-node')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'graph-node')
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => {
        event.stopPropagation();
        onSelectNode(d);
      })
      .on('mouseenter', (event, d: any) => {
        setHoveredNode(d);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      });

    // Drag behavior
    const drag = d3.drag<SVGGElement, any>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeElements.call(drag as any);

    // Node Rings (Pulsating for critical)
    nodeElements.append('circle')
      .attr('r', (d: any) => d.risk_level === 'CRITICAL' ? 24 : d.risk_level === 'HIGH' ? 20 : 16)
      .attr('fill', (d: any) => {
        if (d.risk_level === 'CRITICAL') return 'rgba(239, 68, 68, 0.2)';
        if (d.risk_level === 'HIGH') return 'rgba(249, 115, 22, 0.2)';
        if (d.risk_level === 'MEDIUM') return 'rgba(56, 189, 248, 0.15)';
        return 'rgba(16, 185, 129, 0.15)';
      })
      .attr('stroke', (d: any) => {
        if (d.risk_level === 'CRITICAL') return '#ef4444';
        if (d.risk_level === 'HIGH') return '#f97316';
        if (d.risk_level === 'MEDIUM') return '#38bdf8';
        return '#10b981';
      })
      .attr('stroke-width', (d: any) => selectedNode?.id === d.id ? 3 : 1.5)
      .attr('stroke-dasharray', (d: any) => d.is_flagged ? '4,2' : 'none');

    // Inner Core Circle
    nodeElements.append('circle')
      .attr('r', (d: any) => d.risk_level === 'CRITICAL' ? 14 : 11)
      .attr('fill', (d: any) => {
        if (d.risk_level === 'CRITICAL') return '#ef4444';
        if (d.risk_level === 'HIGH') return '#f97316';
        if (d.risk_level === 'MEDIUM') return '#0284c7';
        return '#059669';
      });

    // Node Labels
    const labels = nodeElements.append('g')
      .attr('transform', 'translate(0, 28)');

    // Label Background
    labels.append('rect')
      .attr('x', (d: any) => -((d.label || d.name).length * 3.5 + 8))
      .attr('y', -10)
      .attr('width', (d: any) => (d.label || d.name).length * 7 + 16)
      .attr('height', 18)
      .attr('rx', 4)
      .attr('fill', 'rgba(13, 20, 36, 0.85)')
      .attr('stroke', 'rgba(255,255,255,0.1)')
      .attr('stroke-width', 0.5);

    // Label Text
    labels.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 2)
      .attr('fill', '#f8fafc')
      .attr('font-size', '10px')
      .attr('font-weight', 600)
      .attr('font-family', 'var(--font-sans)')
      .text((d: any) => d.label || d.name);

    // Tick Function
    simulation.on('tick', () => {
      // 1. Update Link Lines (Curved paths)
      linkLines.attr('d', (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.3;
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      // 2. Update Link Labels
      linkLabels.attr('transform', (d: any) => {
        const x = (d.source.x + d.target.x) / 2;
        const y = (d.source.y + d.target.y) / 2;
        return `translate(${x}, ${y})`;
      });

      // 3. Update Nodes
      nodeElements.attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);

      // 4. Update Community Hulls
      if (showHulls && communities.length > 0) {
        hullGroup.selectAll('*').remove();
        const hullColors = ['rgba(56, 189, 248, 0.08)', 'rgba(249, 115, 22, 0.08)', 'rgba(168, 85, 247, 0.08)', 'rgba(16, 185, 129, 0.08)'];
        const hullBorders = ['rgba(56, 189, 248, 0.3)', 'rgba(249, 115, 22, 0.3)', 'rgba(168, 85, 247, 0.3)', 'rgba(16, 185, 129, 0.3)'];

        communities.forEach((comm, cIdx) => {
          const commNodes = simNodes.filter(n => comm.node_ids.includes(n.id) && n.x && n.y);
          if (commNodes.length >= 3) {
            const points: [number, number][] = commNodes.map(n => [n.x!, n.y!]);
            const hull = d3.polygonHull(points);
            if (hull) {
              // Expand hull slightly for padding
              hullGroup.append('path')
                .datum(hull)
                .attr('d', (d: any) => `M${d.join('L')}Z`)
                .attr('fill', hullColors[cIdx % hullColors.length])
                .attr('stroke', hullBorders[cIdx % hullBorders.length])
                .attr('stroke-width', 1.5)
                .attr('stroke-dasharray', '6,4');

              // Hull Label
              const center = d3.polygonCentroid(hull);
              hullGroup.append('text')
                .attr('x', center[0])
                .attr('y', center[1] - 40)
                .attr('text-anchor', 'middle')
                .attr('fill', 'var(--text-muted)')
                .attr('font-size', '11px')
                .attr('font-weight', 700)
                .text(comm.name);
            }
          }
        });
      }
    });

    // Particle Animation Loop
    let animFrameId: number;
    const animateParticles = () => {
      if (showParticles) {
        particles.forEach(p => {
          p.progress += p.speed;
          if (p.progress >= 1.0) p.progress = 0;
        });

        particleCircles.attr('transform', (d: any) => {
          const s = d.link.source;
          const t = d.link.target;
          if (s.x && s.y && t.x && t.y) {
            // Curvature approximation
            const curX = s.x + (t.x - s.x) * d.progress;
            const curY = s.y + (t.y - s.y) * d.progress;
            return `translate(${curX}, ${curY})`;
          }
          return 'translate(0, 0)';
        });
      }
      animFrameId = requestAnimationFrame(animateParticles);
    };

    if (showParticles) {
      animateParticles();
    }

    // Click outside to deselect
    svg.on('click', () => onSelectNode(null));

    return () => {
      simulation.stop();
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [visibleNodes, visibleEdges, showHulls, showParticles, selectedNode]);

  // Zoom Controls
  const handleZoom = (scaleFactor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, scaleFactor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div 
      ref={containerRef} 
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden'
      }}
    >
      {/* Background Cyber Grid */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.04) 0%, transparent 60%),
          linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 36px 36px, 36px 36px',
        pointerEvents: 'none'
      }} />

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />

      {/* Floating Canvas Control Toolbar */}
      <div 
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 10
        }}
      >
        <button 
          onClick={() => handleZoom(1.3)} 
          className="btn-secondary" 
          style={{ padding: '8px' }}
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button 
          onClick={() => handleZoom(0.7)} 
          className="btn-secondary" 
          style={{ padding: '8px' }}
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button 
          onClick={handleResetZoom} 
          className="btn-secondary" 
          style={{ padding: '8px' }}
          title="Reset Graph View"
        >
          <Maximize2 size={16} />
        </button>

        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />

        <button 
          onClick={() => setShowHulls(!showHulls)} 
          className={showHulls ? "btn-primary" : "btn-secondary"}
          style={{ padding: '8px' }}
          title="Toggle Louvain Criminal Cell Hulls"
        >
          <Layers size={16} />
        </button>
        <button 
          onClick={() => setShowParticles(!showParticles)} 
          className={showParticles ? "btn-primary" : "btn-secondary"}
          style={{ padding: '8px' }}
          title="Toggle Real-Time Fund/Call Particles"
        >
          <Sparkles size={16} />
        </button>
      </div>

      {/* Floating Network Legend */}
      <div 
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '12px 16px',
          zIndex: 10,
          pointerEvents: 'auto'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
          Threat Priority Matrix
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
            <span>Critical Kingpin (Risk 90-100)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f97316', boxShadow: '0 0 6px #f97316' }} />
            <span>High Risk Operator (75-89)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
            <span>Mule / Front Entity (50-74)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span>Low Risk / Associate (&lt;50)</span>
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredNode && (
        <div 
          className="glass-panel"
          style={{
            position: 'absolute',
            bottom: '24px',
            right: selectedNode ? '400px' : '24px',
            padding: '12px 16px',
            zIndex: 10,
            maxWidth: '300px',
            pointerEvents: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
              {hoveredNode.name}
            </span>
            <span className={`badge-${hoveredNode.risk_level.toLowerCase()}`}>
              {hoveredNode.risk_score}/100
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
            {hoveredNode.role} • {hoveredNode.jurisdiction}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Centrality: {hoveredNode.centrality_score || 0} • Betweenness: {hoveredNode.betweenness || 0}
          </div>
        </div>
      )}
    </div>
  );
};
