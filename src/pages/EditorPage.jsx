import { CloudUpload, Layers, MousePointer2, Plus, RotateCcw, Save, ScanEye, Workflow, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import VsmNode from '../components/VsmNode'
import { FLOW_META } from '../data/vsmData'
import { useVsmStore } from '../store/useVsmStore'
import './EditorPage.css'

const NODE_TYPES = { vsm: VsmNode }

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  background: 'rgba(5, 9, 14, 0.72)',
  backdropFilter: 'blur(3px)',
  zIndex: 100,
}

const cardStyle = {
  width: '100%',
  maxWidth: 360,
  padding: 22,
  borderRadius: 16,
  border: '1px solid var(--border-strong)',
  background: 'var(--surface)',
  boxShadow: '0 24px 70px rgba(0, 0, 0, 0.5)',
}

const fieldStyle = {
  display: 'block',
  marginBottom: 14,
}

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-2)',
}

const inputStyle = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'rgba(255, 255, 255, 0.03)',
  color: 'var(--text)',
  font: 'inherit',
  fontSize: 14,
  outline: 'none',
}

const toValidNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function FlowCanvas({
  view,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
}) {
  const { setCenter } = useReactFlow()
  const selectedNodeId = useVsmStore((state) => state.selectedNodeId)
  const setSelectedNodeId = useVsmStore((state) => state.setSelectedNodeId)
  const [highlightedId, setHighlightedId] = useState(null)

  // Синхронизация «Тур -> Редактор»: центрируемся и подсвечиваем выбранный узел.
  useEffect(() => {
    if (!selectedNodeId) return
    const node = nodes.find((item) => item.id === selectedNodeId)
    if (node) {
      const x = node.position.x + (node.width ?? 0) / 2
      const y = node.position.y + (node.height ?? 0) / 2
      setCenter(x, y, { zoom: 1, duration: 800 })
      setHighlightedId(node.id)
    }
    setSelectedNodeId(null)
  }, [selectedNodeId, nodes, setCenter, setSelectedNodeId])

  // Автосброс подсветки, чтобы она не «залипала» после ручных действий.
  useEffect(() => {
    if (!highlightedId) return
    const timer = setTimeout(() => setHighlightedId(null), 2500)
    return () => clearTimeout(timer)
  }, [highlightedId])

  const displayNodes = useMemo(() => {
    if (!highlightedId) return nodes
    return nodes.map((node) =>
      node.id === highlightedId ? { ...node, selected: true } : node,
    )
  }, [nodes, highlightedId])

  const handleNodeClick = (event, node) => {
    setHighlightedId(null)
    const x = node.position.x + (node.width ?? 0) / 2
    const y = node.position.y + (node.height ?? 0) / 2
    setCenter(x, y, { zoom: 1, duration: 800 })
    onNodeClick(node)
  }

  return (
    <div className="editor-canvas">
      <ReactFlow
        key={view}
        nodes={displayNodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.22, minZoom: 0.25, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={1.8}
        deleteKeyCode={['Backspace', 'Delete']}
        className={`vsm-flow vsm-flow--${view}`}
      >
        <Background variant="dots" gap={22} size={1.4} color="rgba(148, 178, 204, 0.2)" />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(5, 9, 14, 0.72)"
          nodeColor={() => (view === 'before' ? '#3987e5' : '#199e70')}
          nodeStrokeWidth={0}
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}

export default function EditorPage() {
  const navigate = useNavigate()
  const view = useVsmStore((state) => state.view)
  const nodes = useVsmStore((state) => state.flows[state.view].nodes)
  const edges = useVsmStore((state) => state.flows[state.view].edges)
  const setView = useVsmStore((state) => state.setView)
  const onNodesChange = useVsmStore((state) => state.onNodesChange)
  const onEdgesChange = useVsmStore((state) => state.onEdgesChange)
  const addStep = useVsmStore((state) => state.addStep)
  const resetFlow = useVsmStore((state) => state.resetFlow)
  const onConnect = useVsmStore((state) => state.onConnect)
  const updateNode = useVsmStore((state) => state.updateNode)
  const saveFlowToServer = useVsmStore((state) => state.saveFlowToServer)
  const loadFlowFromServer = useVsmStore((state) => state.loadFlowFromServer)
  const setSelectedNodeId = useVsmStore((state) => state.setSelectedNodeId)

  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)

  useEffect(() => {
    let cancelled = false

    loadFlowFromServer().catch((error) => {
      // 404 — граф ещё не сохранён: оставляем дефолтные данные из стора.
      if (cancelled || error?.status === 404) return
      console.warn('Не удалось загрузить граф с сервера:', error)
    })

    return () => {
      cancelled = true
    }
  }, [view, loadFlowFromServer])

  const meta = FLOW_META[view]

  const handleNodeClick = (node) => {
    setEditing({
      id: node.id,
      label: node.data.label ?? '',
      cycleTime: node.data.cycleTime ?? 0,
      load: node.data.load ?? 0,
      cost: node.data.cost ?? 0,
    })
  }

  const handleSave = (event) => {
    event.preventDefault()
    updateNode(editing.id, {
      label: editing.label,
      cycleTime: Math.max(0, toValidNumber(editing.cycleTime)),
      load: Math.min(100, Math.max(0, toValidNumber(editing.load))),
      cost: Math.max(0, toValidNumber(editing.cost)),
    })
    setEditing(null)
  }

  const handleSaveToServer = async () => {
    setSaving(true)
    setSaveStatus(null)
    try {
      await saveFlowToServer()
      setSaveStatus({ type: 'ok', text: 'Граф сохранён на сервере' })
    } catch {
      setSaveStatus({ type: 'error', text: 'Не удалось сохранить граф' })
    } finally {
      setSaving(false)
    }
  }

  const handleShowIn3D = () => {
    setSelectedNodeId(editing.id)
    setEditing(null)
    navigate('/')
  }

  return (
    <ReactFlowProvider>
      <div className="page editor-page">
        <header className="page-header">
          <div>
            <span className="page-eyebrow">
              <Workflow size={14} aria-hidden="true" />
              Редактор КПСЦ
            </span>
            <h1 className="page-title">Карта потока создания ценности</h1>
            <p className="page-subtitle">
              Схема «До» и «После» хранится в Zustand-сторе. Перетаскивайте этапы,
              добавляйте и удаляйте их — дашборд пересчитается автоматически.
            </p>
          </div>

          <div className="page-actions">
            <div className="segmented" role="group" aria-label="Версия потока">
              <button
                type="button"
                className={view === 'before' ? 'is-active' : ''}
                onClick={() => setView('before')}
                aria-pressed={view === 'before'}
              >
                До
              </button>
              <button
                type="button"
                className={view === 'after' ? 'is-active' : ''}
                onClick={() => setView('after')}
                aria-pressed={view === 'after'}
              >
                После
              </button>
            </div>
            <button type="button" className="btn" onClick={resetFlow}>
              <RotateCcw size={15} aria-hidden="true" />
              Сбросить
            </button>
            <button type="button" className="btn btn--primary" onClick={addStep}>
              <Plus size={16} aria-hidden="true" />
              Добавить этап
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSaveToServer}
              disabled={saving}
            >
              <CloudUpload size={16} aria-hidden="true" />
              {saving ? 'Сохранение…' : 'Сохранить на сервер'}
            </button>
          </div>
        </header>

        <div className="editor-meta" aria-live="polite">
          <span className={`editor-chip editor-chip--${view}`}>
            <span className="editor-chip__dot" aria-hidden="true" />
            {meta.title}
          </span>
          <span className="editor-chip">
            <Layers size={13} aria-hidden="true" />
            {nodes.length} этапов
          </span>
          <span className="editor-chip">
            <Workflow size={13} aria-hidden="true" />
            {edges.length} связей
          </span>
          <span className="editor-hint">
            <MousePointer2 size={13} aria-hidden="true" />
            {meta.subtitle}. Delete — удалить выбранное.
          </span>
          {saveStatus && (
            <span
              role="status"
              style={{ color: saveStatus.type === 'ok' ? '#199e70' : '#e5484d' }}
            >
              {saveStatus.text}
            </span>
          )}
        </div>

        <FlowCanvas
          view={view}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
        />

        {editing && (
          <div style={overlayStyle} onClick={() => setEditing(null)}>
            <form style={cardStyle} onClick={(event) => event.stopPropagation()} onSubmit={handleSave}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <h2 style={{ fontSize: 17, fontWeight: 650 }}>Редактировать этап</h2>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  aria-label="Закрыть"
                  style={{
                    display: 'inline-flex',
                    padding: 4,
                    border: 0,
                    borderRadius: 8,
                    background: 'transparent',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <label style={fieldStyle}>
                <span style={labelStyle}>Название</span>
                <input
                  type="text"
                  value={editing.label}
                  onChange={(event) => setEditing((prev) => ({ ...prev, label: event.target.value }))}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Время цикла, мин</span>
                <input
                  type="number"
                  min="0"
                  value={editing.cycleTime}
                  onChange={(event) => setEditing((prev) => ({ ...prev, cycleTime: event.target.value }))}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Загрузка, %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editing.load}
                  onChange={(event) => setEditing((prev) => ({ ...prev, load: event.target.value }))}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Стоимость, ₽</span>
                <input
                  type="number"
                  min="0"
                  value={editing.cost}
                  onChange={(event) => setEditing((prev) => ({ ...prev, cost: event.target.value }))}
                  style={inputStyle}
                />
              </label>

              <button
                type="button"
                className="btn"
                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                onClick={handleShowIn3D}
              >
                <ScanEye size={15} aria-hidden="true" />
                Показать в 3D
              </button>

              <button
                type="submit"
                className="btn btn--primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              >
                <Save size={15} aria-hidden="true" />
                Сохранить
              </button>
            </form>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  )
}
