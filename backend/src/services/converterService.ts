import sharp from "sharp";
import heicConvert from "heic-convert";

export async function convertHeicToJpg(
  inputBuffer: Buffer,
  jpegQuality: number
): Promise<Buffer> {
  try {
    return await sharp(inputBuffer).jpeg({ quality: jpegQuality }).toBuffer();
  } catch {
    const fallback = (await heicConvert({
      buffer: inputBuffer,
      format: "JPEG",
      quality: Math.max(0.1, Math.min(1, jpegQuality / 100)),
    })) as Buffer;
    return fallback;
  }
}

export async function createPreviewDataUrl(
  inputBuffer: Buffer,
  quality = 70
): Promise<string | undefined> {
  try {
    const normalizedJpg = await convertHeicToJpg(inputBuffer, Math.max(quality, 80));
    const thumb = await sharp(normalizedJpg)
      .resize({ width: 480, fit: "inside" })
      .jpeg({ quality })
      .toBuffer();
    return `data:image/jpeg;base64,${thumb.toString("base64")}`;
  } catch {
    try {
      // Fallback for HEIC environments where direct sharp decode is unavailable.
      const jpgBuffer = await convertHeicToJpg(inputBuffer, quality);
      const thumb = await sharp(jpgBuffer)
        .resize({ width: 480, fit: "inside" })
        .jpeg({ quality })
        .toBuffer();
      return `data:image/jpeg;base64,${thumb.toString("base64")}`;
    } catch {
      return undefined;
    }
  }
}
