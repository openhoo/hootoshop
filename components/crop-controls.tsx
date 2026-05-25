"use client"

import { AlignCenter, Check, RotateCcw } from "lucide-react"
import type { CropRegion } from "@/components/crop-tool"
import { Button } from "@/components/ui/button"

interface CropControlsProps {
  cropRegion: CropRegion
  originalWidth: number
  originalHeight: number
  onAspectRatio: (ratio: string) => void
  onApplyCrop: () => void
  onResetCrop: () => void
  selectedAspect: string
  keepCentered: boolean
  onKeepCenteredChange: (centered: boolean) => void
  onManualDimensionChange: (width: number, height: number) => void
  aspectRatioValue: number | null
}

const ASPECT_RATIOS = [
  { label: "Free", value: "free" },
  { label: "1:1", value: "1:1" },
  { label: "4:3", value: "4:3" },
  { label: "16:9", value: "16:9" },
  { label: "3:2", value: "3:2" },
  { label: "9:16", value: "9:16" },
]

export function CropControls({
  cropRegion,
  originalWidth,
  originalHeight,
  onAspectRatio,
  onApplyCrop,
  onResetCrop,
  selectedAspect,
  keepCentered,
  onKeepCenteredChange,
  onManualDimensionChange,
  aspectRatioValue,
}: CropControlsProps) {
  const handleWidthCommit = (value: string) => {
    const w = Math.max(20, Math.min(originalWidth, parseInt(value, 10) || 20))
    let h: number
    if (aspectRatioValue !== null) {
      h = Math.round(w / aspectRatioValue)
    } else {
      h = Math.round(cropRegion.height)
    }
    h = Math.max(20, Math.min(originalHeight, h))
    const finalW = aspectRatioValue !== null ? Math.round(h * aspectRatioValue) : w
    onManualDimensionChange(Math.max(20, Math.min(originalWidth, finalW)), h)
  }

  const handleHeightCommit = (value: string) => {
    const h = Math.max(20, Math.min(originalHeight, parseInt(value, 10) || 20))
    let w: number
    if (aspectRatioValue !== null) {
      w = Math.round(h * aspectRatioValue)
    } else {
      w = Math.round(cropRegion.width)
    }
    w = Math.max(20, Math.min(originalWidth, w))
    const finalH = aspectRatioValue !== null ? Math.round(w / aspectRatioValue) : h
    onManualDimensionChange(w, Math.max(20, Math.min(originalHeight, finalH)))
  }

  return (
    <div className="w-full lg:w-72 shrink-0 space-y-5 p-4 lg:p-0">
      {/* Crop Dimensions - Editable */}
      <div className="glass-panel rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Crop Region
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">X</span>
            <p className="text-sm font-mono text-foreground">{Math.round(cropRegion.x)}px</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Y</span>
            <p className="text-sm font-mono text-foreground">{Math.round(cropRegion.y)}px</p>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="crop-width"
              className="text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              Width
            </label>
            <input
              id="crop-width"
              type="number"
              value={Math.round(cropRegion.width).toString()}
              onChange={(e) => handleWidthCommit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleWidthCommit(e.currentTarget.value)
              }}
              className="w-full h-8 px-2.5 rounded-lg bg-input text-foreground text-sm font-mono
                border border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary/30
                outline-none transition-colors"
              min={20}
              max={originalWidth}
              aria-label="Crop width in pixels"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="crop-height"
              className="text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              Height
            </label>
            <input
              id="crop-height"
              type="number"
              value={Math.round(cropRegion.height).toString()}
              onChange={(e) => handleHeightCommit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleHeightCommit(e.currentTarget.value)
              }}
              className="w-full h-8 px-2.5 rounded-lg bg-input text-foreground text-sm font-mono
                border border-transparent focus:border-primary/50 focus:ring-1 focus:ring-primary/30
                outline-none transition-colors"
              min={20}
              max={originalHeight}
              aria-label="Crop height in pixels"
            />
          </div>
        </div>
      </div>

      {/* Aspect Ratios */}
      <div className="glass-panel rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Aspect Ratio
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              type="button"
              key={ratio.value}
              onClick={() => onAspectRatio(ratio.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all
                ${
                  selectedAspect === ratio.value
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
                }
              `}
              aria-label={`Set aspect ratio to ${ratio.label}`}
              aria-pressed={selectedAspect === ratio.value}
            >
              {ratio.label}
            </button>
          ))}
        </div>
      </div>

      {/* Keep Centered Toggle */}
      <div className="glass-panel rounded-xl p-4">
        <button
          type="button"
          onClick={() => onKeepCenteredChange(!keepCentered)}
          className={`w-full flex items-center gap-3 text-sm transition-colors ${
            keepCentered ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={keepCentered}
          aria-label="Keep crop centered on the image"
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              keepCentered ? "bg-primary/20" : "bg-secondary/30"
            }`}
          >
            <AlignCenter className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="font-medium">Keep Centered</span>
            <p className="text-xs text-muted-foreground mt-0.5">Lock crop to image center</p>
          </div>
          <div
            className={`ml-auto w-9 h-5 rounded-full relative transition-colors ${
              keepCentered ? "bg-primary" : "bg-secondary/50"
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${
                keepCentered ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onResetCrop}
          className="flex-1 gap-1.5 bg-secondary/30 border-glass-border hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
          aria-label="Reset crop to full image"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </Button>
        <Button
          size="sm"
          onClick={onApplyCrop}
          className="flex-1 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
          aria-label="Apply crop"
        >
          <Check className="w-3.5 h-3.5" />
          Apply Crop
        </Button>
      </div>
    </div>
  )
}
