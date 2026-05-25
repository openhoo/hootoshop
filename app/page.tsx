"use client"

import { useState } from "react"
import { ImageUpload } from "@/components/image-upload"
import { ImageEditor } from "@/components/image-editor"

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-primary/3 blur-[80px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {!selectedFile ? (
          <div className="flex flex-col min-h-screen">
            {/* Landing header */}
            <header className="glass-panel-strong glass-inset px-6 h-14 flex items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center ring-1 ring-primary/30 shadow-[0_0_12px_-2px_oklch(0.74_0.16_220_/_0.3)]">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                    aria-hidden="true"
                  >
                    {/* Stylized owl mark */}
                    <path d="M5 5 L8 9" />
                    <path d="M19 5 L16 9" />
                    <path d="M12 4 C7 4 4 8 4 13 C4 17.5 7.5 21 12 21 C16.5 21 20 17.5 20 13 C20 8 17 4 12 4 Z" />
                    <circle cx="9" cy="12" r="1.8" fill="currentColor" />
                    <circle cx="15" cy="12" r="1.8" fill="currentColor" />
                    <path d="M11 15 L12 16.5 L13 15" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-foreground tracking-tight">
                  Hootoshop
                </span>
              </div>
            </header>

            <ImageUpload onImageUpload={(file) => setSelectedFile(file)} />
          </div>
        ) : (
          <ImageEditor
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
          />
        )}
      </div>
    </main>
  )
}
