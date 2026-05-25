"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export interface CropRegion {
  x: number
  y: number
  width: number
  height: number
}

interface CropToolProps {
  imageSrc: string
  originalWidth: number
  originalHeight: number
  cropRegion: CropRegion
  onCropChange: (region: CropRegion) => void
  aspectRatio: number | null
  keepCentered: boolean
}

type HandlePosition = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w"

const SNAP_THRESHOLD = 6
const ARROW_STEP = 1
const ARROW_STEP_SHIFT = 10

function clampCrop(crop: CropRegion, imgW: number, imgH: number): CropRegion {
  const w = Math.max(20, Math.min(crop.width, imgW))
  const h = Math.max(20, Math.min(crop.height, imgH))
  const x = Math.max(0, Math.min(crop.x, imgW - w))
  const y = Math.max(0, Math.min(crop.y, imgH - h))
  return { x, y, width: w, height: h }
}

function centerCrop(width: number, height: number, imgW: number, imgH: number): CropRegion {
  return { x: (imgW - width) / 2, y: (imgH - height) / 2, width, height }
}

function getSnapGuides(crop: CropRegion, imgW: number, imgH: number, threshold: number) {
  const cropCX = crop.x + crop.width / 2
  const cropCY = crop.y + crop.height / 2
  return {
    vertical: Math.abs(cropCX - imgW / 2) < threshold,
    horizontal: Math.abs(cropCY - imgH / 2) < threshold,
  }
}

function snapMove(crop: CropRegion, imgW: number, imgH: number, threshold: number): CropRegion {
  const result = { ...crop }
  if (Math.abs(crop.x + crop.width / 2 - imgW / 2) < threshold) result.x = imgW / 2 - crop.width / 2
  if (Math.abs(crop.y + crop.height / 2 - imgH / 2) < threshold)
    result.y = imgH / 2 - crop.height / 2
  return result
}

