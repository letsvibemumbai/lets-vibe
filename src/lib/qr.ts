import "server-only";
import QRCode from "qrcode";

/**
 * Render `text` (typically a check-in URL) as a PNG data URL, branded in the
 * site palette. Generated server-side so no client QR dependency is shipped.
 */
export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    color: { dark: "#1a1612", light: "#fbf8f2" },
  });
}
