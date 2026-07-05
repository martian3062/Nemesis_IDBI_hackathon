import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { MLValidation } from '../../types'

const ACCENT = '#53d1b6'
const ACCENT_DEEP = '#0e9f84'
const RISK = '#f87171'
const GRID = 'rgba(148, 163, 184, 0.22)'
const AXIS = 'rgba(226, 232, 240, 0.55)'

function useChart<T extends SVGSVGElement>(draw: (svg: d3.Selection<T, unknown, null, undefined>) => void, deps: unknown[]) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!ref.current) return
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()
    draw(svg)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

export function RocCurve({ data }: { data: MLValidation }) {
  const W = 320
  const H = 240
  const m = { top: 16, right: 16, bottom: 34, left: 40 }
  const ref = useChart<SVGSVGElement>((svg) => {
    const x = d3.scaleLinear([0, 1], [m.left, W - m.right])
    const y = d3.scaleLinear([0, 1], [H - m.bottom, m.top])

    svg.append('g')
      .attr('transform', `translate(0,${H - m.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(-(H - m.top - m.bottom)))
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick line').attr('stroke', GRID))
      .call((g) => g.selectAll('text').attr('fill', AXIS).attr('font-size', 10))
    svg.append('g')
      .attr('transform', `translate(${m.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickSize(-(W - m.left - m.right)))
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick line').attr('stroke', GRID))
      .call((g) => g.selectAll('text').attr('fill', AXIS).attr('font-size', 10))

    svg.append('line')
      .attr('x1', x(0)).attr('y1', y(0)).attr('x2', x(1)).attr('y2', y(1))
      .attr('stroke', 'rgba(148,163,184,0.5)').attr('stroke-dasharray', '4 4')

    const area = d3.area<{ fpr: number; tpr: number }>()
      .x((d) => x(d.fpr)).y0(y(0)).y1((d) => y(d.tpr)).curve(d3.curveMonotoneX)
    const line = d3.line<{ fpr: number; tpr: number }>()
      .x((d) => x(d.fpr)).y((d) => y(d.tpr)).curve(d3.curveMonotoneX)

    const grad = svg.append('defs').append('linearGradient').attr('id', 'roc-grad').attr('x1', '0').attr('y1', '0').attr('x2', '0').attr('y2', '1')
    grad.append('stop').attr('offset', '0%').attr('stop-color', ACCENT).attr('stop-opacity', 0.35)
    grad.append('stop').attr('offset', '100%').attr('stop-color', ACCENT).attr('stop-opacity', 0.02)

    svg.append('path').datum(data.roc_curve).attr('fill', 'url(#roc-grad)').attr('d', area)
    const path = svg.append('path').datum(data.roc_curve).attr('fill', 'none').attr('stroke', ACCENT_DEEP).attr('stroke-width', 2.5).attr('d', line)
    const len = (path.node() as SVGPathElement).getTotalLength()
    path.attr('stroke-dasharray', `${len} ${len}`).attr('stroke-dashoffset', len)
      .transition().duration(900).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0)

    svg.append('text').attr('x', W - m.right).attr('y', H - 6).attr('text-anchor', 'end').attr('fill', AXIS).attr('font-size', 10).text('False positive rate')
  }, [data])
  return <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="d3-chart" role="img" aria-label="ROC curve" />
}

export function CalibrationCurve({ data }: { data: MLValidation }) {
  const W = 320
  const H = 240
  const m = { top: 16, right: 16, bottom: 34, left: 40 }
  const ref = useChart<SVGSVGElement>((svg) => {
    const max = Math.max(0.5, d3.max(data.calibration, (d) => Math.max(d.predicted, d.observed)) ?? 0.5)
    const x = d3.scaleLinear([0, max], [m.left, W - m.right])
    const y = d3.scaleLinear([0, max], [H - m.bottom, m.top])

    svg.append('g').attr('transform', `translate(0,${H - m.bottom})`).call(d3.axisBottom(x).ticks(4))
      .call((g) => g.select('.domain').attr('stroke', AXIS)).call((g) => g.selectAll('text').attr('fill', AXIS).attr('font-size', 10)).call((g) => g.selectAll('.tick line').attr('stroke', GRID))
    svg.append('g').attr('transform', `translate(${m.left},0)`).call(d3.axisLeft(y).ticks(4))
      .call((g) => g.select('.domain').attr('stroke', AXIS)).call((g) => g.selectAll('text').attr('fill', AXIS).attr('font-size', 10)).call((g) => g.selectAll('.tick line').attr('stroke', GRID))

    svg.append('line').attr('x1', x(0)).attr('y1', y(0)).attr('x2', x(max)).attr('y2', y(max))
      .attr('stroke', 'rgba(148,163,184,0.5)').attr('stroke-dasharray', '4 4')

    const line = d3.line<{ predicted: number; observed: number }>().x((d) => x(d.predicted)).y((d) => y(d.observed)).curve(d3.curveMonotoneX)
    svg.append('path').datum(data.calibration).attr('fill', 'none').attr('stroke', ACCENT_DEEP).attr('stroke-width', 2.5).attr('d', line)
    svg.selectAll('circle').data(data.calibration).join('circle')
      .attr('cx', (d) => x(d.predicted)).attr('cy', (d) => y(d.observed)).attr('r', 0)
      .attr('fill', ACCENT).attr('stroke', '#0c1219').attr('stroke-width', 1)
      .transition().delay((_, i) => i * 40).attr('r', 3.5)

    svg.append('text').attr('x', W - m.right).attr('y', H - 6).attr('text-anchor', 'end').attr('fill', AXIS).attr('font-size', 10).text('Predicted PD')
  }, [data])
  return <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="d3-chart" role="img" aria-label="Calibration curve" />
}

export function GainsChart({ data }: { data: MLValidation }) {
  const W = 320
  const H = 240
  const m = { top: 16, right: 16, bottom: 34, left: 40 }
  const ref = useChart<SVGSVGElement>((svg) => {
    const x = d3.scaleBand(data.gains.map((d) => String(d.decile)), [m.left, W - m.right]).padding(0.28)
    const y = d3.scaleLinear([0, 1], [H - m.bottom, m.top])

    svg.append('g').attr('transform', `translate(0,${H - m.bottom})`).call(d3.axisBottom(x))
      .call((g) => g.select('.domain').attr('stroke', AXIS)).call((g) => g.selectAll('text').attr('fill', AXIS).attr('font-size', 10)).call((g) => g.selectAll('.tick line').remove())
    svg.append('g').attr('transform', `translate(${m.left},0)`).call(d3.axisLeft(y).ticks(4).tickFormat(d3.format('.0%')).tickSize(-(W - m.left - m.right)))
      .call((g) => g.select('.domain').remove()).call((g) => g.selectAll('.tick line').attr('stroke', GRID)).call((g) => g.selectAll('text').attr('fill', AXIS).attr('font-size', 10))

    svg.selectAll('rect').data(data.gains).join('rect')
      .attr('x', (d) => x(String(d.decile))!).attr('width', x.bandwidth())
      .attr('y', H - m.bottom).attr('height', 0).attr('rx', 3).attr('fill', ACCENT)
      .transition().delay((_, i) => i * 50).duration(600).ease(d3.easeCubicOut)
      .attr('y', (d) => y(d.capture)).attr('height', (d) => H - m.bottom - y(d.capture))

    svg.append('text').attr('x', W - m.right).attr('y', H - 6).attr('text-anchor', 'end').attr('fill', AXIS).attr('font-size', 10).text('Score decile (best -> worst)')
  }, [data])
  return <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="d3-chart" role="img" aria-label="Cumulative bad-capture by decile" />
}

export function AttributionBars({ rows }: { rows: { feature: string; points: number; direction: string }[] }) {
  const top = rows.slice(0, 8)
  const W = 340
  const rowH = 26
  const H = top.length * rowH + 12
  const m = { left: 130, right: 44 }
  const ref = useChart<SVGSVGElement>((svg) => {
    const maxAbs = d3.max(top, (d) => Math.abs(d.points)) ?? 1
    const x = d3.scaleLinear([-maxAbs, maxAbs], [m.left, W - m.right])
    const mid = x(0)

    svg.append('line').attr('x1', mid).attr('x2', mid).attr('y1', 4).attr('y2', H - 4).attr('stroke', GRID)

    const g = svg.selectAll('g.bar').data(top).join('g').attr('transform', (_, i) => `translate(0,${i * rowH + 6})`)
    g.append('text').attr('x', m.left - 8).attr('y', rowH / 2).attr('dy', '0.32em').attr('text-anchor', 'end')
      .attr('fill', 'rgba(226,232,240,0.8)').attr('font-size', 10.5).text((d) => d.feature)
    g.append('rect').attr('y', 4).attr('height', rowH - 12).attr('rx', 3)
      .attr('fill', (d) => (d.direction === 'protective' ? ACCENT : RISK))
      .attr('x', mid).attr('width', 0)
      .transition().delay((_, i) => i * 45).duration(500)
      .attr('x', (d) => (d.points >= 0 ? mid : x(d.points)))
      .attr('width', (d) => Math.abs(x(d.points) - mid))
    g.append('text').attr('y', rowH / 2).attr('dy', '0.32em').attr('font-size', 10).attr('fill', 'rgba(226,232,240,0.7)')
      .attr('x', (d) => (d.points >= 0 ? x(d.points) + 5 : x(d.points) - 5))
      .attr('text-anchor', (d) => (d.points >= 0 ? 'start' : 'end'))
      .text((d) => (d.points >= 0 ? `+${d.points}` : `${d.points}`))
  }, [rows])
  return <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="d3-chart" role="img" aria-label="Feature attribution" />
}
