const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

function matchesImageSignature(bytes: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
}

export function decodeImageDataUrl(dataUrl: string, mimeType: "image/jpeg" | "image/png" | "image/webp") {
  const match = dataUrl.match(/^data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match || match[1] !== mimeType) throw new Error("Invalid image upload payload");
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error("Images must be 6MB or smaller");
  if (!matchesImageSignature(bytes, mimeType)) throw new Error("Image content does not match its declared type");
  return bytes;
}
