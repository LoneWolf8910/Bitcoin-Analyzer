import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import cytoscape from 'cytoscape'
import coseBilkent from 'cytoscape-cose-bilkent'
import { formatCompactBTC, formatTimestamp, truncateAddress, getWalletLabelColor } from '../../utils/formatters.jsx'

cytoscape.use(coseBilkent)

const NODE_COLORS = {
  selected: '#2563eb',
  normal: '#3b82f6',
  rapid_transfer: '#ef4444',
  anomalous: '#a855f7',
  high_activity: '#f97316',
  default: '#64748b',
}

const EDGE_COLOR = '#94a3b8'
const EDGE_HIGHLIGHT = '#2563eb'

const LAYOUT_PRESETS = {
  cose: {
    name: 'cose-bilkent',
    animate: true,
    animationDuration: 500,
    nodeDimensionsIncludeLabels: true,
    idealEdgeLength: 100,
    nodeRepulsion: 400000,
    nodeOverlap: 20,
    gravity: 80,
    numIter: 2500,
    tile: true,
    tilingPaddingVertical: 10,
    tilingPaddingHorizontal: 10,
    gravityRange: 1,
    gravityCompound: 1,
    gravityRangeCompound: 1,
    randomize: false,
  },
  circle: {
    name: 'circle',
    animate: true,
    animationDuration: 500,
    radius: 200,
  },
  grid: {
    name: 'grid',
    animate: true,
    animationDuration: 500,
    rows: Math.ceil(Math.sqrt(50)),
    cols: Math.ceil(Math.sqrt(50)),
  },
  concentric: {
    name: 'concentric',
    animate: true,
    animationDuration: 500,
    minNodeSpacing: 50,
  },
}

