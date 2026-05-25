"use client"

import { Download, FileImage, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatBytes } from "@/lib/image-sizing"

export type ExportFormat = "png" | "jpeg" | "webp"

export interface ExportOptions {
  format: ExportFormat
  quality: number // 0-1, ignored for png
}

interface ExportMenuProps {
  onExport: (options: ExportOptions) => Promise<void> | void
  /** Get estimated file size for given options. Optional. */
  estimateSize?: (options: ExportOptions) => Promise<number | null>
  /** Base file name (without extension), used for the filename preview. */
  baseName: string
  modKey: string
}

interface FormatInfo {
  id: ExportFormat
  label: string
  ext: string
  description: string
  lossless: boolean
}

const FORMATS: FormatInfo[] = [
  { id: "png", label: "PNG", ext: "png", description: "Lossless, transparent", lossless: true },
  { id: "jpeg", label: "JPEG", ext: "jpg", description: "Compressed, no alpha", lossless: false },
  { id: "webp", label: "WebP", ext: "webp", description: "Modern, efficient", lossless: false },
]

function ShortcutKbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-foreground/10 text-[10px] font-mono text-muted-foreground border border-foreground/5">
      {children}
    </kbd>
  )
}

export function ExportMenu({ onExport, estimateSize, baseName, modKey }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>("png")
  const [quality, setQuality] = useState(0.92)
  const [isExporting, setIsExporting] = useState(false)
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null)
  const [isEstimating, setIsEstimating] = useState(false)

  const currentFormat = FORMATS.find((f) => f.id === format) ?? FORMATS[0]
  const fileName = `${baseName}-edited.${currentFormat.ext}`

  // Debounced size estimation
  const estimateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!open || !estimateSize) return
    if (estimateTimer.current) clearTimeout(estimateTimer.current)

    estimateTimer.current = setTimeout(async () => {
      setIsEstimating(true)
      try {
        const size = await estimateSize({ format, quality })
        setEstimatedSize(size)
      } catch {
        setEstimatedSize(null)
      } finally {
        setIsEstimating(false)
      }
    }, 150)

    return () => {
      if (estimateTimer.current) clearTimeout(estimateTimer.current)
    }
  }, [open, format, quality, estimateSize])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport({ format, quality })
      setOpen(false)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-lg shadow-primary/20"
              aria-label="Export image"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="flex items-center gap-2 glass-panel text-foreground border-glass-border"
        >
          <span>Export image</span>
          <span className="flex items-center gap-0.5">
            <ShortcutKbd>{modKey}</ShortcutKbd>
            <ShortcutKbd>S</ShortcutKbd>
          </span>
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 border shadow-2xl rounded-xl
          bg-[oklch(0.11_0.018_250_/_0.96)]
          border-[oklch(0.55_0.03_250_/_0.28)]
          backdrop-blur-2xl backdrop-saturate-150
          shadow-[0_20px_60px_-12px_oklch(0_0_0_/_0.6),0_0_40px_-12px_oklch(0.74_0.16_220_/_0.15),inset_0_1px_0_0_oklch(0.99_0_0_/_0.08)]"
      >
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
              <FileImage className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">Export image</div>
              <div className="text-[11px] text-muted-foreground font-mono truncate">{fileName}</div>
            </div>
          </div>

          {/* Format selection */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Format
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {FORMATS.map((f) => {
                const active = f.id === format
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    aria-pressed={active}
                    className={`flex flex-col items-center justify-center gap-0.5 p-2 rounded-lg border transition-all
                      ${
                        active
                          ? "bg-primary/15 border-primary/40 text-primary shadow-sm shadow-primary/10"
                          : "bg-secondary/30 border-glass-border text-foreground hover:bg-secondary/50 hover:border-foreground/20"
                      }`}
                  >
                    <span className="text-xs font-semibold">{f.label}</span>
                    <span className="text-[10px] leading-tight text-muted-foreground text-center">
                      {f.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quality slider (lossy formats only) */}
          {!currentFormat.lossless && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="export-quality"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Quality
                </label>
                <span className="text-xs font-mono text-foreground tabular-nums">
                  {Math.round(quality * 100)}%
                </span>
              </div>
              <Slider
                id="export-quality"
                min={10}
                max={100}
                step={1}
                value={[Math.round(quality * 100)]}
                onValueChange={([v]: number[]) => setQuality(v / 100)}
                aria-label="Export quality"
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
            </div>
          )}

          {/* Size estimate */}
          {estimateSize && (
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/20 border border-glass-border">
              <span className="text-xs text-muted-foreground">Estimated size</span>
              <span className="text-xs font-mono font-medium text-foreground tabular-nums inline-flex items-center gap-1.5">
                {isEstimating ? (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                ) : estimatedSize !== null ? (
                  formatBytes(estimatedSize)
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </span>
            </div>
          )}

          {/* Action */}
          <Button
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {isExporting ? "Exporting..." : `Download ${currentFormat.label}`}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
