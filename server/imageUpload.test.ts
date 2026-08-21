import { describe, expect, it } from "vitest";
import { decodeImageDataUrl } from "./imageUpload";

function dataUrl(mimeType: string, bytes: number[]) {
  return `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
}

describe("image upload validation", () => {
  it("accepts image bytes that match the declared MIME type", () => {
    expect(decodeImageDataUrl(dataUrl("image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png")).toBeInstanceOf(Buffer);
  });

  it("rejects a MIME declaration that does not match the image bytes", () => {
    expect(() => decodeImageDataUrl(dataUrl("image/png", [0xff, 0xd8, 0xff]), "image/png")).toThrow("Image content does not match its declared type");
  });
});
