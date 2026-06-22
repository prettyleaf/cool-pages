import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { StarsBackground } from '@/components/ui/stars'
import { CountAnimation } from '@/components/ui/count-animation'
import { FireworksBackground } from '@/components/ui/fireworks-show'
import { Balloons } from '@/components/ui/balloons'
import { SparklesText } from '@/components/ui/sparkles-text'
import confetti from 'canvas-confetti'
import './App.css'

function heartX(t) {
  return 16 * Math.pow(Math.sin(t), 3)
}

function heartY(t) {
  return -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
}

// ─── Particle heart ───
function ParticleHeart({ active }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let w, h

    function resize() {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
      initParticles()
    }

    function initParticles() {
      const particles = []
      const count = 280
      const scale = Math.min(w, h) * 0.022

      for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2
        particles.push({
          targetX: w / 2 + heartX(t) * scale,
          targetY: h / 2 + heartY(t) * scale,
          x: w / 2 + (Math.random() - 0.5) * w,
          y: h / 2 + (Math.random() - 0.5) * h,
          size: 1.5 + Math.random() * 2,
          angle: t,
          arrived: false,
        })
      }

      for (let i = 0; i < 180; i++) {
        const t = Math.random() * Math.PI * 2
        const r = Math.random()
        particles.push({
          targetX: w / 2 + heartX(t) * scale * r * 0.85,
          targetY: h / 2 + heartY(t) * scale * r * 0.85,
          x: w / 2 + (Math.random() - 0.5) * w,
          y: h / 2 + (Math.random() - 0.5) * h,
          size: 1 + Math.random() * 1.5,
          angle: t,
          arrived: false,
          inner: true,
          driftPhase: Math.random() * Math.PI * 2,
          driftSpeed: 0.4 + Math.random() * 0.6,
          driftRadius: 4 + Math.random() * 8,
        })
      }

      particlesRef.current = particles
    }

    const pulseRings = []
    const PULSE_INTERVAL = 1.8
    let nextPulse = 3

    function drawHeartRing(cx, cy, scale, ringScale, alpha, progress) {
      const steps = 120
      ctx.beginPath()
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2
        const x = cx + heartX(t) * scale * ringScale
        const y = cy + heartY(t) * scale * ringScale
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = `rgba(210, 100, 120, ${alpha})`
      const thickness = 3.5 * (1 - progress)
      ctx.lineWidth = Math.max(thickness, 0.2)
      ctx.stroke()
    }

    function draw(time) {
      if (!startTimeRef.current) startTimeRef.current = time
      const elapsed = (time - startTimeRef.current) / 1000

      ctx.clearRect(0, 0, w, h)

      const scale = Math.min(w, h) * 0.022

      if (elapsed > nextPulse) {
        pulseRings.push({ birth: elapsed })
        nextPulse = elapsed + PULSE_INTERVAL
      }

      for (let i = pulseRings.length - 1; i >= 0; i--) {
        const age = elapsed - pulseRings[i].birth
        const maxAge = 3
        if (age > maxAge) {
          pulseRings.splice(i, 1)
          continue
        }
        const progress = age / maxAge
        const ringScale = 1 + progress * 2.5
        const alpha = 0.35 * (1 - progress)
        drawHeartRing(w / 2, h / 2, scale, ringScale, alpha, progress)
      }

      const breathe = Math.sin(elapsed * 1.2) * 0.06
      const waveSpeed = 2.5

      particlesRef.current.forEach(p => {
        p.x += (p.targetX - p.x) * 0.03
        p.y += (p.targetY - p.y) * 0.03

        if (Math.hypot(p.x - p.targetX, p.y - p.targetY) < 1) p.arrived = true

        const dx = p.targetX - w / 2
        const dy = p.targetY - h / 2
        const wave = Math.sin(p.angle * 3 + elapsed * waveSpeed) * 3

        let drawX, drawY
        if (!p.arrived) {
          drawX = p.x
          drawY = p.y
        } else if (p.inner) {
          const driftX = Math.sin(elapsed * p.driftSpeed + p.driftPhase) * p.driftRadius
          const driftY = Math.cos(elapsed * p.driftSpeed * 0.7 + p.driftPhase + 1.3) * p.driftRadius
          drawX = p.targetX + dx * breathe + driftX
          drawY = p.targetY + dy * breathe + driftY
        } else {
          drawX = p.targetX + dx * breathe + Math.cos(p.angle) * wave
          drawY = p.targetY + dy * breathe + Math.sin(p.angle) * wave
        }

        const alpha = p.arrived
          ? 0.5 + Math.sin(elapsed * 2 + p.angle * 2) * 0.3
          : 0.3

        const baseR = p.inner ? 180 : 210
        const baseG = p.inner ? 80 : 100
        const baseB = p.inner ? 100 : 120

        ctx.beginPath()
        ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${baseR},${baseG},${baseB},${alpha})`
        ctx.fill()

        if (p.arrived && p.size > 1.8) {
          ctx.beginPath()
          ctx.arc(drawX, drawY, p.size * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${baseR},${baseG},${baseB},${alpha * 0.12})`
          ctx.fill()
        }
      })

      animRef.current = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    animRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [active])

  if (!active) return null

  return (
    <motion.canvas
      ref={canvasRef}
      className="particle-canvas"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    />
  )
}

