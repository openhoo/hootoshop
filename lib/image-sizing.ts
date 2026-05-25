export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function getDataUrlByteSize(source: string): number | null {
  if (!source.startsWith("data:")) return null

  const base64Part = source.split(",")[1]
  return base64Part ? Math.round((base64Part.length * 3) / 4) : 0
}

export function estimateResizedBytes(
  originalBytes: number,
  originalWidth: number,
  originalHeight: number,
  resizedWidth: number,
  resizedHeight: number
): number {
  const originalPixels = originalWidth * originalHeight
  const resizedPixels = resizedWidth * resizedHeight
  if (originalPixels === 0) return 0

  return Math.round(originalBytes * (resizedPixels / originalPixels))
}

export function dimensionsForScale(
  originalWidth: number,
  originalHeight: number,
  scalePercent: number
) {
  const scale = scalePercent / 100

  return {
    width: Math.round(originalWidth * scale),
    height: Math.round(originalHeight * scale),
  }
}

export function dimensionsForTargetBytes(
  sourceBytes: number,
  originalWidth: number,
  originalHeight: number,
  targetBytes: number
) {
  if (targetBytes <= 0 || sourceBytes <= 0) return null

  const ratio = targetBytes / sourceBytes
  const scale = Math.sqrt(ratio)

  return {
    width: Math.max(1, Math.round(originalWidth * scale)),
    height: Math.max(1, Math.round(originalHeight * scale)),
  }
}
