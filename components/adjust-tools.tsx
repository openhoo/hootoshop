"use client"

import { useState, useRef } from "react"
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal2,
  FlipVertical2,
  Sun,
  Contrast,
  Droplets,
  Focus,
  Check,
  RotateCcw as ResetIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface AdjustToolsProps {
  imageSrc: string
  originalWidth: number
  originalHeight: number
  onApplyTransform: (newDataUrl: string, newW: number, newH: number) => void
}

interface Adjustments {
  brightness: number
  contrast: number
  saturation: number
  blur: number
}

const defaultAdj: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
}

function cssFilter(adj: Adjustments): string {
  const parts: string[] = []
  parts.push(`brightness(${1 + adj.brightness / 100})`)
  parts.push(`contrast(${1 + adj.contrast / 100})`)
  parts.push(`saturate(${1 + adj.saturation / 100})`)
  if (adj.blur > 0) parts.push(`blur(${adj.blur}px)`)
  return parts.join(" ")
}

export function AdjustTools({
  imageSrc,
  originalWidth,
  originalHeight,
  onApplyTransform,
}: AdjustToolsProps) {
  const [adjustments, setAdjustments] = useState<Adjustments>({ ...defaultAdj })
  const applyCanvasRef = useRef<HTMLCanvasElement>(null)

  const update = (key: keyof Adjustments, value: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }))
  }

  // ---------- helpers for canvas-based transforms ----------
  function loadImg(): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = imageSrc
    })
  }

  // ---------- immediate transforms ----------
  const handleRotateCW = async () => {
    const img = await loadImg()
    const c = document.createElement("canvas")
    c.width = img.naturalHeight
    c.height = img.naturalWidth
    const ctx = c.getContext("2d")!
    ctx.translate(c.width, 0)
    ctx.rotate(Math.PI / 2)
    ctx.drawImage(img, 0, 0)
    onApplyTransform(c.toDataURL("image/png"), c.width, c.height)
  }

  const handleRotateCCW = async () => {
    const img = await loadImg()
    const c = document.createElement("canvas")
    c.width = img.naturalHeight
    c.height = img.naturalWidth
    const ctx = c.getContext("2d")!
    ctx.translate(0, c.height)
    ctx.rotate(-Math.PI / 2)
    ctx.drawImage(img, 0, 0)
    onApplyTransform(c.toDataURL("image/png"), c.width, c.height)
  }

  const handleFlipH = async () => {
    const img = await loadImg()
    const c = document.createElement("canvas")
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    const ctx = c.getContext("2d")!
    ctx.translate(c.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(img, 0, 0)
    onApplyTransform(c.toDataURL("image/png"), c.width, c.height)
  }

  const handleFlipV = async () => {
    const img = await loadImg()
    const c = document.createElement("canvas")
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    const ctx = c.getContext("2d")!
    ctx.translate(0, c.height)
    ctx.scale(1, -1)
    ctx.drawImage(img, 0, 0)
    onApplyTransform(c.toDataURL("image/png"), c.width, c.height)
  }

  // ---------- bake adjustments into pixels ----------
  const handleApply = async () => {
    const img = await loadImg()
    const c = applyCanvasRef.current ?? document.createElement("canvas")
    c.width = originalWidth
    c.height = originalHeight
    const ctx = c.getContext("2d")!

    // Apply pixel-level adjustments manually for maximum compatibility
    ctx.drawImage(img, 0, 0, originalWidth, originalHeight)
    const imageData = ctx.getImageData(0, 0, originalWidth, originalHeight)
    const data = imageData.data

    const br = adjustments.brightness / 100
    const ct = 1 + adjustments.contrast / 100
    const sat = 1 + adjustments.saturation / 100

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      // Brightness
      r = r + br * 255
      g = g + br * 255
      b = b + br * 255

      // Contrast (around 128)
      r = (r - 128) * ct + 128
      g = (g - 128) * ct + 128
      b = (b - 128) * ct + 128

      // Saturation (luminance-preserving)
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
      r = lum + (r - lum) * sat
      g = lum + (g - lum) * sat
      b = lum + (b - lum) * sat

      data[i] = Math.max(0, Math.min(255, r))
      data[i + 1] = Math.max(0, Math.min(255, g))
      data[i + 2] = Math.max(0, Math.min(255, b))
    }

    ctx.putImageData(imageData, 0, 0)

    // Apply blur if any using OffscreenCanvas or ctx.filter as a second pass
    if (adjustments.blur > 0) {
      const blurCanvas = document.createElement("canvas")
      blurCanvas.width = originalWidth
      blurCanvas.height = originalHeight
      const bCtx = blurCanvas.getContext("2d")!
      bCtx.filter = `blur(${adjustments.blur}px)`
      bCtx.drawImage(c, 0, 0)
      bCtx.filter = "none"
      // Copy blurred result back
      ctx.clearRect(0, 0, originalWidth, originalHeight)
      ctx.drawImage(blurCanvas, 0, 0)
    }

    onApplyTransform(c.toDataURL("image/png"), originalWidth, originalHeight)
    setAdjustments({ ...defaultAdj })
  }

  const handleReset = () => setAdjustments({ ...defaultAdj })

  const hasAdj =
    adjustments.brightness !== 0 ||
    adjustments.contrast !== 0 ||
    adjustments.saturation !== 0 ||
    adjustments.blur !== 0

  // Build CSS filter string for live preview (on the <img>, not canvas)
  const previewFilter = cssFilter(adjustments)

  const sliders: {
    key: keyof Adjustments
    label: string
    icon: React.ReactNode
    min: number
    max: number
    step: number
  }[] = [
    { key: "brightness", label: "Brightness", icon: <Sun className="w-3.5 h-3.5" />, min: -100, max: 100, step: 1 },
    { key: "contrast", label: "Contrast", icon: <Contrast className="w-3.5 h-3.5" />, min: -100, max: 100, step: 1 },
    { key: "saturation", label: "Saturation", icon: <Droplets className="w-3.5 h-3.5" />, min: -100, max: 100, step: 1 },
    { key: "blur", label: "Blur", icon: <Focus className="w-3.5 h-3.5" />, min: 0, max: 20, step: 0.5 },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full p-4">
      {/* Live preview using CSS filter on <img> -- works in all browsers */}
      <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
        <img
          src={imageSrc}
          alt="Adjustment preview"
          className="max-w-full max-h-[50vh] lg:max-h-[60vh] rounded-lg border border-glass-border object-contain"
          style={{ filter: previewFilter, transition: "filter 0.05s ease" }}
          draggable={false}
        />
      </div>

      {/* Hidden canvas for apply */}
      <canvas ref={applyCanvasRef} className="hidden" aria-hidden="true" />

      {/* Controls sidebar */}
      <div className="w-full lg:w-72 shrink-0 space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
        {/* Transform (Rotate / Flip) */}
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Transform
          </h3>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={handleRotateCCW}
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-lg bg-secondary/30 text-muted-foreground
                hover:text-foreground hover:bg-secondary/50 transition-colors"
              aria-label="Rotate 90 degrees counter-clockwise"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-[10px]">-90</span>
            </button>
            <button
              onClick={handleRotateCW}
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-lg bg-secondary/30 text-muted-foreground
                hover:text-foreground hover:bg-secondary/50 transition-colors"
              aria-label="Rotate 90 degrees clockwise"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-[10px]">+90</span>
            </button>
            <button
              onClick={handleFlipH}
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-lg bg-secondary/30 text-muted-foreground
                hover:text-foreground hover:bg-secondary/50 transition-colors"
              aria-label="Flip horizontally"
            >
              <FlipHorizontal2 className="w-4 h-4" />
              <span className="text-[10px]">Flip H</span>
            </button>
            <button
              onClick={handleFlipV}
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-lg bg-secondary/30 text-muted-foreground
                hover:text-foreground hover:bg-secondary/50 transition-colors"
              aria-label="Flip vertically"
            >
              <FlipVertical2 className="w-4 h-4" />
              <span className="text-[10px]">Flip V</span>
            </button>
          </div>
        </div>

        {/* Adjustments */}
        <div className="glass-panel rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Adjustments
          </h3>

          {sliders.map(({ key, label, icon, min, max, step }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  {icon}
                  {label}
                </label>
                <button
                  className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors min-w-[3rem] text-right"
                  onClick={() => update(key, key === "blur" ? 0 : 0)}
                  aria-label={`Reset ${label}`}
                >
                  {key === "blur"
                    ? `${adjustments[key].toFixed(1)}px`
                    : `${adjustments[key] > 0 ? "+" : ""}${adjustments[key]}`}
                </button>
              </div>
              <Slider
                value={[adjustments[key]]}
                onValueChange={(vals: number[]) => update(key, vals[0])}
                min={min}
                max={max}
                step={step}
                aria-label={`${label} adjustment`}
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasAdj}
            className="flex-1 gap-1.5 bg-secondary/30 border-glass-border hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
            aria-label="Reset adjustments"
          >
            <ResetIcon className="w-3.5 h-3.5" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!hasAdj}
            className="flex-1 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            aria-label="Apply adjustments"
          >
            <Check className="w-3.5 h-3.5" />
            Apply
          </Button>
        </div>
      </div>
    </div>
  )
}