export function CropTool({
  imageSrc,
  originalWidth,
  originalHeight,
  cropRegion,
  onCropChange,
  aspectRatio,
  keepCentered,
}: CropToolProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState<"move" | HandlePosition | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [startCrop, setStartCrop] = useState<CropRegion>(cropRegion)
  const [displayScale, setDisplayScale] = useState(1)
  const [shiftHeld, setShiftHeld] = useState(false)
  const axisLockRef = useRef<"x" | "y" | null>(null)

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return
      const r = containerRef.current.getBoundingClientRect()
      setDisplayScale(Math.min(r.width / originalWidth, r.height / originalHeight))
    }
    updateScale()
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, [originalWidth, originalHeight])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftHeld(true)
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setShiftHeld(false)
        axisLockRef.current = null
      }
    }
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [])

  // Arrow key movement for crop
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if (e.metaKey || e.ctrlKey) return
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return
      if (keepCentered) return

      e.preventDefault()
      const step = e.shiftKey ? ARROW_STEP_SHIFT : ARROW_STEP
      let dx = 0,
        dy = 0
      if (e.key === "ArrowUp") dy = -step
      if (e.key === "ArrowDown") dy = step
      if (e.key === "ArrowLeft") dx = -step
      if (e.key === "ArrowRight") dx = step

      onCropChange(
        snapMove(
          clampCrop(
            {
              x: cropRegion.x + dx,
              y: cropRegion.y + dy,
              width: cropRegion.width,
              height: cropRegion.height,
            },
            originalWidth,
            originalHeight
          ),
          originalWidth,
          originalHeight,
          SNAP_THRESHOLD
        )
      )
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [cropRegion, originalWidth, originalHeight, keepCentered, onCropChange])

  const toDisplay = useCallback((val: number) => val * displayScale, [displayScale])
  const toOriginal = useCallback((val: number) => val / displayScale, [displayScale])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, type: "move" | HandlePosition) => {
      e.preventDefault()
      e.stopPropagation()
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
      setIsDragging(true)
      setDragType(type)
      setDragStart({ x: clientX, y: clientY })
      setStartCrop({ ...cropRegion })
      axisLockRef.current = null
    },
    [cropRegion]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
      let dx = toOriginal(clientX - dragStart.x)
      let dy = toOriginal(clientY - dragStart.y)
      let newCrop = { ...startCrop }
      const minSize = 20

      if (dragType === "move") {
        if (keepCentered) return
        if (shiftHeld) {
          if (axisLockRef.current === null && (Math.abs(dx) > 3 || Math.abs(dy) > 3))
            axisLockRef.current = Math.abs(dx) >= Math.abs(dy) ? "x" : "y"
          if (axisLockRef.current === "x") dy = 0
          if (axisLockRef.current === "y") dx = 0
        } else {
          axisLockRef.current = null
        }
        newCrop.x = Math.max(0, Math.min(startCrop.x + dx, originalWidth - startCrop.width))
        newCrop.y = Math.max(0, Math.min(startCrop.y + dy, originalHeight - startCrop.height))
        newCrop = snapMove(newCrop, originalWidth, originalHeight, SNAP_THRESHOLD)
      } else {
        const dL = dragType?.includes("w"),
          dR = dragType?.includes("e")
        const dT = dragType?.includes("n"),
          dB = dragType?.includes("s")

        if (aspectRatio !== null) {
          let nW = startCrop.width,
            nH = startCrop.height
          if (dL || dR) {
            nW = Math.max(minSize, startCrop.width + (dL ? -dx : dx))
            nH = nW / aspectRatio
          }
          if (dT || dB) {
            if (!dL && !dR) {
              nH = Math.max(minSize, startCrop.height + (dT ? -dy : dy))
              nW = nH * aspectRatio
            } else if (Math.abs(dy) > Math.abs(dx)) {
              nH = Math.max(minSize, startCrop.height + (dT ? -dy : dy))
              nW = nH * aspectRatio
            }
          }
          if (nW > originalWidth) {
            nW = originalWidth
            nH = nW / aspectRatio
          }
          if (nH > originalHeight) {
            nH = originalHeight
            nW = nH * aspectRatio
          }
          nW = Math.max(minSize, nW)
          nH = Math.max(minSize, nH)
          if (keepCentered) {
            newCrop = centerCrop(nW, nH, originalWidth, originalHeight)
          } else {
            if (dL) newCrop.x = startCrop.x + startCrop.width - nW
            else if (!dR) newCrop.x = startCrop.x + (startCrop.width - nW) / 2
            if (dT) newCrop.y = startCrop.y + startCrop.height - nH
            else if (!dB) newCrop.y = startCrop.y + (startCrop.height - nH) / 2
            newCrop.width = nW
            newCrop.height = nH
          }
        } else {
          if (shiftHeld && (dL || dR) && (dT || dB)) {
            const size =
              Math.abs(dx) >= Math.abs(dy)
                ? Math.max(minSize, startCrop.width + (dL ? -dx : dx))
                : Math.max(minSize, startCrop.height + (dT ? -dy : dy))
            if (dL) newCrop.x = startCrop.x + startCrop.width - size
            if (dT) newCrop.y = startCrop.y + startCrop.height - size
            newCrop.width = size
            newCrop.height = size
          } else {
            if (dL) {
              const nX = Math.max(
                0,
                Math.min(startCrop.x + dx, startCrop.x + startCrop.width - minSize)
              )
              newCrop.width = startCrop.width - (nX - startCrop.x)
              newCrop.x = nX
            }
            if (dR)
              newCrop.width = Math.max(
                minSize,
                Math.min(startCrop.width + dx, originalWidth - startCrop.x)
              )
            if (dT) {
              const nY = Math.max(
                0,
                Math.min(startCrop.y + dy, startCrop.y + startCrop.height - minSize)
              )
              newCrop.height = startCrop.height - (nY - startCrop.y)
              newCrop.y = nY
            }
            if (dB)
              newCrop.height = Math.max(
                minSize,
                Math.min(startCrop.height + dy, originalHeight - startCrop.y)
              )
          }
          if (keepCentered)
            newCrop = centerCrop(newCrop.width, newCrop.height, originalWidth, originalHeight)
        }
      }
      onCropChange(clampCrop(newCrop, originalWidth, originalHeight))
    }

    const handleUp = () => {
      setIsDragging(false)
      setDragType(null)
      axisLockRef.current = null
    }
    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
    window.addEventListener("touchmove", handleMove, { passive: false })
    window.addEventListener("touchend", handleUp)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
      window.removeEventListener("touchmove", handleMove)
      window.removeEventListener("touchend", handleUp)
    }
  }, [
    isDragging,
    dragType,
    dragStart,
    startCrop,
    originalWidth,
    originalHeight,
    toOriginal,
    onCropChange,
    aspectRatio,
    keepCentered,
    shiftHeld,
  ])

  const dc = {
    x: toDisplay(cropRegion.x),
    y: toDisplay(cropRegion.y),
    w: toDisplay(cropRegion.width),
    h: toDisplay(cropRegion.height),
  }
  const imgW = toDisplay(originalWidth)
  const imgH = toDisplay(originalHeight)
  const rawGuides = getSnapGuides(cropRegion, originalWidth, originalHeight, SNAP_THRESHOLD)
  // Only show guides while actively dragging
  const guides = isDragging ? rawGuides : { vertical: false, horizontal: false }

  const hs = 10
  const handles: { pos: HandlePosition; style: React.CSSProperties; cursor: string }[] = [
    { pos: "nw", style: { top: -hs / 2, left: -hs / 2 }, cursor: "nwse-resize" },
    { pos: "ne", style: { top: -hs / 2, right: -hs / 2 }, cursor: "nesw-resize" },
    { pos: "sw", style: { bottom: -hs / 2, left: -hs / 2 }, cursor: "nesw-resize" },
    { pos: "se", style: { bottom: -hs / 2, right: -hs / 2 }, cursor: "nwse-resize" },
    {
      pos: "n",
      style: { top: -hs / 2, left: "50%", transform: "translateX(-50%)" },
      cursor: "ns-resize",
    },
    {
      pos: "s",
      style: { bottom: -hs / 2, left: "50%", transform: "translateX(-50%)" },
      cursor: "ns-resize",
    },
    {
      pos: "w",
      style: { top: "50%", left: -hs / 2, transform: "translateY(-50%)" },
      cursor: "ew-resize",
    },
    {
      pos: "e",
      style: { top: "50%", right: -hs / 2, transform: "translateY(-50%)" },
      cursor: "ew-resize",
    },
  ]

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <div
        ref={containerRef}
        className="relative select-none"
        style={{
          width: originalWidth * displayScale || "100%",
          height: originalHeight * displayScale || "auto",
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      >
        {/* Base image dimmed */}
        <img
          src={imageSrc}
          alt="Crop source"
          className="w-full h-full object-contain opacity-30"
          draggable={false}
        />
        <div className="absolute inset-0 bg-background/40 pointer-events-none" />

        {/* Snap guide: vertical center line */}
        {guides.vertical && (
          <div
            className="absolute pointer-events-none z-20"
            style={{
              left: imgW / 2,
              top: 0,
              width: 0,
              height: imgH,
              borderLeft: "1px dashed oklch(0.65 0.18 250 / 0.7)",
            }}
          />
        )}
        {/* Snap guide: horizontal center line */}
        {guides.horizontal && (
          <div
            className="absolute pointer-events-none z-20"
            style={{
              top: imgH / 2,
              left: 0,
              height: 0,
              width: imgW,
              borderTop: "1px dashed oklch(0.65 0.18 250 / 0.7)",
            }}
          />
        )}
        {/* Center diamond when both guides active */}
        {guides.vertical && guides.horizontal && (
          <div
            className="absolute pointer-events-none z-20"
            style={{
              left: imgW / 2 - 4,
              top: imgH / 2 - 4,
              width: 8,
              height: 8,
              borderRadius: 1,
              transform: "rotate(45deg)",
              background: "oklch(0.65 0.18 250 / 0.9)",
            }}
          />
        )}

        {/* Bright crop region */}
        <div
          className="absolute overflow-hidden"
          style={{ left: dc.x, top: dc.y, width: dc.w, height: dc.h }}
        >
          <img
            src={imageSrc}
            alt=""
            draggable={false}
            className="max-w-none"
            style={{
              width: originalWidth * displayScale,
              height: originalHeight * displayScale,
              marginLeft: -dc.x,
              marginTop: -dc.y,
            }}
          />
        </div>

        {/* Crop border + handles */}
        <fieldset
          onMouseDown={(e) => handleMouseDown(e, "move")}
          onTouchStart={(e) => handleMouseDown(e, "move")}
          className={`absolute border-2 border-foreground/80 ${keepCentered ? "cursor-default" : "cursor-move"} focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
          style={{ left: dc.x, top: dc.y, width: dc.w, height: dc.h }}
        >
          <legend className="sr-only">
            Crop region. Use arrow keys to move, Shift+arrows for 10px steps.
          </legend>
          {/* Rule of thirds */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-foreground/20" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-foreground/20" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-foreground/20" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-foreground/20" />
          </div>
          {/* Center crosshair inside crop when snapped */}
          {guides.vertical && (
            <div
              className="absolute top-0 bottom-0 w-px pointer-events-none"
              style={{ left: "50%", background: "oklch(0.65 0.18 250 / 0.5)" }}
            />
          )}
          {guides.horizontal && (
            <div
              className="absolute left-0 right-0 h-px pointer-events-none"
              style={{ top: "50%", background: "oklch(0.65 0.18 250 / 0.5)" }}
            />
          )}

          {handles.map(({ pos, style, cursor }) => (
            <button
              type="button"
              key={pos}
              aria-label={`Resize handle ${pos}`}
              onMouseDown={(e) => handleMouseDown(e, pos)}
              onTouchStart={(e) => handleMouseDown(e, pos)}
              className="absolute w-2.5 h-2.5 bg-foreground rounded-sm shadow-lg z-10 hover:bg-primary transition-colors"
              style={{ ...style, cursor }}
            />
          ))}
        </fieldset>

        {/* Dimension label */}
        <div
          className="absolute glass-panel rounded-md px-2 py-1 text-xs font-mono text-foreground pointer-events-none z-30"
          style={{ left: dc.x + dc.w / 2, top: dc.y + dc.h + 8, transform: "translateX(-50%)" }}
        >
          {Math.round(cropRegion.width)} x {Math.round(cropRegion.height)}
        </div>

        {/* Keyboard hint */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 glass-panel rounded-md px-3 py-1.5 text-xs text-muted-foreground pointer-events-none z-30 opacity-60 flex items-center gap-3">
          <span>Arrow keys to nudge</span>
          <span className="text-foreground/30">|</span>
          <span>Shift for 10px</span>
        </div>
      </div>
    </div>
  )
}
