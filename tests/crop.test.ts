import { describe, expect, test } from "bun:test"
import {
  centerCrop,
  clampCrop,
  fitCropToAspectRatio,
  getSnapGuides,
  parseAspectRatio,
  resizeCropRegion,
  resolveCropDimensions,
  snapMove,
} from "../lib/crop"

describe("crop helpers", () => {
  test("parses known aspect ratios", () => {
    expect(parseAspectRatio("1:1")).toBe(1)
    expect(parseAspectRatio("4:3")).toBeCloseTo(1.3333, 4)
    expect(parseAspectRatio("16:9")).toBeCloseTo(16 / 9, 4)
    expect(parseAspectRatio("free")).toBeNull()
  })

  test("clamps a crop to image bounds and minimum size", () => {
    expect(clampCrop({ x: -50, y: 80, width: 500, height: 5 }, 300, 200)).toEqual({
      x: 0,
      y: 80,
      width: 300,
      height: 20,
    })

    expect(clampCrop({ x: 280, y: 190, width: 50, height: 50 }, 300, 200)).toEqual({
      x: 250,
      y: 150,
      width: 50,
      height: 50,
    })
  })

  test("centers crop regions", () => {
    expect(centerCrop(200, 100, 500, 300)).toEqual({
      x: 150,
      y: 100,
      width: 200,
      height: 100,
    })
  })

  test("snaps near-center crop movement and reports guides", () => {
    const crop = { x: 98, y: 51, width: 200, height: 100 }
    const snapped = snapMove(crop, 400, 200, 6)

    expect(snapped).toEqual({ x: 100, y: 50, width: 200, height: 100 })
    expect(getSnapGuides(snapped, 400, 200, 6)).toEqual({
      vertical: true,
      horizontal: true,
    })
  })

  test("fits a crop to an aspect ratio around the existing center", () => {
    const crop = fitCropToAspectRatio({
      cropRegion: { x: 10, y: 20, width: 300, height: 200 },
      imageWidth: 500,
      imageHeight: 400,
      ratio: "1:1",
      keepCentered: false,
    })

    expect(crop).toEqual({
      x: 60,
      y: 20,
      width: 200,
      height: 200,
    })
  })

  test("keeps aspect ratio crops centered when requested", () => {
    expect(
      fitCropToAspectRatio({
        cropRegion: { x: 10, y: 20, width: 300, height: 200 },
        imageWidth: 500,
        imageHeight: 400,
        ratio: "16:9",
        keepCentered: true,
      })
    ).toEqual({
      x: 100,
      y: 115.625,
      width: 300,
      height: 168.75,
    })
  })

  test("resizes a crop around the current center or image center", () => {
    expect(
      resizeCropRegion({
        cropRegion: { x: 50, y: 50, width: 100, height: 100 },
        imageWidth: 300,
        imageHeight: 300,
        width: 80,
        height: 120,
        keepCentered: false,
      })
    ).toEqual({ x: 60, y: 40, width: 80, height: 120 })

    expect(
      resizeCropRegion({
        cropRegion: { x: 50, y: 50, width: 100, height: 100 },
        imageWidth: 300,
        imageHeight: 300,
        width: 80,
        height: 120,
        keepCentered: true,
      })
    ).toEqual({ x: 110, y: 90, width: 80, height: 120 })
  })

  test("resolves manual dimensions while preserving a selected aspect ratio", () => {
    expect(
      resolveCropDimensions({
        dimension: "width",
        value: "160",
        cropRegion: { x: 0, y: 0, width: 100, height: 80 },
        imageWidth: 300,
        imageHeight: 200,
        aspectRatio: 16 / 9,
      })
    ).toEqual({ width: 160, height: 90 })

    expect(
      resolveCropDimensions({
        dimension: "height",
        value: "400",
        cropRegion: { x: 0, y: 0, width: 100, height: 80 },
        imageWidth: 300,
        imageHeight: 200,
        aspectRatio: 4 / 3,
      })
    ).toEqual({ width: 267, height: 200 })
  })
})
