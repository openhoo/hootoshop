"use client"

import { RotateCcw, X, Undo2, Redo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ExportMenu, type ExportOptions } from "@/components/export-menu"

interface EditorHeaderProps {
  fileName: string
  onReset: () => void
  onExport: (options: ExportOptions) => Promise<void> | void
  onEstimateExportSize?: (options: ExportOptions) => Promise<number | null>
  onClose: () => void
  hasChanges: boolean
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

function ShortcutKbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-foreground/10 text-[10px] font-mono text-muted-foreground border border-foreground/5">
      {children}
    </kbd>
  )
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent)
const modKey = isMac ? "Cmd" : "Ctrl"

export function EditorHeader({
  fileName,
  onReset,
  onExport,
  onEstimateExportSize,
  onClose,
  hasChanges,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: EditorHeaderProps) {
  const baseName = fileName.replace(/\.[^.]+$/, "")
  return (
      <header className="glass-panel-strong glass-inset px-4 md:px-6 h-14 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onClose}
                aria-label="Close editor and return to upload"
                className="w-8 h-8 rounded-lg flex items-center justify-center
                  hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="glass-panel text-foreground border-glass-border">
              Close editor
            </TooltipContent>
          </Tooltip>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-foreground truncate max-w-[140px] sm:max-w-[200px] md:max-w-[300px]">
              {fileName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Undo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onUndo}
                disabled={!canUndo}
                aria-label={`Undo (${modKey}+Z)`}
                className="w-8 h-8 rounded-lg flex items-center justify-center
                  hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <Undo2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-2 glass-panel text-foreground border-glass-border">
              <span>Undo</span>
              <span className="flex items-center gap-0.5">
                <ShortcutKbd>{modKey}</ShortcutKbd>
                <ShortcutKbd>Z</ShortcutKbd>
              </span>
            </TooltipContent>
          </Tooltip>

          {/* Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                aria-label={`Redo (${modKey}+Shift+Z)`}
                className="w-8 h-8 rounded-lg flex items-center justify-center
                  hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex items-center gap-2 glass-panel text-foreground border-glass-border">
              <span>Redo</span>
              <span className="flex items-center gap-0.5">
                <ShortcutKbd>{modKey}</ShortcutKbd>
                <ShortcutKbd>Shift</ShortcutKbd>
                <ShortcutKbd>Z</ShortcutKbd>
              </span>
            </TooltipContent>
          </Tooltip>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Reset */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                disabled={!hasChanges}
                className="text-muted-foreground hover:text-foreground gap-1.5"
                aria-label="Reset all changes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="glass-panel text-foreground border-glass-border">
              Reset all changes
            </TooltipContent>
          </Tooltip>

          {/* Export with format / quality selection */}
          <ExportMenu
            onExport={onExport}
            estimateSize={onEstimateExportSize}
            baseName={baseName}
            modKey={modKey}
          />
        </div>
      </header>
  )
}
