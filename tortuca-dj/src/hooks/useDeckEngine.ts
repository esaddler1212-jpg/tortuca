import { useCallback, useEffect, useRef, useState } from 'react'
import { getAudio } from '../lib/library/db'
import type { DeckId } from '../lib/library/types'

interface DeckRuntime {
  trackId: string | null
  buffer: AudioBuffer | null
  source: AudioBufferSourceNode | null
  startedAt: number
  offsetMs: number
  playing: boolean
}

function emptyDeck(): DeckRuntime {
  return {
    trackId: null,
    buffer: null,
    source: null,
    startedAt: 0,
    offsetMs: 0,
    playing: false,
  }
}

export function useDeckEngine() {
  const ctxRef = useRef<AudioContext | null>(null)
  const gainARef = useRef<GainNode | null>(null)
  const gainBRef = useRef<GainNode | null>(null)
  const deckARef = useRef<DeckRuntime>(emptyDeck())
  const deckBRef = useRef<DeckRuntime>(emptyDeck())

  const [deckAId, setDeckAId] = useState<string | null>(null)
  const [deckBId, setDeckBId] = useState<string | null>(null)
  const [playingA, setPlayingA] = useState(false)
  const [playingB, setPlayingB] = useState(false)
  const [positionA, setPositionA] = useState(0)
  const [positionB, setPositionB] = useState(0)
  const [durationA, setDurationA] = useState(0)
  const [durationB, setDurationB] = useState(0)
  const [crossfader, setCrossfader] = useState(0)

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
      gainARef.current = ctxRef.current.createGain()
      gainBRef.current = ctxRef.current.createGain()
      gainARef.current.connect(ctxRef.current.destination)
      gainBRef.current.connect(ctxRef.current.destination)
    }
    if (ctxRef.current.state === 'suspended') {
      void ctxRef.current.resume()
    }
    return ctxRef.current
  }, [])

  const applyCrossfader = useCallback((value: number) => {
    const t = value / 100
    const volA = Math.cos((t * Math.PI) / 2)
    const volB = Math.sin((t * Math.PI) / 2)
    if (gainARef.current) gainARef.current.gain.value = volA
    if (gainBRef.current) gainBRef.current.gain.value = volB
  }, [])

  useEffect(() => {
    applyCrossfader(crossfader)
  }, [crossfader, applyCrossfader])

  const stopSource = (deck: DeckRuntime) => {
    try {
      deck.source?.stop()
    } catch {
      /* already stopped */
    }
    deck.source = null
    deck.playing = false
  }

  const getDeckRef = (id: DeckId) => (id === 'A' ? deckARef : deckBRef)

  const loadTrack = useCallback(
    async (deck: DeckId, trackId: string) => {
      const ctx = ensureContext()
      const blob = await getAudio(trackId)
      if (!blob) throw new Error('No audio file for this track')

      const arrayBuffer = await blob.arrayBuffer()
      const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0))
      const runtime = getDeckRef(deck).current
      stopSource(runtime)
      runtime.trackId = trackId
      runtime.buffer = buffer
      runtime.offsetMs = 0

      if (deck === 'A') {
        setDeckAId(trackId)
        setDurationA(Math.round(buffer.duration * 1000))
        setPositionA(0)
        setPlayingA(false)
      } else {
        setDeckBId(trackId)
        setDurationB(Math.round(buffer.duration * 1000))
        setPositionB(0)
        setPlayingB(false)
      }
    },
    [ensureContext],
  )

  const startDeck = useCallback(
    (deck: DeckId, fromMs = 0) => {
      const ctx = ensureContext()
      const runtime = getDeckRef(deck).current
      const gain = deck === 'A' ? gainARef.current : gainBRef.current
      if (!runtime.buffer || !gain) return

      stopSource(runtime)
      const source = ctx.createBufferSource()
      source.buffer = runtime.buffer
      source.connect(gain)
      const offsetSec = fromMs / 1000
      source.start(0, offsetSec)
      runtime.source = source
      runtime.startedAt = ctx.currentTime
      runtime.offsetMs = fromMs
      runtime.playing = true

      source.onended = () => {
        runtime.playing = false
        if (deck === 'A') setPlayingA(false)
        else setPlayingB(false)
      }

      if (deck === 'A') setPlayingA(true)
      else setPlayingB(true)
    },
    [ensureContext],
  )

  const pauseDeck = useCallback((deck: DeckId) => {
    const ctx = ctxRef.current
    const runtime = getDeckRef(deck).current
    if (!ctx || !runtime.playing) return
    const elapsed = (ctx.currentTime - runtime.startedAt) * 1000
    runtime.offsetMs += elapsed
    stopSource(runtime)
    if (deck === 'A') {
      setPlayingA(false)
      setPositionA(runtime.offsetMs)
    } else {
      setPlayingB(false)
      setPositionB(runtime.offsetMs)
    }
  }, [])

  const getPosition = (deck: DeckId): number => {
    const ctx = ctxRef.current
    const runtime = getDeckRef(deck).current
    if (!runtime.playing || !ctx) return runtime.offsetMs
    return runtime.offsetMs + (ctx.currentTime - runtime.startedAt) * 1000
  }

  useEffect(() => {
    let frame = 0
    const tick = () => {
      if (deckARef.current.playing) setPositionA(getPosition('A'))
      if (deckBRef.current.playing) setPositionB(getPosition('B'))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const crossfadeTo = useCallback(
    async (target: DeckId, durationMs: number) => {
      const other: DeckId = target === 'A' ? 'B' : 'A'
      const runtime = getDeckRef(target).current
      if (!runtime.buffer || !runtime.trackId) return

      const start = crossfader
      const end = target === 'B' ? 100 : 0
      const startTime = performance.now()

      if (!runtime.playing) {
        startDeck(target, runtime.offsetMs)
      }

      return new Promise<void>((resolve) => {
        const animate = (now: number) => {
          const t = Math.min(1, (now - startTime) / durationMs)
          const eased = t * t * (3 - 2 * t)
          const v = start + (end - start) * eased
          setCrossfader(v)
          applyCrossfader(v)
          if (t < 1) requestAnimationFrame(animate)
          else {
            pauseDeck(other)
            resolve()
          }
        }
        requestAnimationFrame(animate)
      })
    },
    [crossfader, applyCrossfader, startDeck, pauseDeck],
  )

  const restartDeck = useCallback(
    (deck: DeckId) => {
      const runtime = getDeckRef(deck).current
      stopSource(runtime)
      runtime.offsetMs = 0
      startDeck(deck, 0)
    },
    [startDeck],
  )

  return {
    deckAId,
    deckBId,
    playingA,
    playingB,
    positionA,
    positionB,
    durationA,
    durationB,
    crossfader,
    setCrossfader,
    loadTrack,
    startDeck,
    pauseDeck,
    crossfadeTo,
    applyCrossfader,
    restartDeck,
  }
}
