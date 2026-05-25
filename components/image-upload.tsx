"use client"

import { useCallback, useRef } from "react"
import { Upload, ImageIcon } from "lucide-react"

interface ImageUploadProps {
  onImageUpload: (file: File) => void
}

export function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const file = e.dataTransfer.files?.[0]
      if (file && file.type.startsWith("image/")) {
        onImageUpload(file)
      }
    },
    [onImageUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      onImageUpload(file)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)] px-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload an image by clicking or dragging and dropping"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
          }
        }}
        className="glass-panel glass-glow rounded-2xl p-12 md:p-16 max-w-xl w-full cursor-pointer
          transition-all duration-300 hover:scale-[1.02] hover:border-primary/40
          focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none
          group"
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center
              group-hover:bg-primary/20 transition-colors duration-300">
              <Upload className="w-8 h-8 text-primary transition-transform duration-300 group-hover:-translate-y-1" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-accent" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Drop your image here
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Drag and drop an image, or click to browse.
              Supports PNG, JPG, WebP, and GIF.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="px-3 py-1.5 rounded-md bg-secondary/50 font-mono">PNG</span>
            <span className="px-3 py-1.5 rounded-md bg-secondary/50 font-mono">JPG</span>
            <span className="px-3 py-1.5 rounded-md bg-secondary/50 font-mono">WebP</span>
            <span className="px-3 py-1.5 rounded-md bg-secondary/50 font-mono">GIF</span>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="sr-only"
          aria-label="Choose image file"
        />
      </div>
    </div>
  )
}