export function TransactionGraph({
  data,
  walletAddress,
  depth = 2,
  onDepthChange,
  onNodeClick,
  onEdgeClick,
  loading = false,
  error = null,
}) {
  const cyRef = useRef(null)
  const containerRef = useRef(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedEdge, setSelectedEdge] = useState(null)
  const [layoutRunning, setLayoutRunning] = useState(false)
  const [currentLayout, setCurrentLayout] = useState('cose')
  const [showLabels, setShowLabels] = useState(true)
  const [showLegend, setShowLegend] = useState(true)

  const initializeCy = useCallback(() => {
    if (cyRef.current || !containerRef.current) return

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'font-size': '11px',
            'font-family': 'system-ui, sans-serif',
            'font-weight': 600,
            'color': '#1e293b',
            'text-outline-width': 2,
            'text-outline-color': '#ffffff',
            'text-outline-opacity': 1,
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 14,
            'background-color': 'data(color)',
            'border-width': 'data(borderWidth)',
            'border-color': 'data(borderColor)',
            'width': 'data(size)',
            'height': 'data(size)',
            'min-zoomed-font-size': 8,
            'text-opacity': showLabels ? 1 : 0,
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': EDGE_COLOR,
            'target-arrow-color': EDGE_COLOR,
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '9px',
            'color': '#64748b',
            'text-outline-width': 2,
            'text-outline-color': '#ffffff',
            'text-outline-opacity': 1,
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
            'text-opacity': showLabels ? 1 : 0,
            'opacity': 0.7,
          },
        },
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': EDGE_HIGHLIGHT,
            'target-arrow-color': EDGE_HIGHLIGHT,
            'width': 3,
            'color': '#3b82f6',
            'z-index': 999,
            'opacity': 1,
          },
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-width': 4,
            'border-color': '#2563eb',
            'z-index': 999,
          },
        },
        {
          selector: ':selected',
          style: {
            'border-width': 4,
            'border-color': '#2563eb',
          },
        },
      ],
      layout: LAYOUT_PRESETS.cose,
      minZoom: 0.05,
      maxZoom: 4,
      zoomingEnabled: true,
      userZoomingEnabled: true,
      panningEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: false,
    })

    cyRef.current = cy

    cy.on('tap', 'node', (event) => {
      const node = event.target
      const nodeData = node.data()

      cy.nodes().removeClass('highlighted')
      cy.edges().removeClass('highlighted')
      node.addClass('highlighted')

      node.connectedEdges().addClass('highlighted')
      node.connectedEdges().connectedNodes().addClass('highlighted')

      setSelectedNode(nodeData)
      setSelectedEdge(null)
      onNodeClick?.(nodeData)
    })

    cy.on('tap', 'edge', (event) => {
      const edge = event.target
      const edgeData = edge.data()

      cy.edges().removeClass('highlighted')
      edge.addClass('highlighted')

      edge.source().addClass('highlighted')
      edge.target().addClass('highlighted')

      setSelectedEdge(edgeData)
      setSelectedNode(null)
      onEdgeClick?.(edgeData)
    })

    cy.on('tap', (event) => {
      if (event.target === cy) {
        cy.nodes().removeClass('highlighted')
        cy.edges().removeClass('highlighted')
        setSelectedNode(null)
        setSelectedEdge(null)
      }
    })

    cy.on('layoutstart', () => setLayoutRunning(true))
    cy.on('layoutstop', () => setLayoutRunning(false))

    return cy
  }, [onNodeClick, onEdgeClick, showLabels])

  const updateGraph = useCallback(() => {
    const cy = cyRef.current
    if (!cy || !data) return

    const elements = []

    data.nodes?.forEach((node) => {
      const isCenter = node.id === walletAddress
      const isAnomalous = node.dominant_label === 'anomalous'
      const isRapid = node.dominant_label === 'rapid_transfer'
      const isHighActivity = node.dominant_label === 'high_activity'

      let color = NODE_COLORS.default
      if (isCenter) color = NODE_COLORS.selected
      else if (isAnomalous) color = NODE_COLORS.anomalous
      else if (isRapid) color = NODE_COLORS.rapid_transfer
      else if (isHighActivity) color = NODE_COLORS.high_activity
      else color = NODE_COLORS.normal

      const degree = node.degree || 0
      const size = Math.max(28, Math.min(60, 28 + degree * 1.5))

      elements.push({
        group: 'nodes',
        data: {
          id: node.id,
          label: truncateAddress(node.id, 5, 4),
          fullAddress: node.id,
          color,
          size,
          borderWidth: isCenter ? 3 : 1,
          borderColor: isCenter ? '#2563eb' : '#e2e8f0',
          ...node,
        },
        classes: isCenter ? 'center-node' : '',
      })
    })

    data.edges?.forEach((edge) => {
      elements.push({
        group: 'edges',
        data: {
          id: `${edge.source}-${edge.target}-${edge.txid}`,
          source: edge.source,
          target: edge.target,
          label: formatCompactBTC(edge.amount),
          txid: edge.txid,
          amount: edge.amount,
          timestamp: edge.timestamp,
          ...edge,
        },
      })
    })

    cy.elements().remove()
    cy.add(elements)

    if (data.nodes?.length > 0) {
      cy.layout(LAYOUT_PRESETS[currentLayout]).run()
    }

    const centerNode = cy.getElementById(walletAddress)
    if (centerNode.length) {
      centerNode.addClass('highlighted')
      centerNode.connectedEdges().addClass('highlighted')
      centerNode.connectedEdges().connectedNodes().addClass('highlighted')
    }
  }, [data, walletAddress, currentLayout])

  useEffect(() => {
    initializeCy()
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy()
        cyRef.current = null
      }
    }
  }, [initializeCy])

  useEffect(() => {
    if (cyRef.current && data) {
      updateGraph()
    }
  }, [data, updateGraph])

  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.style().selector('node').style('text-opacity', showLabels ? 1 : 0).update()
      cyRef.current.style().selector('edge').style('text-opacity', showLabels ? 1 : 0).update()
    }
  }, [showLabels])

  const fitGraph = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.fit(cyRef.current.elements(), 50)
    }
  }, [])

  const resetGraph = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.zoom(1)
      cyRef.current.pan({ x: 0, y: 0 })
      fitGraph()
    }
  }, [fitGraph])

  const zoomIn = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2)
    }
  }, [])

  const zoomOut = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() / 1.2)
    }
  }, [])

  const changeLayout = useCallback((layoutName) => {
    setCurrentLayout(layoutName)
    if (cyRef.current && data?.nodes?.length > 0) {
      cyRef.current.layout(LAYOUT_PRESETS[layoutName]).run()
    }
  }, [data])

  const stats = useMemo(() => ({
    nodes: data?.nodes?.length ?? 0,
    edges: data?.edges?.length ?? 0,
    anomalous: data?.nodes?.filter(n => n.dominant_label === 'anomalous').length ?? 0,
    rapid: data?.nodes?.filter(n => n.dominant_label === 'rapid_transfer').length ?? 0,
    highActivity: data?.nodes?.filter(n => n.dominant_label === 'high_activity').length ?? 0,
  }), [data])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center card">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-surface-500 dark:text-surface-400 text-sm">Loading graph...</p>
          {layoutRunning && <p className="text-surface-400 dark:text-surface-500 text-xs mt-1">Laying out nodes...</p>}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center card p-6">
        <div className="text-center text-danger-600 dark:text-danger-400">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77 1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm font-medium">Failed to load graph</p>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (!data?.nodes?.length) {
    return (
      <div className="h-full flex items-center justify-center card p-6">
        <div className="text-center text-surface-500 dark:text-surface-400">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="text-sm font-medium">No graph data available</p>
          <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">No connected wallets found at this depth</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full card overflow-hidden flex flex-col">
      <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <h3 className="section-title truncate">
            <svg className="w-5 h-5 text-surface-400 dark:text-surface-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Transaction Graph
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-surface-500 dark:text-surface-400 px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded-full font-mono">
              {stats.nodes} nodes • {stats.edges} edges
            </span>
            {(stats.anomalous || stats.rapid || stats.highActivity) && (
              <div className="flex items-center gap-1.5">
                {stats.anomalous > 0 && (
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    {stats.anomalous} anomalous
                  </span>
                )}
                {stats.rapid > 0 && (
                  <span className="px-2 py-0.5 bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 rounded-full text-xs font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-danger-500 rounded-full" />
                    {stats.rapid} rapid
                  </span>
                )}
                {stats.highActivity > 0 && (
                  <span className="px-2 py-0.5 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 rounded-full text-xs font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-warning-500 rounded-full" />
                    {stats.highActivity} high activity
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded-lg">
            <label className="text-xs text-surface-500 dark:text-surface-400">Layout:</label>
            <select
              value={currentLayout}
              onChange={(e) => changeLayout(e.target.value)}
              className="input-sm w-auto bg-transparent text-surface-900 dark:text-surface-100"
              disabled={layoutRunning}
              aria-label="Graph layout algorithm"
            >
              <option value="cose">Force-directed</option>
              <option value="circle">Circle</option>
              <option value="grid">Grid</option>
              <option value="concentric">Concentric</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="w-4 h-4 text-brand-600 border-surface-300 rounded focus:ring-brand-500"
              aria-label="Show labels"
            />
            <span className="text-xs text-surface-500 dark:text-surface-400">Labels</span>
          </label>

          <label className="flex items-center gap-1.5 px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={showLegend}
              onChange={(e) => setShowLegend(e.target.checked)}
              className="w-4 h-4 text-brand-600 border-surface-300 rounded focus:ring-brand-500"
              aria-label="Show legend"
            />
            <span className="text-xs text-surface-500 dark:text-surface-400">Legend</span>
          </label>

          <div className="flex items-center gap-1 w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />

          <button onClick={zoomIn} className="btn-ghost p-2 rounded-lg" title="Zoom In" aria-label="Zoom In" disabled={layoutRunning}>
            <svg className="w-4 h-4 text-surface-500 dark:text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
          </button>
          <button onClick={zoomOut} className="btn-ghost p-2 rounded-lg" title="Zoom Out" aria-label="Zoom Out" disabled={layoutRunning}>
            <svg className="w-4 h-4 text-surface-500 dark:text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h10" /></svg>
          </button>
          <button onClick={fitGraph} className="btn-ghost p-2 rounded-lg" title="Fit to Screen" aria-label="Fit to Screen" disabled={layoutRunning}>
            <svg className="w-4 h-4 text-surface-500 dark:text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          </button>
          <button onClick={resetGraph} className="btn-ghost p-2 rounded-lg" title="Reset View" aria-label="Reset View" disabled={layoutRunning}>
            <svg className="w-4 h-4 text-surface-500 dark:text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative min-h-[500px]" />

      {(selectedNode || selectedEdge) && (
        <DetailPanel
          node={selectedNode}
          edge={selectedEdge}
          onClose={() => {
            setSelectedNode(null)
            setSelectedEdge(null)
            cyRef.current?.nodes().removeClass('highlighted')
            cyRef.current?.edges().removeClass('highlighted')
          }}
        />
      )}

      {showLegend && <Legend />}
    </div>
  )
}

function DetailPanel({ node, edge, onClose }) {
  if (node) {
    return (
      <div className="absolute bottom-4 right-4 w-80 card-elevated p-4 shadow-2xl z-20 animate-slide-in max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-surface-900 dark:text-surface-100">Wallet Details</h4>
          <button onClick={onClose} className="text-surface-400 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors" aria-label="Close details">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <DetailRow label="Address" value={truncateAddress(node.id, 8, 6)} monospace />
          <DetailRow label="Transactions" value={node.transaction_count ?? 0} monospace />
          <DetailRow label="Received" value={formatCompactBTC(node.total_received ?? 0)} color="text-success-600 dark:text-success-400" monospace />
          <DetailRow label="Sent" value={formatCompactBTC(node.total_sent ?? 0)} color="text-danger-600 dark:text-danger-400" monospace />
          <DetailRow label="Net Flow" value={formatCompactBTC((node.total_received ?? 0) - (node.total_sent ?? 0))} color={(node.total_received ?? 0) - (node.total_sent ?? 0) >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'} monospace />
          <DetailRow label="Degree" value={node.degree ?? 0} monospace />
          <DetailRow label="In / Out" value={`${node.in_degree ?? 0} / ${node.out_degree ?? 0}`} monospace />
          <DetailRow
            label="Label"
            value={
              <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${getWalletLabelColor(node.dominant_label)}`}>
                {node.dominant_label?.replace('_', ' ') ?? 'unknown'}
              </span>
            }
          />
        </div>
      </div>
    )
  }

  if (edge) {
    return (
      <div className="absolute bottom-4 right-4 w-80 card-elevated p-4 shadow-2xl z-20 animate-slide-in max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-surface-900 dark:text-surface-100">Transaction Details</h4>
          <button onClick={onClose} className="text-surface-400 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors" aria-label="Close details">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <DetailRow label="TXID" value={edge.txid} monospace truncate />
          <DetailRow label="Amount" value={formatCompactBTC(edge.amount)} color="text-brand-600 dark:text-brand-400" monospace />
          <DetailRow label="Time" value={formatTimestamp(edge.timestamp)} monospace />
          <DetailRow label="From" value={truncateAddress(edge.source, 8, 6)} monospace truncate />
          <DetailRow label="To" value={truncateAddress(edge.target, 8, 6)} monospace truncate />
        </div>
      </div>
    )
  }

  return null
}

function DetailRow({ label, value, color, monospace, truncate }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-surface-500 dark:text-surface-400 truncate">{label}</span>
      <span className={`text-surface-900 dark:text-surface-100 font-medium text-right ${monospace ? 'font-mono' : ''} ${color || ''} ${truncate ? 'truncate max-w-[200px]' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function Legend() {
  const items = [
    { color: NODE_COLORS.selected, label: 'Selected Wallet', border: '#2563eb', isCenter: true },
    { color: NODE_COLORS.normal, label: 'Normal' },
    { color: NODE_COLORS.rapid_transfer, label: 'Rapid Transfer' },
    { color: NODE_COLORS.anomalous, label: 'Anomalous' },
    { color: NODE_COLORS.high_activity, label: 'High Activity' },
    { color: EDGE_COLOR, label: 'Transaction', shape: 'edge' },
  ]

  return (
    <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-surface-900/95 border border-surface-200 dark:border-surface-700 rounded-lg p-3 shadow-lg z-10 backdrop-blur-sm">
      <p className="text-xs font-semibold text-surface-700 dark:text-surface-300 mb-2">Legend</p>
      <div className="flex flex-wrap gap-2.5 text-xs text-surface-600 dark:text-surface-400">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
            {item.shape === 'edge' ? (
              <svg className="w-6 h-3" viewBox="0 0 24 4" aria-hidden="true">
                <line x1="2" y1="2" x2="22" y2="2" stroke={item.color} strokeWidth="2" />
                <polygon points="20,0 24,2 20,4" fill={item.color} />
              </svg>
            ) : (
              <span
                className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${item.isCenter ? '' : ''}`}
                style={{
                  backgroundColor: item.color,
                  borderColor: item.border || item.color,
                }}
              />
            )}
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default TransactionGraph