// ─── App ───
const TARGET_DATE = new Date('2026-07-05T00:00:00+07:00')

function getTimeLeft() {
  const diff = TARGET_DATE - Date.now()
  if (diff <= 0) return null
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { d, h, m, s }
}

function App() {
  const [phase, setPhase] = useState('popup')
  const [countDone, setCountDone] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const [hideStars, setHideStars] = useState(false)
  const [showGreeting, setShowGreeting] = useState(false)
  /// For Production, use the line to enable countdown
  const [ready, setReady] = useState(() => Date.now() >= TARGET_DATE)
  //const [ready, setReady] = useState(true)
  /// For Development, uncomment above to skip countdown
  const [timeLeft, setTimeLeft] = useState(getTimeLeft)
  const [justBecameReady, setJustBecameReady] = useState(false)
  const balloonsRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    if (ready) return
    const id = setInterval(() => {
      const tl = getTimeLeft()
      if (!tl) {
        setJustBecameReady(true)
        setTimeout(() => {
          setReady(true)
          setTimeLeft(null)
        }, 600)
        clearInterval(id)
      } else {
        setTimeLeft(tl)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [ready])

  useEffect(() => {
    if (!ready || !justBecameReady || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const x = (rect.left + rect.width / 2) / window.innerWidth
    const y = (rect.top + rect.height / 2) / window.innerHeight
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { x, y },
      colors: ['#d2647a', '#e8a0b0', '#ffffff', '#f5c6d0'],
      gravity: 0.8,
      scalar: 0.9,
    })
    setJustBecameReady(false)
  }, [ready, justBecameReady])

  const handleStart = useCallback(() => {
    if (balloonsRef.current) {
      balloonsRef.current.launchAnimation()
    }
    requestAnimationFrame(() => {
      document.getAnimations().forEach(anim => {
        if (anim.effect?.target?.closest?.('balloons')) {
          anim.playbackRate = 2
        }
      })
    })
    setPhase('balloons')
    setTimeout(() => {
      setPhase('counting')
    }, 2500)
  }, [])

  const handleCountDone = useCallback(() => {
    setCountDone(true)
    setTimeout(() => {
      setShowFireworks(true)
    }, 600)
    setTimeout(() => {
      setHideStars(true)
    }, 1800)
    setTimeout(() => {
      setShowGreeting(true)
    }, 4000)
  }, [])

  return (
    <div className="app">
      <AnimatePresence>
        {!hideStars && (
          <motion.div
            className="layer-full"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <StarsBackground
              className="flex w-full h-screen justify-center items-center bg-[#0a0a0a]"
              speed={80}
              starColor="rgba(255, 255, 255, 0.6)"
              factor={0.03}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFireworks && (
          <motion.div
            className="layer-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <FireworksBackground className="w-full h-screen">
              <div />
            </FireworksBackground>
          </motion.div>
        )}
      </AnimatePresence>

      <ParticleHeart active={showGreeting} />

      <Balloons ref={balloonsRef} type="default" />

      <AnimatePresence>
        {phase === 'popup' && (
          <motion.div
            className="popup-overlay"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="popup-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <AnimatePresence mode="wait">
                {ready ? (
                  <motion.div
                    key="ready-text"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  >
                    <SparklesText
                      text="Нажми, когда будешь готова"
                      className="popup-sparkle-text"
                      sparklesCount={8}
                      colors={{ first: 'rgba(255,255,255,0.6)', second: 'rgba(255,255,255,0.3)' }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="waiting-text"
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.5 }}
                  >
                    <SparklesText
                      text="Ещё рано"
                      className="popup-sparkle-text"
                      sparklesCount={8}
                      colors={{ first: 'rgba(255,255,255,0.6)', second: 'rgba(255,255,255,0.3)' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {!ready && timeLeft && (
                  <motion.div
                    className="countdown"
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="countdown-segment">{timeLeft.d}<small>д</small></span>
                    <span className="countdown-segment">{String(timeLeft.h).padStart(2, '0')}<small>ч</small></span>
                    <span className="countdown-segment">{String(timeLeft.m).padStart(2, '0')}<small>м</small></span>
                    <span className="countdown-segment">{String(timeLeft.s).padStart(2, '0')}<small>с</small></span>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button
                ref={buttonRef}
                type="button"
                className={`start-button${ready ? '' : ' start-button--disabled'}`}
                onClick={handleStart}
                disabled={!ready}
                animate={ready ? { scale: [0.95, 1.05, 1], opacity: 1 } : { opacity: 0.3 }}
                transition={ready ? { duration: 0.5, ease: 'easeOut' } : {}}
              >
                открыть
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!showGreeting && (phase === 'counting' || phase === 'fireworks') && (
          <motion.div
            className="counter-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              animate={countDone ? { scale: [1, 1.3, 1.15] } : {}}
              transition={countDone ? { duration: 0.5, ease: 'easeOut' } : {}}
            >
              <CountAnimation
                number={20}
                className="counter-number"
                duration={3.5}
                onComplete={handleCountDone}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGreeting && (
          <motion.div
            className="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          >
            <div className="message-line main-greeting">
              <SparklesText
                text="С днём рождения"
                className="greeting-sparkle-text"
                sparklesCount={12}
                colors={{ first: '#d2647a', second: '#e8a0b0' }}
              />
              <div className="greeting-emoji">🎁🎁🎁</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
