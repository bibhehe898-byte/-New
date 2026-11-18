import {
  ArrowRightLeft,
  Briefcase,
  Cog,
  MapPin,
  Move,
  ScanEye,
  Shield,
  ZoomIn,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PannellumViewer from '../components/PannellumViewer'
import { TOUR_CONFIG } from '../data/tourData'
import { useVsmStore } from '../store/useVsmStore'
import './TourPage.css'

const WORKSHOP_2_PANORAMA_URL = `${import.meta.env.BASE_URL}panoramas/workshop2.png`

const KIND_STYLES = {
  operation: {
    icon: Cog,
    background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
  },
  control: {
    icon: Shield,
    background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
  },
  office: {
    icon: Briefcase,
    background: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
  },
}

const DEFAULT_KIND_STYLE = {
  icon: Cog,
  background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
}

export default function TourPage() {
  const viewerRef = useRef(null)
  const view = useVsmStore((state) => state.view)
  const setView = useVsmStore((state) => state.setView)
  const nodes = useVsmStore((state) => state.flows[state.view].nodes)
  const selectedNodeId = useVsmStore((state) => state.selectedNodeId)
  const setSelectedNodeId = useVsmStore((state) => state.setSelectedNodeId)
  const [activeSpotId, setActiveSpotId] = useState(null)

  // Цех 1 = состояние «До», Цех 2 = состояние «После».
  // Панорама определяется текущим режимом стора.
  const isWorkshop2 = view === 'after'

  // При смене режима сбрасываем выбранную точку интереса.
  useEffect(() => {
    setActiveSpotId(null)
  }, [view])

  const spots = useMemo(() => {
    return nodes.map((node, index) => ({
      id: node.id,
      label: node.data.label ?? `Этап ${index + 1}`,
      kind: node.data.kind ?? 'operation',
      step: `Участок ${index + 1}`,
      description: `Загрузка ${node.data.load ?? 0}% · ${node.data.cycleTime ?? 0} мин`,
      yaw: -90 + index * 45,
      pitch: 0,
      hfov: 72,
    }))
  }, [nodes])

  const activeSpot = spots.find((spot) => spot.id === activeSpotId) ?? spots[0] ?? null

  const config = useMemo(() => {
    const hotSpots = spots.map(({ yaw, pitch, label }) => ({
      yaw,
      pitch,
      type: 'info',
      text: label,
      cssClass: 'tour-hotspot',
    }))

    if (isWorkshop2) {
      return {
        default: {
          firstScene: 'workshop-2',
          sceneFadeDuration: 800,
          autoLoad: true,
          showFullscreenCtrl: false,
        },
        scenes: {
          'workshop-2': {
            type: 'equirectangular',
            panorama: WORKSHOP_2_PANORAMA_URL,
            yaw: 180,
            pitch: 0,
            hfov: 95,
            minHfov: 50,
            maxHfov: 110,
            hotSpots,
          },
        },
      }
    }

    const sceneKey = Object.keys(TOUR_CONFIG.scenes)[0]
    return {
      ...TOUR_CONFIG,
      scenes: {
        [sceneKey]: {
          ...TOUR_CONFIG.scenes[sceneKey],
          hotSpots,
        },
      },
    }
  }, [spots, isWorkshop2])

  const handleViewerReady = useCallback((viewer) => {
    viewerRef.current = viewer
  }, [])

  const focusSpot = useCallback((spot) => {
    setActiveSpotId(spot.id)
    setSelectedNodeId(spot.id)
    viewerRef.current?.lookAt(spot.pitch, spot.yaw, spot.hfov, 900)
  }, [setSelectedNodeId])

  // Реверс-синхронизация: переход из редактора «Показать в 3D».
  // Срабатывает только при монтировании тура, чтобы клик по POI в самом туре
  // не «съедал» глобальный selectedNodeId до перехода в редактор.
  const appliedPendingFocus = useRef(false)

  useEffect(() => {
    if (appliedPendingFocus.current) return
    appliedPendingFocus.current = true

    if (!selectedNodeId) return
    const spot = spots.find((item) => item.id === selectedNodeId)
    if (spot) focusSpot(spot)
    setSelectedNodeId(null)
  }, [selectedNodeId, spots, focusSpot, setSelectedNodeId])

  const kindStyle = activeSpot
    ? KIND_STYLES[activeSpot.kind] ?? DEFAULT_KIND_STYLE
    : DEFAULT_KIND_STYLE
  const KindIcon = kindStyle.icon

  return (
    <section className="tour-page" aria-label="3D-тур по производственному цеху">
      <PannellumViewer config={config} onReady={handleViewerReady} className="tour-viewer" />

      <div className="tour-overlay">
        <div className="tour-panel">
          <div className="tour-card">
            <span className="page-eyebrow">
              <ScanEye size={14} aria-hidden="true" />
              3D-тур · MVP
            </span>
            <h1 className="tour-title">
              {isWorkshop2 ? 'Производственный цех №2' : 'Производственный цех №1'}
            </h1>
            <p className="tour-copy">
              Осмотрите участки потока в панораме. Выберите точку интереса — камера плавно
              повернётся к нужному этапу.
            </p>
            <div className="tour-badges">
              <span>{spots.length} точек интереса</span>
              <span>2 панорамы</span>
            </div>

            <button
              type="button"
              className="btn btn--primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
              onClick={() => setView(isWorkshop2 ? 'before' : 'after')}
            >
              <ArrowRightLeft size={15} aria-hidden="true" />
              {isWorkshop2 ? 'Вернуться в Цех 1' : 'Перейти в Цех 2'}
            </button>
          </div>

          {activeSpot && (
            <div className="tour-card">
              <div
                aria-hidden="true"
                className="tour-card__gradient"
                style={{
                  width: '100%',
                  aspectRatio: '2 / 1',
                  borderRadius: 12,
                  backgroundImage: kindStyle.background,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.92)',
                }}
              >
                <KindIcon size={44} strokeWidth={1.6} />
              </div>
              <h2 style={{ marginTop: 12, fontSize: 15, fontWeight: 650 }}>
                {activeSpot.label}
              </h2>
              <p className="tour-copy">{activeSpot.description}</p>
            </div>
          )}

          <div className="tour-card tour-spots">
            <h2 className="tour-spots__title">Точки интереса</h2>
            <ul>
              {spots.map((spot) => (
                <li key={spot.id}>
                  <button
                    type="button"
                    className={`hotspot-item${spot.id === activeSpot?.id ? ' is-active' : ''}`}
                    onClick={() => focusSpot(spot)}
                    aria-pressed={spot.id === activeSpot?.id}
                  >
                    <MapPin size={15} aria-hidden="true" />
                    <span>
                      <strong>{spot.label}</strong>
                      <small>{spot.step}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <span className="tour-source">Тестовая панорама · замените файл в public/panoramas</span>
      </div>

      <div className="tour-hints" aria-hidden="true">
        <span>
          <Move size={14} /> Перетаскивание — осмотреться
        </span>
        <span>
          <ZoomIn size={14} /> Колесо — масштаб
        </span>
      </div>
    </section>
  )
}
