import { useEffect, useRef } from 'react'
import 'pannellum/build/pannellum.css'
import 'pannellum/build/pannellum.js'

/**
 * Тонкая React-обёртка над Pannellum.
 * Пакет pannellum — обычный скрипт, который кладёт API в window.pannellum,
 * поэтому здесь достаточно смонтировать контейнер и создать viewer.
 */
export default function PannellumViewer({ config, onReady, className = '' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const api = window.pannellum
    if (!container || !api) return undefined

    const viewer = api.viewer(container, config)
    onReady?.(viewer)

    return () => {
      onReady?.(null)
      try {
        viewer.destroy()
      } catch {
        // Viewer мог быть уже уничтожен при повторном монтировании в StrictMode.
      }
      container.innerHTML = ''
    }
  }, [config, onReady])

  return <div ref={containerRef} className={`pannellum-viewer ${className}`.trim()} />
}
