import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { StarsBackground } from '@/components/ui/stars'
import { CountAnimation } from '@/components/ui/count-animation'
import { FireworksBackground } from '@/components/ui/fireworks-show'
import { Balloons } from '@/components/ui/balloons'
import { SparklesText } from '@/components/ui/sparkles-text'
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
        })
      }

      particlesRef.current = particles
    }

    const pulseRings = []
    const PULSE_INTERVAL = 1.8
    let nextPulse = 3

    function drawHeartRing(cx, cy, scale, ringScale, alpha) {
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
      ctx.lineWidth = 1.5
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
        drawHeartRing(w / 2, h / 2, scale, ringScale, alpha)
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

        const drawX = p.arrived ? p.targetX + dx * breathe + Math.cos(p.angle) * wave : p.x
        const drawY = p.arrived ? p.targetY + dy * breathe + Math.sin(p.angle) * wave : p.y

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
function App() {
  const [phase, setPhase] = useState('popup')
  const [countDone, setCountDone] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const [hideStars, setHideStars] = useState(false)
  const [showGreeting, setShowGreeting] = useState(false)
  const balloonsRef = useRef(null)

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
              <SparklesText
                text="Нажми, когда будешь готова"
                className="popup-sparkle-text"
                sparklesCount={6}
                colors={{ first: 'rgba(255,255,255,0.6)', second: 'rgba(255,255,255,0.3)' }}
              />
              <button
                type="button"
                className="start-button"
                onClick={handleStart}
              >
                открыть
              </button>
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
                text="С Днём Рождения 🎁"
                className="greeting-sparkle-text"
                sparklesCount={12}
                colors={{ first: '#d2647a', second: '#e8a0b0' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
