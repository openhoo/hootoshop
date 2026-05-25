import { describe, expect, test } from "bun:test"
import {
  dimensionsForScale,
  dimensionsForTargetBytes,
  estimateResizedBytes,
  formatBytes,
  getDataUrlByteSize,
} from "../lib/image-sizing"

describe("image sizing helpers", () => {
  test("formats byte counts", () => {
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(1536)).toBe("1.5 KB")
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB")
  })

  test("estimates resized byte counts by pixel area", () => {
    expect(estimateResizedBytes(1000, 100, 100, 50, 50)).toBe(250)
    expect(estimateResizedBytes(1000, 0, 100, 50, 50)).toBe(0)
  })

  test("reads base64 data URL sizes", () => {
    expect(getDataUrlByteSize("data:image/png;base64,AAAA")).toBe(3)
    expect(getDataUrlByteSize("https://example.com/image.png")).toBeNull()
  })

  test("calculates dimensions from scale", () => {
    expect(dimensionsForScale(1920, 1080, 50)).toEqual({ width: 960, height: 540 })
    expect(dimensionsForScale(10, 15, 125)).toEqual({ width: 13, height: 19 })
  })

  test("calculates dimensions from target bytes", () => {
    expect(dimensionsForTargetBytes(4000, 200, 100, 1000)).toEqual({
      width: 100,
      height: 50,
    })
    expect(dimensionsForTargetBytes(0, 200, 100, 1000)).toBeNull()
    expect(dimensionsForTargetBytes(4000, 200, 100, 0)).toBeNull()
  })
})
