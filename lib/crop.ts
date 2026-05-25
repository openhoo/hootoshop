export interface CropRegion {
  x: number
  y: number
  width: number
  height: number
}

export type CropDimension = "width" | "height"

const MIN_CROP_SIZE = 20

export function parseAspectRatio(ratio: string): number | null {
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

export function clampCrop(
  crop: CropRegion,
  imageWidth: number,
  imageHeight: number,
  minSize = MIN_CROP_SIZE
): CropRegion {
  const width = Math.max(minSize, Math.min(crop.width, imageWidth))
  const height = Math.max(minSize, Math.min(crop.height, imageHeight))
  const x = Math.max(0, Math.min(crop.x, imageWidth - width))
  const y = Math.max(0, Math.min(crop.y, imageHeight - height))

  return { x, y, width, height }
}

export function centerCrop(
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number
): CropRegion {
  return {
    x: (imageWidth - width) / 2,
    y: (imageHeight - height) / 2,
    width,
    height,
  }
}

export function getSnapGuides(
  crop: CropRegion,
  imageWidth: number,
  imageHeight: number,
  threshold: number
) {
  const cropCenterX = crop.x + crop.width / 2
  const cropCenterY = crop.y + crop.height / 2

  return {
    vertical: Math.abs(cropCenterX - imageWidth / 2) < threshold,
    horizontal: Math.abs(cropCenterY - imageHeight / 2) < threshold,
  }
}

export function snapMove(
  crop: CropRegion,
  imageWidth: number,
  imageHeight: number,
  threshold: number
): CropRegion {
  const result = { ...crop }

  if (Math.abs(crop.x + crop.width / 2 - imageWidth / 2) < threshold) {
    result.x = imageWidth / 2 - crop.width / 2
  }

  if (Math.abs(crop.y + crop.height / 2 - imageHeight / 2) < threshold) {
    result.y = imageHeight / 2 - crop.height / 2
  }

  return result
}

export interface FitCropToAspectRatioInput {
  cropRegion: CropRegion
  imageWidth: number
  imageHeight: number
  ratio: string
  keepCentered: boolean
}

export function fitCropToAspectRatio({
  cropRegion,
  imageWidth,
  imageHeight,
  ratio,
  keepCentered,
}: FitCropToAspectRatioInput): CropRegion | null {
  const targetRatio = parseAspectRatio(ratio)
  if (targetRatio === null) return null

  const currentCenterX = cropRegion.x + cropRegion.width / 2
  const currentCenterY = cropRegion.y + cropRegion.height / 2

  let width: number
  let height: number

  if (targetRatio > cropRegion.width / cropRegion.height) {
    width = cropRegion.width
    height = width / targetRatio
  } else {
    height = cropRegion.height
    width = height * targetRatio
  }

  width = Math.min(width, imageWidth)
  height = Math.min(height, imageHeight)

  if (width / height > targetRatio) {
    width = height * targetRatio
  } else {
    height = width / targetRatio
  }

  if (keepCentered) {
    return centerCrop(width, height, imageWidth, imageHeight)
  }

  const x = Math.max(0, Math.min(currentCenterX - width / 2, imageWidth - width))
  const y = Math.max(0, Math.min(currentCenterY - height / 2, imageHeight - height))

  return { x, y, width, height }
}

export interface ResizeCropRegionInput {
  cropRegion: CropRegion
  imageWidth: number
  imageHeight: number
  width: number
  height: number
  keepCentered: boolean
}

export function resizeCropRegion({
  cropRegion,
  imageWidth,
  imageHeight,
  width,
  height,
  keepCentered,
}: ResizeCropRegionInput): CropRegion {
  if (keepCentered) {
    return centerCrop(width, height, imageWidth, imageHeight)
  }

  const centerX = cropRegion.x + cropRegion.width / 2
  const centerY = cropRegion.y + cropRegion.height / 2
  const x = Math.max(0, Math.min(centerX - width / 2, imageWidth - width))
  const y = Math.max(0, Math.min(centerY - height / 2, imageHeight - height))

  return { x, y, width, height }
}

export interface ResolveCropDimensionsInput {
  dimension: CropDimension
  value: string
  cropRegion: CropRegion
  imageWidth: number
  imageHeight: number
  aspectRatio: number | null
}

export function resolveCropDimensions({
  dimension,
  value,
  cropRegion,
  imageWidth,
  imageHeight,
  aspectRatio,
}: ResolveCropDimensionsInput) {
  if (dimension === "width") {
    const requestedWidth = Math.max(
      MIN_CROP_SIZE,
      Math.min(imageWidth, parseInt(value, 10) || MIN_CROP_SIZE)
    )
    let height = aspectRatio !== null ? Math.round(requestedWidth / aspectRatio) : cropRegion.height
    height = Math.max(MIN_CROP_SIZE, Math.min(imageHeight, height))
    const width =
      aspectRatio !== null
        ? Math.max(MIN_CROP_SIZE, Math.min(imageWidth, Math.round(height * aspectRatio)))
        : requestedWidth

    return { width, height }
  }

  const requestedHeight = Math.max(
    MIN_CROP_SIZE,
    Math.min(imageHeight, parseInt(value, 10) || MIN_CROP_SIZE)
  )
  let width = aspectRatio !== null ? Math.round(requestedHeight * aspectRatio) : cropRegion.width
  width = Math.max(MIN_CROP_SIZE, Math.min(imageWidth, width))
  const height =
    aspectRatio !== null
      ? Math.max(MIN_CROP_SIZE, Math.min(imageHeight, Math.round(width / aspectRatio)))
      : requestedHeight

  return { width, height }
}
