"use client"

import { Crop, Scaling, Sliders } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { AdjustTools } from "@/components/adjust-tools"
import { CropControls } from "@/components/crop-controls"
import { type CropRegion, CropTool } from "@/components/crop-tool"
import { EditorHeader } from "@/components/editor-header"
import type { ExportOptions } from "@/components/export-menu"
import { ResizeTool } from "@/components/resize-tool"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ImageEditorProps {
  file: File
  onClose: () => void
}

// --- History system ---
interface EditorSnapshot {
  imageSrc: string
  originalWidth: number
  originalHeight: number
  cropRegion: CropRegion
  resizeWidth: number
  resizeHeight: number
  selectedAspect: string
  keepCentered: boolean
}

function parseAspectRatio(ratio: string): number | null {
  switch (ratio) {
    case "1:1":
      return 1
    case "4:3":
      return 4 / 3
    case "16:9":
      return 16 / 9
    case "3:2":
      return 3 / 2
    case "9:16":
      return 9 / 16
    default:
      return null
  }
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ImageEditor({ file, onClose }: ImageEditorProps) {
  const [imageSrc, setImageSrc] = useState<string>("")
  const [originalWidth, setOriginalWidth] = useState(0)
  const [originalHeight, setOriginalHeight] = useState(0)
  const [activeTab, setActiveTab] = useState("crop")

  // Crop state
  const [cropRegion, setCropRegion] = useState<CropRegion>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })
  const [selectedAspect, setSelectedAspect] = useState("free")
  const [keepCentered, setKeepCentered] = useState(false)

  // Resize state
  const [resizeWidth, setResizeWidth] = useState(0)
  const [resizeHeight, setResizeHeight] = useState(0)

  // History for undo/redo
  const historyRef = useRef<EditorSnapshot[]>([])
  const historyIndexRef = useRef(-1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Track changes
  const [hasChanges, setHasChanges] = useState(false)

  // ---------- helpers ----------
  const applySnapshot = useCallback((snap: EditorSnapshot) => {
    setImageSrc(snap.imageSrc)
    setOriginalWidth(snap.originalWidth)
    setOriginalHeight(snap.originalHeight)
    setCropRegion({ ...snap.cropRegion })
    setResizeWidth(snap.resizeWidth)
    setResizeHeight(snap.resizeHeight)
    setSelectedAspect(snap.selectedAspect)
    setKeepCentered(snap.keepCentered)
  }, [])

  const pushHistory = useCallback((snap: EditorSnapshot) => {
    // Discard any redo entries ahead of current
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1)
    newHistory.push(snap)
    // Cap at 50 entries
    if (newHistory.length > 50) newHistory.shift()
    historyRef.current = newHistory
    historyIndexRef.current = newHistory.length - 1
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(false)
  }, [])

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    const snap = historyRef.current[historyIndexRef.current]
    applySnapshot(snap)
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    setHasChanges(historyIndexRef.current > 0)
    toast("Undo")
  }, [applySnapshot])

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current += 1
    const snap = historyRef.current[historyIndexRef.current]
    applySnapshot(snap)
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    setHasChanges(true)
    toast("Redo")
  }, [applySnapshot])

  // ---------- keyboard shortcuts ----------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      // Ctrl/Cmd + Z = undo, Ctrl/Cmd + Shift + Z = redo
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
        return
      }

      // Ctrl/Cmd + Y = redo (alternative)
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault()
        redo()
        return
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [undo, redo])

  // ---------- load image ----------
  useEffect(() => {
    let cancelled = false
    async function load() {
      const dataUrl = await fileToDataURL(file)
      if (cancelled) return

      const img = new window.Image()
      img.onload = () => {
        if (cancelled) return
        const w = img.naturalWidth
        const h = img.naturalHeight
        setOriginalWidth(w)
        setOriginalHeight(h)
        setCropRegion({ x: 0, y: 0, width: w, height: h })
        setResizeWidth(w)
        setResizeHeight(h)
        setImageSrc(dataUrl)

        // Push initial history entry
        const initialSnap: EditorSnapshot = {
          imageSrc: dataUrl,
          originalWidth: w,
          originalHeight: h,
          cropRegion: { x: 0, y: 0, width: w, height: h },
          resizeWidth: w,
          resizeHeight: h,
          selectedAspect: "free",
          keepCentered: false,
        }
        historyRef.current = [initialSnap]
        historyIndexRef.current = 0
        setCanUndo(false)
        setCanRedo(false)
      }
      img.src = dataUrl
    }
    load()
    return () => {
      cancelled = true
    }
  }, [file])

  const aspectRatioValue = parseAspectRatio(selectedAspect)

  const handleCropChange = useCallback((region: CropRegion) => {
    setCropRegion(region)
    setHasChanges(true)
  }, [])

  const handleAspectRatio = useCallback(
    (ratio: string) => {
      setSelectedAspect(ratio)
      const targetRatio = parseAspectRatio(ratio)
      if (targetRatio === null) return

      const currentCenterX = cropRegion.x + cropRegion.width / 2
      const currentCenterY = cropRegion.y + cropRegion.height / 2

      let newWidth: number
      let newHeight: number

      if (targetRatio > cropRegion.width / cropRegion.height) {
        newWidth = cropRegion.width
        newHeight = newWidth / targetRatio
      } else {
        newHeight = cropRegion.height
        newWidth = newHeight * targetRatio
      }

      newWidth = Math.min(newWidth, originalWidth)
      newHeight = Math.min(newHeight, originalHeight)

      if (newWidth / newHeight > targetRatio) {
        newWidth = newHeight * targetRatio
      } else {
        newHeight = newWidth / targetRatio
      }

      let newX: number
      let newY: number

      if (keepCentered) {
        newX = (originalWidth - newWidth) / 2
        newY = (originalHeight - newHeight) / 2
      } else {
        newX = currentCenterX - newWidth / 2
        newY = currentCenterY - newHeight / 2
        newX = Math.max(0, Math.min(newX, originalWidth - newWidth))
        newY = Math.max(0, Math.min(newY, originalHeight - newHeight))
      }

      setCropRegion({ x: newX, y: newY, width: newWidth, height: newHeight })
      setHasChanges(true)
    },
    [cropRegion, originalWidth, originalHeight, keepCentered]
  )

  const handleKeepCenteredChange = useCallback(
    (centered: boolean) => {
      setKeepCentered(centered)
      if (centered) {
        const newX = (originalWidth - cropRegion.width) / 2
        const newY = (originalHeight - cropRegion.height) / 2
        setCropRegion({
          ...cropRegion,
          x: Math.max(0, newX),
          y: Math.max(0, newY),
        })
      }
    },
    [cropRegion, originalWidth, originalHeight]
  )

  const handleManualDimensionChange = useCallback(
    (width: number, height: number) => {
      let newCrop: CropRegion
      if (keepCentered) {
        newCrop = {
          x: (originalWidth - width) / 2,
          y: (originalHeight - height) / 2,
          width,
          height,
        }
      } else {
        const cx = cropRegion.x + cropRegion.width / 2
        const cy = cropRegion.y + cropRegion.height / 2
        let x = cx - width / 2
        let y = cy - height / 2
        x = Math.max(0, Math.min(x, originalWidth - width))
        y = Math.max(0, Math.min(y, originalHeight - height))
        newCrop = { x, y, width, height }
      }
      setCropRegion(newCrop)
      setHasChanges(true)
    },
    [cropRegion, originalWidth, originalHeight, keepCentered]
  )

  const handleApplyCrop = useCallback(() => {
    if (!imageSrc) return

    const canvas = document.createElement("canvas")
    const w = Math.round(cropRegion.width)
    const h = Math.round(cropRegion.height)
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      ctx.drawImage(img, Math.round(cropRegion.x), Math.round(cropRegion.y), w, h, 0, 0, w, h)
      const newSrc = canvas.toDataURL("image/png")
      setImageSrc(newSrc)
      setOriginalWidth(w)
      setOriginalHeight(h)
      setResizeWidth(w)
      setResizeHeight(h)
      setCropRegion({ x: 0, y: 0, width: w, height: h })
      setSelectedAspect("free")
      setKeepCentered(false)
      setHasChanges(true)

      // Push to history after crop apply
      pushHistory({
        imageSrc: newSrc,
        originalWidth: w,
        originalHeight: h,
        cropRegion: { x: 0, y: 0, width: w, height: h },
        resizeWidth: w,
        resizeHeight: h,
        selectedAspect: "free",
        keepCentered: false,
      })

      toast.success("Crop applied successfully")
    }
    img.src = imageSrc
  }, [imageSrc, cropRegion, pushHistory])

  const handleResetCrop = useCallback(() => {
    setCropRegion({ x: 0, y: 0, width: originalWidth, height: originalHeight })
    setSelectedAspect("free")
    setKeepCentered(false)
  }, [originalWidth, originalHeight])

  const handleResize = useCallback((width: number, height: number) => {
    setResizeWidth(width)
    setResizeHeight(height)
    setHasChanges(true)
  }, [])

  const handleApplyResize = useCallback(() => {
    if (!imageSrc) return

    const canvas = document.createElement("canvas")
    canvas.width = resizeWidth
    canvas.height = resizeHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new window.Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, resizeWidth, resizeHeight)
      const newSrc = canvas.toDataURL("image/png")
      setImageSrc(newSrc)
      setOriginalWidth(resizeWidth)
      setOriginalHeight(resizeHeight)
      setCropRegion({ x: 0, y: 0, width: resizeWidth, height: resizeHeight })
      setSelectedAspect("free")
      setKeepCentered(false)
      setHasChanges(true)

      pushHistory({
        imageSrc: newSrc,
        originalWidth: resizeWidth,
        originalHeight: resizeHeight,
        cropRegion: { x: 0, y: 0, width: resizeWidth, height: resizeHeight },
        resizeWidth,
        resizeHeight,
        selectedAspect: "free",
        keepCentered: false,
      })

      toast.success("Resize applied successfully")
    }
    img.src = imageSrc
  }, [imageSrc, resizeWidth, resizeHeight, pushHistory])

  // Apply a transform from adjust tools (rotate, flip, brightness etc.)
  const handleApplyTransform = useCallback(
    (newDataUrl: string, newW: number, newH: number) => {
      setImageSrc(newDataUrl)
      setOriginalWidth(newW)
      setOriginalHeight(newH)
      setCropRegion({ x: 0, y: 0, width: newW, height: newH })
      setResizeWidth(newW)
      setResizeHeight(newH)
      setSelectedAspect("free")
      setKeepCentered(false)
      setHasChanges(true)

      pushHistory({
        imageSrc: newDataUrl,
        originalWidth: newW,
        originalHeight: newH,
        cropRegion: { x: 0, y: 0, width: newW, height: newH },
        resizeWidth: newW,
        resizeHeight: newH,
        selectedAspect: "free",
        keepCentered: false,
      })

      toast.success("Transform applied")
    },
    [pushHistory]
  )

  const handleReset = useCallback(() => {
    let cancelled = false
    async function load() {
      const dataUrl = await fileToDataURL(file)
      if (cancelled) return
      const img = new window.Image()
      img.onload = () => {
        if (cancelled) return
        const w = img.naturalWidth
        const h = img.naturalHeight
        setOriginalWidth(w)
        setOriginalHeight(h)
        setCropRegion({ x: 0, y: 0, width: w, height: h })
        setResizeWidth(w)
        setResizeHeight(h)
        setImageSrc(dataUrl)
        setHasChanges(false)
        setSelectedAspect("free")
        setKeepCentered(false)

        const snap: EditorSnapshot = {
          imageSrc: dataUrl,
          originalWidth: w,
          originalHeight: h,
          cropRegion: { x: 0, y: 0, width: w, height: h },
          resizeWidth: w,
          resizeHeight: h,
          selectedAspect: "free",
          keepCentered: false,
        }
        historyRef.current = [snap]
        historyIndexRef.current = 0
        setCanUndo(false)
        setCanRedo(false)
        toast.success("All changes reset")
      }
      img.src = dataUrl
    }
    load()
    return () => {
      cancelled = true
    }
  }, [file])

  // Trigger a file download from a blob URL (preferred) or data URL
  const triggerDownload = useCallback((url: string, fileName: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    a.rel = "noopener"
    a.target = "_blank"
    document.body.appendChild(a)
    setTimeout(() => {
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
      }, 500)
    }, 0)
  }, [])

  // Render the current image at resize dimensions to a canvas, resolving with it.
  const renderToCanvas = useCallback((): Promise<HTMLCanvasElement | null> => {
    if (!imageSrc) return Promise.resolve(null)
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      canvas.width = resizeWidth
      canvas.height = resizeHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(null)
        return
      }
      const img = new window.Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        ctx.drawImage(img, 0, 0, resizeWidth, resizeHeight)
        resolve(canvas)
      }
      img.onerror = () => resolve(null)
      img.src = imageSrc
    })
  }, [imageSrc, resizeWidth, resizeHeight])

  const lastExportRef = useRef<ExportOptions>({ format: "png", quality: 0.92 })

  // Export with user-selected options
  const handleExportWithOptions = useCallback(
    async (opts: ExportOptions) => {
      const canvas = await renderToCanvas()
      if (!canvas) {
        toast.error("Failed to render image for export")
        return
      }

      lastExportRef.current = opts
      const mime = `image/${opts.format}`
      const ext = opts.format === "jpeg" ? "jpg" : opts.format
      const baseName = file.name.replace(/\.[^.]+$/, "")
      const fileName = `${baseName}-edited.${ext}`

      // Prefer blob for efficiency; fall back to dataURL
      const blob: Blob | null = await new Promise((resolve) => {
        try {
          canvas.toBlob((b) => resolve(b), mime, opts.format === "png" ? undefined : opts.quality)
        } catch {
          resolve(null)
        }
      })

      try {
        if (blob) {
          const url = URL.createObjectURL(blob)
          triggerDownload(url, fileName)
          setTimeout(() => URL.revokeObjectURL(url), 5000)
        } else {
          const dataUrl = canvas.toDataURL(mime, opts.format === "png" ? undefined : opts.quality)
          triggerDownload(dataUrl, fileName)
        }
        toast.success(`Exported as ${opts.format.toUpperCase()}`)
      } catch {
        toast.error("Failed to export image")
      }
    },
    [renderToCanvas, file.name, triggerDownload]
  )

  // Estimate resulting file size for a given export configuration
  const estimateExportSize = useCallback(
    async (opts: ExportOptions): Promise<number | null> => {
      const canvas = await renderToCanvas()
      if (!canvas) return null
      const mime = `image/${opts.format}`
      return new Promise((resolve) => {
        try {
          canvas.toBlob(
            (b) => resolve(b ? b.size : null),
            mime,
            opts.format === "png" ? undefined : opts.quality
          )
        } catch {
          resolve(null)
        }
      })
    },
    [renderToCanvas]
  )

  // Legacy single-click export (used by Ctrl+S): reuse last-chosen format
  const handleQuickExport = useCallback(() => {
    void handleExportWithOptions(lastExportRef.current)
  }, [handleExportWithOptions])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault()
        handleQuickExport()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleQuickExport])

  if (!imageSrc) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <EditorHeader
        fileName={file.name}
        onReset={handleReset}
        onExport={handleExportWithOptions}
        onEstimateExportSize={estimateExportSize}
        onClose={onClose}
        hasChanges={hasChanges}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        {/* Tab bar */}
        <div className="px-4 pt-3">
          <TabsList className="bg-secondary/30 border border-glass-border">
            <TabsTrigger
              value="crop"
              className="gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>Crop</span>
            </TabsTrigger>
            <TabsTrigger
              value="resize"
              className="gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
            >
              <Scaling className="w-3.5 h-3.5" />
              <span>Rescale</span>
            </TabsTrigger>
            <TabsTrigger
              value="adjust"
              className="gap-1.5 data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Adjust</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Editor area */}
        <TabsContent value="crop" className="flex-1 min-h-0">
          <div className="flex flex-col lg:flex-row h-full gap-4 p-4">
            <div className="flex-1 min-h-0 min-w-0">
              <CropTool
                imageSrc={imageSrc}
                originalWidth={originalWidth}
                originalHeight={originalHeight}
                cropRegion={cropRegion}
                onCropChange={handleCropChange}
                aspectRatio={aspectRatioValue}
                keepCentered={keepCentered}
              />
            </div>
            <CropControls
              cropRegion={cropRegion}
              originalWidth={originalWidth}
              originalHeight={originalHeight}
              onAspectRatio={handleAspectRatio}
              onApplyCrop={handleApplyCrop}
              onResetCrop={handleResetCrop}
              selectedAspect={selectedAspect}
              keepCentered={keepCentered}
              onKeepCenteredChange={handleKeepCenteredChange}
              onManualDimensionChange={handleManualDimensionChange}
              aspectRatioValue={aspectRatioValue}
            />
          </div>
        </TabsContent>

        <TabsContent value="resize" className="flex-1 min-h-0">
          <ResizeTool
            imageSrc={imageSrc}
            originalWidth={originalWidth}
            originalHeight={originalHeight}
            resizeWidth={resizeWidth}
            resizeHeight={resizeHeight}
            onResize={handleResize}
            onApplyResize={handleApplyResize}
          />
        </TabsContent>

        <TabsContent value="adjust" className="flex-1 min-h-0">
          <AdjustTools
            imageSrc={imageSrc}
            originalWidth={originalWidth}
            originalHeight={originalHeight}
            onApplyTransform={handleApplyTransform}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
