"use client"

import { Check, Lock, Maximize2, Target, Unlock } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  dimensionsForScale,
  dimensionsForTargetBytes,
  estimateResizedBytes,
  formatBytes,
  getDataUrlByteSize,
} from "@/lib/image-sizing"

interface ResizeToolProps {
  imageSrc: string
  originalWidth: number
  originalHeight: number
  resizeWidth: number
  resizeHeight: number
  onResize: (width: number, height: number) => void
  onApplyResize: () => void
}

const PRESETS = [
  { label: "Original", w: 0, h: 0 },
  { label: "1920 x 1080", w: 1920, h: 1080 },
  { label: "1280 x 720", w: 1280, h: 720 },
  { label: "1080 x 1080", w: 1080, h: 1080 },
  { label: "800 x 600", w: 800, h: 600 },
  { label: "640 x 480", w: 640, h: 480 },
]

export function ResizeTool({
  imageSrc,
  originalWidth,
  originalHeight,
  resizeWidth,
  resizeHeight,
  onResize,
  onApplyResize,
}: ResizeToolProps) {
  const [lockAspect, setLockAspect] = useState(true)
  const aspectRatio = originalWidth / originalHeight

  // Track actual file size of the current source
  const dataUrlBytes = useMemo(() => {
    return getDataUrlByteSize(imageSrc)
  }, [imageSrc])
  const [fetchedSourceBytes, setFetchedSourceBytes] = useState(0)
  const sourceBytes = dataUrlBytes ?? fetchedSourceBytes

  // Target file size mode
  const [targetMode, setTargetMode] = useState(false)
  const [targetSizeKB, setTargetSizeKB] = useState("")

  // Measure source size
  useEffect(() => {
    if (!imageSrc || dataUrlBytes !== null) return

    let cancelled = false
    fetch(imageSrc)
      .then((r) => r.blob())
      .then((b) => {
        if (!cancelled) setFetchedSourceBytes(b.size)
      })
      .catch(() => {
        if (!cancelled) setFetchedSourceBytes(0)
      })
    return () => {
      cancelled = true
    }
  }, [imageSrc, dataUrlBytes])

  const estimatedBytes = estimateResizedBytes(
    sourceBytes,
    originalWidth,
    originalHeight,
    resizeWidth,
    resizeHeight
  )

  const sizeRatio = sourceBytes > 0 ? ((estimatedBytes / sourceBytes) * 100).toFixed(0) : "---"

  const handleWidthChange = useCallback(
    (value: string) => {
      const w = Math.max(1, Math.min(10000, parseInt(value, 10) || 0))
      if (lockAspect) {
        onResize(w, Math.round(w / aspectRatio))
      } else {
        onResize(w, resizeHeight)
      }
    },
    [lockAspect, aspectRatio, resizeHeight, onResize]
  )

  const handleHeightChange = useCallback(
    (value: string) => {
      const h = Math.max(1, Math.min(10000, parseInt(value, 10) || 0))
      if (lockAspect) {
        onResize(Math.round(h * aspectRatio), h)
      } else {
        onResize(resizeWidth, h)
      }
    },
    [lockAspect, aspectRatio, resizeWidth, onResize]
  )

  const handleScaleChange = useCallback(
    (values: number[]) => {
      const { width, height } = dimensionsForScale(originalWidth, originalHeight, values[0])
      onResize(width, height)
    },
    [originalWidth, originalHeight, onResize]
  )

  const handlePreset = (w: number, h: number) => {
    if (w === 0 && h === 0) {
      onResize(originalWidth, originalHeight)
    } else {
      onResize(w, h)
    }
  }

  // Target file size: binary search for the scale that produces that size
  const applyTargetSize = useCallback(() => {
    const targetBytes = (parseFloat(targetSizeKB) || 0) * 1024
    if (targetBytes <= 0 || sourceBytes <= 0) return

    const dimensions = dimensionsForTargetBytes(
      sourceBytes,
      originalWidth,
      originalHeight,
      targetBytes
    )
    if (!dimensions) return

    onResize(dimensions.width, dimensions.height)
  }, [targetSizeKB, sourceBytes, originalWidth, originalHeight, onResize])

  const scalePercent = Math.round((resizeWidth / originalWidth) * 100)

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full p-4">
      {/* Preview */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="relative max-w-full max-h-full">
          <img
            src={imageSrc}
            alt="Rescale preview"
            className="max-w-full max-h-[50vh] lg:max-h-[60vh] object-contain rounded-lg"
            draggable={false}
          />
          <div className="absolute bottom-3 right-3 glass-panel rounded-md px-2.5 py-1.5 text-xs font-mono text-foreground">
            {resizeWidth} x {resizeHeight}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full lg:w-72 shrink-0 space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
        {/* Dimension Inputs */}
        <div className="glass-panel rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Dimensions
          </h3>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <label htmlFor="resize-width" className="text-xs text-muted-foreground">
                Width
              </label>
              <input
                id="resize-width"
                type="number"
                value={resizeWidth}
                onChange={(e) => handleWidthChange(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-input text-foreground text-sm font-mono
                  border border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary/30
                  outline-none transition-colors"
                min={1}
                max={10000}
                aria-label="Width in pixels"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLockAspect(!lockAspect)}
              className="mb-0.5 text-muted-foreground hover:text-foreground h-9 w-9"
              aria-label={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
            >
              {lockAspect ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </Button>

            <div className="flex-1 space-y-1.5">
              <label htmlFor="resize-height" className="text-xs text-muted-foreground">
                Height
              </label>
              <input
                id="resize-height"
                type="number"
                value={resizeHeight}
                onChange={(e) => handleHeightChange(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-input text-foreground text-sm font-mono
                  border border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary/30
                  outline-none transition-colors"
                min={1}
                max={10000}
                aria-label="Height in pixels"
              />
            </div>
          </div>

          {/* Scale Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Scale</span>
              <span className="text-xs font-mono text-foreground">{scalePercent}%</span>
            </div>
            <Slider
              value={[scalePercent]}
              onValueChange={handleScaleChange}
              min={1}
              max={300}
              step={1}
              aria-label="Scale percentage"
            />
          </div>
        </div>

        {/* File Size Info */}
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            File Size
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Current
              </span>
              <p className="text-sm font-mono text-foreground">{formatBytes(sourceBytes)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Estimated
              </span>
              <p className="text-sm font-mono text-foreground">~{formatBytes(estimatedBytes)}</p>
            </div>
          </div>
          {/* Size change indicator */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-secondary/30 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  estimatedBytes > sourceBytes
                    ? "bg-destructive/70"
                    : estimatedBytes < sourceBytes
                      ? "bg-chart-4"
                      : "bg-primary/50"
                }`}
                style={{
                  width: `${Math.min(100, sourceBytes > 0 ? (estimatedBytes / sourceBytes) * 100 : 100)}%`,
                }}
              />
            </div>
            <span
              className={`text-xs font-mono ${
                estimatedBytes > sourceBytes
                  ? "text-destructive"
                  : estimatedBytes < sourceBytes
                    ? "text-chart-4"
                    : "text-muted-foreground"
              }`}
            >
              {sizeRatio}%
            </span>
          </div>

          {/* Target file size */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setTargetMode(!targetMode)}
              className={`w-full flex items-center gap-2.5 text-xs transition-colors ${
                targetMode ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={targetMode}
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                  targetMode ? "bg-primary/20" : "bg-secondary/30"
                }`}
              >
                <Target className="w-3 h-3" />
              </div>
              <span className="font-medium">Target File Size</span>
              <div
                className={`ml-auto w-8 h-4 rounded-full relative transition-colors ${
                  targetMode ? "bg-primary" : "bg-secondary/50"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-foreground transition-transform ${
                    targetMode ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>

            {targetMode && (
              <div className="mt-3 flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor="target-size"
                    className="text-[10px] uppercase tracking-wider text-muted-foreground"
                  >
                    Target (KB)
                  </label>
                  <input
                    id="target-size"
                    type="number"
                    value={targetSizeKB}
                    onChange={(e) => setTargetSizeKB(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyTargetSize()
                    }}
                    placeholder={Math.round(sourceBytes / 1024).toString()}
                    className="w-full h-8 px-2.5 rounded-lg bg-input text-foreground text-sm font-mono
                      border border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary/30
                      outline-none transition-colors"
                    min={1}
                    aria-label="Target file size in kilobytes"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={applyTargetSize}
                  disabled={!targetSizeKB || parseFloat(targetSizeKB) <= 0}
                  className="h-8 bg-secondary/30 border-glass-border hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                >
                  Apply
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Presets */}
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Maximize2 className="w-3 h-3" />
            Presets
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => {
              const isActive =
                (preset.w === 0 &&
                  resizeWidth === originalWidth &&
                  resizeHeight === originalHeight) ||
                (preset.w === resizeWidth && preset.h === resizeHeight)
              return (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => handlePreset(preset.w, preset.h)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all
                    ${
                      isActive
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                    }
                  `}
                  aria-label={`Resize to ${preset.label}`}
                  aria-pressed={isActive}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Apply Rescale */}
        <Button
          size="sm"
          onClick={onApplyResize}
          disabled={resizeWidth === originalWidth && resizeHeight === originalHeight}
          className="w-full gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
          aria-label="Apply rescale to image"
        >
          <Check className="w-3.5 h-3.5" />
          Apply Rescale
        </Button>
      </div>
    </div>
  )
}
