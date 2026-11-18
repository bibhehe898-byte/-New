import { addEdge, applyEdgeChanges, applyNodeChanges, MarkerType } from 'reactflow'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createEdge, initialAfterFlow, initialBeforeFlow } from '../data/vsmData'
import { useAuthStore } from './useAuthStore'

const API_URL = 'http://127.0.0.1:8000'

const cloneFlow = (flow) => structuredClone(flow)

const INITIAL_FLOWS = {
  before: cloneFlow(initialBeforeFlow),
  after: cloneFlow(initialAfterFlow),
}

const updateCurrentFlow = (state, updater) => {
  const current = state.flows[state.view]
  return {
    flows: { ...state.flows, [state.view]: updater(current) },
  }
}

let nextNodeId = 1

const NEW_EDGE_DEFAULTS = {
  type: 'smoothstep',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 15,
    height: 15,
    color: 'rgba(148, 178, 204, 0.55)',
  },
  style: { stroke: 'rgba(148, 178, 204, 0.42)', strokeWidth: 1.6 },
}

export const useVsmStore = create(persist((set, get) => ({
  view: 'before',
  flows: INITIAL_FLOWS,
  selectedNodeId: null,

  setView: (view) => set({ view }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  onNodesChange: (changes) =>
    set((state) =>
      updateCurrentFlow(state, (flow) => ({
        ...flow,
        nodes: applyNodeChanges(changes, flow.nodes),
      })),
    ),

  onEdgesChange: (changes) =>
    set((state) =>
      updateCurrentFlow(state, (flow) => ({
        ...flow,
        edges: applyEdgeChanges(changes, flow.edges),
      })),
    ),

  onConnect: (connection) =>
    set((state) =>
      updateCurrentFlow(state, (flow) => ({
        ...flow,
        edges: addEdge({ ...connection, ...NEW_EDGE_DEFAULTS }, flow.edges),
      })),
    ),

  updateNode: (id, patch) =>
    set((state) =>
      updateCurrentFlow(state, (flow) => ({
        ...flow,
        nodes: flow.nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, ...patch } } : node,
        ),
      })),
    ),

  addStep: () =>
    set((state) =>
      updateCurrentFlow(state, (flow) => {
        const lastNode = flow.nodes.at(-1)
        const id = `step-${nextNodeId++}`
        const newNode = {
          id,
          type: 'vsm',
          position: {
            x: lastNode ? lastNode.position.x + 250 : 20,
            y: lastNode?.position.y ?? 150,
          },
          data: {
            label: `Новый этап ${flow.nodes.length + 1}`,
            kind: 'operation',
            cycleTime: 0,
            leadTime: 5,
          },
        }

        return {
          nodes: [...flow.nodes, newNode],
          edges: lastNode ? [...flow.edges, createEdge(lastNode.id, id)] : flow.edges,
        }
      }),
    ),

  resetFlow: () =>
    set((state) => ({
      flows: {
        ...state.flows,
        [state.view]: cloneFlow(state.view === 'before' ? initialBeforeFlow : initialAfterFlow),
      },
    })),

  saveFlowToServer: async () => {
    const { view, flows } = get()
    const token = useAuthStore.getState().token

    const response = await fetch(`${API_URL}/api/flows/${view}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nodes: flows[view].nodes,
        edges: flows[view].edges,
      }),
    })

    if (!response.ok) {
      throw new Error('Не удалось сохранить граф на сервере')
    }

    return response.json()
  },

  loadFlowFromServer: async () => {
    const { view } = get()
    const token = useAuthStore.getState().token

    const response = await fetch(`${API_URL}/api/flows/${view}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = new Error('Не удалось загрузить граф с сервера')
      error.status = response.status
      throw error
    }

    const data = await response.json()

    set((state) => ({
      flows: {
        ...state.flows,
        [view]: { nodes: data.nodes, edges: data.edges },
      },
    }))

    return data
  },
}), { name: 'kataxone-vsm', partialize: (state) => ({ flows: state.flows }) }))
