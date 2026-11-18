import { MapPin, Move, ScanEye, ZoomIn } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import PannellumViewer from '../components/PannellumViewer'
import { TOUR_CONFIG, TOUR_HOTSPOTS } from '../data/tourData'
import './TourPage.css'

export default function TourPage() {
  const viewerRef = useRef(null)
  const [activeSpot, setActiveSpot] = useState(TOUR_HOTSPOTS[0].id)

  const handleViewerReady = useCallback((viewer) => {
    viewerRef.current = viewer
  }, [])

  const focusSpot = (spot) => {
    setActiveSpot(spot.id)
    viewerRef.current?.lookAt(spot.pitch, spot.yaw, spot.hfov, 900)
  }

  return (
    <section className="tour-page" aria-label="3D-тур по производственному цеху">
      <PannellumViewer config={TOUR_CONFIG} onReady={handleViewerReady} className="tour-viewer" />

      <div className="tour-overlay">
        <div className="tour-panel">
          <div className="tour-card">
            <span className="page-eyebrow">
              <ScanEye size={14} aria-hidden="true" />
              3D-тур · MVP
            </span>
            <h1 className="tour-title">Производственный цех №1</h1>
            <p className="tour-copy">
              Осмотрите участки потока в панораме. Выберите точку интереса — камера плавно
              повернётся к нужному этапу.
            </p>
            <div className="tour-badges">
              <span>4 точки интереса</span>
              <span>1 панорама</span>
            </div>
          </div>

          <div className="tour-card tour-spots">
            <h2 className="tour-spots__title">Точки интереса</h2>
            <ul>
              {TOUR_HOTSPOTS.map((spot) => (
                <li key={spot.id}>
                  <button
                    type="button"
                    className={`hotspot-item${spot.id === activeSpot ? ' is-active' : ''}`}
                    onClick={() => focusSpot(spot)}
                    aria-pressed={spot.id === activeSpot}
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
