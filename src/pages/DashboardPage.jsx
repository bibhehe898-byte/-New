import { ArrowDownRight, ArrowUpRight, ChartColumn, Download, Info, MoveRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DASHBOARD_METRICS } from '../data/vsmData'
import { useVsmStore } from '../store/useVsmStore'
import './DashboardPage.css'

const numberFormatter = (decimals) =>
  new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

function buildRows(flows) {
  return DASHBOARD_METRICS.map((metric) => {
    const before = metric.value(flows.before)
    const after = metric.value(flows.after)
    const max = Math.max(before, after) || 1
    const change = before === 0 ? 0 : ((after - before) / before) * 100
    const improved = metric.direction === 'lower' ? after < before : after > before
    const worsened = metric.direction === 'lower' ? after > before : after < before

    return {
      ...metric,
      before,
      after,
      change,
      improved,
      worsened,
      beforePct: (before / max) * 100,
      afterPct: (after / max) * 100,
    }
  })
}

const formatValue = (value, decimals) => numberFormatter(decimals).format(value)

const formatChange = (change) => {
  const rounded = Math.round(change)
  if (rounded === 0) return '0%'
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)}%`
}

function buildImprovementPlan(flows) {
  const sumCycleTime = (flow) =>
    flow.nodes.reduce((sum, item) => sum + (item.data.cycleTime ?? 0), 0)

  const beforeTime = sumCycleTime(flows.before)
  const afterTime = sumCycleTime(flows.after)
  const bottlenecks = flows.before.nodes.filter((node) => (node.data.load ?? 0) > 90)

  const lines = [
    'План улучшений КПСЦ',
    '',
    'Текущие метрики:',
    `- Время цикла (До): ${beforeTime} мин`,
    `- Время цикла (После): ${afterTime} мин`,
    '',
    'Задачи:',
  ]

  if (bottlenecks.length === 0) {
    lines.push('- Узких мест (загрузка > 90%) не найдено.')
  } else {
    bottlenecks.forEach((node, index) => {
      lines.push(
        `${index + 1}. Оптимизировать узкое место: ${node.data.label} (загрузка ${node.data.load}%)`,
      )
    })
  }

  return lines.join('\n')
}

function downloadImprovementPlan(flows) {
  const content = buildImprovementPlan(flows)

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'plan_uluchsheniy.txt'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function DashboardPage() {
  const flows = useVsmStore((state) => state.flows)
  const rows = buildRows(flows)

  const leadRow = rows.find((row) => row.key === 'leadTime')
  const leadReduction =
    leadRow && leadRow.before > 0 ? ((leadRow.before - leadRow.after) / leadRow.before) * 100 : 0
  const heroValue = `${leadReduction >= 0 ? '−' : '+'}${Math.abs(Math.round(leadReduction))}%`
  const heroCaption =
    leadReduction >= 0 ? 'сокращение времени протекания' : 'рост времени протекания'

  return (
    <div className="page dashboard-page">
      <header className="page-header dash-header">
        <div>
          <span className="page-eyebrow">
            <ChartColumn size={14} aria-hidden="true" />
            Дашборд До/После
          </span>
          <h1 className="page-title">Эффект от изменений потока</h1>
          <p className="page-subtitle">
            Сравнение текущего и целевого состояния КПСЦ. Значения пересчитываются из
            редактора — правки этапов сразу видны здесь.
          </p>

          <div className="page-actions" style={{ marginTop: 18 }}>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => downloadImprovementPlan(flows)}
            >
              <Download size={15} aria-hidden="true" />
              Скачать план улучшений
            </button>
          </div>
        </div>

        <div className="hero-figure">
          <span className="hero-number">{heroValue}</span>
          <span className="hero-caption">{heroCaption}</span>
          <span className="hero-detail">
            {formatValue(leadRow?.before ?? 0, 0)} ч <MoveRight size={13} aria-hidden="true" />{' '}
            {formatValue(leadRow?.after ?? 0, 0)} ч
          </span>
        </div>
      </header>

      <section className="viz-card" aria-labelledby="compare-title">
        <div className="viz-card__head">
          <div>
            <h2 id="compare-title" className="viz-title">
              Ключевые показатели
            </h2>
            <p className="viz-subtitle">
              Каждая строка — своя шкала; значения подписаны напрямую.
            </p>
          </div>
          <ul className="viz-legend" aria-label="Обозначения">
            <li>
              <span className="legend-swatch legend-swatch--before" aria-hidden="true" />
              До
            </li>
            <li>
              <span className="legend-swatch legend-swatch--after" aria-hidden="true" />
              После
            </li>
          </ul>
        </div>

        <ul className="dumbbell">
          {rows.map((row) => {
            const startPct = Math.min(row.beforePct, row.afterPct)
            const widthPct = Math.abs(row.beforePct - row.afterPct)

            return (
              <li className="dumbbell-row" key={row.key}>
                <span className="dumbbell-row__label">{row.label}</span>

                <div
                  className="dumbbell-track"
                  aria-hidden="true"
                  title={`До: ${formatValue(row.before, row.decimals)} ${row.unit} · После: ${formatValue(row.after, row.decimals)} ${row.unit}`}
                >
                  <span className="dumbbell-base" />
                  <span
                    className="dumbbell-connector"
                    style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                  />
                  <span
                    className="dumbbell-dot dumbbell-dot--before"
                    style={{ left: `${row.beforePct}%` }}
                  />
                  <span
                    className="dumbbell-dot dumbbell-dot--after"
                    style={{ left: `${row.afterPct}%` }}
                  />
                </div>

                <span className="dumbbell-values">
                  <span>{formatValue(row.before, row.decimals)}</span>
                  <MoveRight size={12} aria-hidden="true" />
                  <span>{formatValue(row.after, row.decimals)}</span>
                  <small>{row.unit}</small>
                </span>

                <span
                  className={`delta-chip${row.improved ? ' is-good' : ''}${row.worsened ? ' is-bad' : ''}`}
                  title={`Изменение: ${formatChange(row.change)}`}
                >
                  {row.change < 0 ? (
                    <ArrowDownRight size={13} aria-hidden="true" />
                  ) : (
                    <ArrowUpRight size={13} aria-hidden="true" />
                  )}
                  {formatChange(row.change)}
                </span>
              </li>
            )
          })}
        </ul>

        <div className="viz-foot">
          <p className="viz-note">
            <Info size={13} aria-hidden="true" />
            Метрики синхронизированы с{' '}
            <Link to="/editor">редактором КПСЦ</Link>.
          </p>

          <details className="viz-table">
            <summary>Таблица значений</summary>
            <table>
              <caption className="sr-only">
                Сравнение показателей потока в состояниях «До» и «После»
              </caption>
              <thead>
                <tr>
                  <th scope="col">Показатель</th>
                  <th scope="col">До</th>
                  <th scope="col">После</th>
                  <th scope="col">Изменение</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row">
                      {row.label}, {row.unit}
                    </th>
                    <td>{formatValue(row.before, row.decimals)}</td>
                    <td>{formatValue(row.after, row.decimals)}</td>
                    <td className={row.improved ? 'is-good' : row.worsened ? 'is-bad' : ''}>
                      {formatChange(row.change)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      </section>
    </div>
  )
}
