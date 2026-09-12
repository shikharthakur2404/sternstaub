// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — sternstaub ✦  (Main Thread Orchestrator)
//
// This file owns ONLY:
//   - React state & derived setters
//   - Worker lifecycle (spawn, message bus, teardown)
//   - OffscreenCanvas handoff to worker
//   - Pointer / shockwave event capture → forwarded to worker
//
// ALL Canvas 2D work, physics, and RAF loop run inside renderer.worker.js.
// This guarantees zero main-thread jank — macOS stays smooth regardless of
// how hard the render worker is running.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react'
import ControlPanel from './components/ControlPanel'
import TelemetryHUD from './components/TelemetryHUD'
import './App.css'

const DEFAULT_PARTICLES = 2200
const INITIAL_PALETTE   = 'etherealGold'
const INITIAL_SHAPE     = 'silhouette'

export default function App() {
  const canvasRef    = useRef(null)
  const workerRef    = useRef(null)
  const fpsBadgeRef  = useRef(null)
  const initDoneRef  = useRef(false)

  // ── React state (drives HUD display only — values forwarded to worker) ──
  const [shape,         setShape]         = useState(INITIAL_SHAPE)
  const [palette,       setPalette]       = useState(INITIAL_PALETTE)
  const [exposure,      setExposure]      = useState(1.0)
  const [dispersion,    setDispersion]    = useState(1.0)
  const [driftSpeed,    setDriftSpeed]    = useState(1.8)
  const [particleCount, setParticleCount] = useState(DEFAULT_PARTICLES)
  const [gravity,       setGravity]       = useState(true)

  // ── Worker factory ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || initDoneRef.current) return

    // Transfer canvas rendering surface to worker (zero-copy).
    // Guard: throws InvalidStateError if called more than once on same element.
    let offscreen
    try {
      offscreen = canvas.transferControlToOffscreen()
    } catch (err) {
      console.error('[sternstaub] OffscreenCanvas transfer failed:', err)
      return
    }

    // Vite ?worker syntax → proper Worker module with tree-shaking
    const worker = new Worker(
      new URL('./workers/renderer.worker.js', import.meta.url),
      { type: 'module' }
    )
    workerRef.current = worker

    // Listen for FPS telemetry back from the render thread
    worker.onmessage = ({ data }) => {
      if (data.type === 'fps' && fpsBadgeRef.current) {
        fpsBadgeRef.current.textContent = `${data.value} FPS`
      }
    }

    // Bootstrap the worker with the OffscreenCanvas + initial config
    // CRITICAL: send real viewport dimensions NOW so the worker sets canvas
    // pixel buffer correctly. Without this the buffer stays at default 300×150
    // and CSS stretch makes every particle appear 4-5× bigger than intended.
    worker.postMessage(
      {
        type:   'init',
        canvas: offscreen,
        width:  canvas.offsetWidth,
        height: canvas.offsetHeight,
        config: {
          palette:       INITIAL_PALETTE,
          shape:         INITIAL_SHAPE,
          exposure:      1.0,
          dispersion:    1.0,
          driftSpeed:    1.8,
          particleCount: DEFAULT_PARTICLES,
          gravity:       true,
        },
      },
      [offscreen]   // transfer (not copy) the canvas
    )

    initDoneRef.current = true

    // Handle viewport resize → inform worker
    const handleResize = () => {
      worker.postMessage({
        type:   'resize',
        width:  canvas.offsetWidth,
        height: canvas.offsetHeight,
      })
    }
    window.addEventListener('resize', handleResize)

    return () => {
      worker.postMessage({ type: 'stop' })
      worker.terminate()
      window.removeEventListener('resize', handleResize)
      initDoneRef.current = false
    }
  }, [])

  // ── Config sync helpers (forward React state deltas to worker) ──
  const postConfig = useCallback((patch) => {
    workerRef.current?.postMessage({ type: 'config', ...patch })
  }, [])

  // Each setter updates both React state (for HUD) and the worker
  const handleShape = useCallback((v) => {
    setShape(v)
    workerRef.current?.postMessage({ type: 'morph', shape: v })
  }, [])

  const handlePalette = useCallback((v) => {
    setPalette(v)
    postConfig({ palette: v })
  }, [postConfig])

  const handleExposure = useCallback((v) => {
    setExposure(v)
    postConfig({ exposure: v })
  }, [postConfig])

  const handleDispersion = useCallback((v) => {
    setDispersion(v)
    postConfig({ dispersion: v })
  }, [postConfig])

  const handleDriftSpeed = useCallback((v) => {
    setDriftSpeed(v)
    postConfig({ driftSpeed: v })
  }, [postConfig])

  const handleParticleCount = useCallback((v) => {
    setParticleCount(v)
    workerRef.current?.postMessage({ type: 'rebuild', particleCount: v })
  }, [])

  const handleGravity = useCallback((v) => {
    setGravity(v)
    postConfig({ gravity: v })
  }, [postConfig])

  const handleReset = useCallback(() => {
    handleShape('silhouette')
    handlePalette('etherealGold')
    handleExposure(1.0)
    handleDispersion(1.0)
    handleDriftSpeed(1.8)
    handleGravity(true)
    postConfig({ exposure: 1.0, dispersion: 1.0, driftSpeed: 1.8, gravity: true })
  }, [handleShape, handlePalette, handleExposure, handleDispersion, handleDriftSpeed, handleGravity, postConfig])

  // ── Shockwave trigger ─────────────────────────────────────────────────────
  const triggerShockwave = useCallback((relX = 0, relY = 0) => {
    workerRef.current?.postMessage({ type: 'shockwave', x: relX, y: relY })
  }, [])

  // ── Pointer event forwarding ──────────────────────────────────────────────
  const handlePointerMove = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    workerRef.current?.postMessage({
      type:   'pointer',
      relX:   e.clientX - rect.left - canvas.offsetWidth  * 0.5,
      relY:   e.clientY - rect.top  - canvas.offsetHeight * 0.5,
      active: true,
    })
  }, [])

  const handlePointerLeave = useCallback(() => {
    workerRef.current?.postMessage({ type: 'pointer', relX: 0, relY: 0, active: false })
  }, [])

  const handlePointerDown = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    triggerShockwave(
      e.clientX - rect.left - canvas.offsetWidth  * 0.5,
      e.clientY - rect.top  - canvas.offsetHeight * 0.5,
    )
  }, [triggerShockwave])

  // ── Global Hotkeys (H: Toggle HUDs, F: Fullscreen, Space: Nova) ────────────
  const [showHud, setShowHud] = useState(true)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return

      if (e.key === 'h' || e.key === 'H') {
        setShowHud(prev => !prev)
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {})
        } else {
          document.exitFullscreen().catch(() => {})
        }
      } else if (e.key === ' ') {
        e.preventDefault()
        triggerShockwave(0, 0)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [triggerShockwave])

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <canvas
        ref={canvasRef}
        className="main-canvas"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
      />
      {showHud && (
        <>
          <TelemetryHUD
            shape={shape}
            particleCount={particleCount}
            exposure={exposure}
          />
          <ControlPanel
            shape={shape}           setShape={handleShape}
            palette={palette}       setPalette={handlePalette}
            exposure={exposure}     setExposure={handleExposure}
            dispersion={dispersion} setDispersion={handleDispersion}
            driftSpeed={driftSpeed} setDriftSpeed={handleDriftSpeed}
            particleCount={particleCount} setParticleCount={handleParticleCount}
            gravity={gravity}       setGravity={handleGravity}
            onReset={handleReset}
            onPulseNova={() => triggerShockwave(0, 0)}
            fpsBadgeRef={fpsBadgeRef}
          />
        </>
      )}
    </div>
  )
}
