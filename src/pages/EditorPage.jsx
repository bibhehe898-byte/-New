import { Layers, MousePointer2, Plus, RotateCcw, Save, Workflow, X } from 'lucide-react'
import { useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
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

export default function EditorPage() {
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

  const [editing, setEditing] = useState(null)

  const meta = FLOW_META[view]

  const handleNodeClick = (_, node) => {
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
      cycleTime: Number(editing.cycleTime) || 0,
      load: Number(editing.load) || 0,
      cost: Number(editing.cost) || 0,
    })
    setEditing(null)
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
        </div>

        <div className="editor-canvas">
          <ReactFlow
            key={view}
            nodes={nodes}
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
                type="submit"
                className="btn btn--primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
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
