import { extractText } from "unpdf";

/**
 * Parses a PDF buffer in memory and returns clean plain text for Gemini/LLM context injection.
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    // 1. Try unpdf binary parser
    const result = (await extractText(new Uint8Array(pdfBuffer))) as any;
    const extracted = result?.text;
    if (Array.isArray(extracted)) {
      const combined = extracted.join(" ");
      return sanitizeResumeText(combined);
    } else if (typeof extracted === "string" && extracted.trim().length > 0) {
      return sanitizeResumeText(extracted);
    }
  } catch (error) {
    console.warn("[PDF Parser] unpdf extraction fallback:", error);
  }

  // 2. Fallback text extraction from raw buffer ASCII/UTF-8 streams
  try {
    const rawString = pdfBuffer.toString("utf-8");
    const extractedWords = rawString.match(/[a-zA-Z0-9.,;:()#+/'" -]{4,}/g);
    if (extractedWords && extractedWords.length > 20) {
      return sanitizeResumeText(extractedWords.join(" "));
    }
  } catch {
    // Fallback
  }

  return "";
}

function sanitizeResumeText(rawText: string): string {
  const cleaned = rawText
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Cap at 4,000 characters to conserve LLM context window & tokens
  return cleaned.slice(0, 4000);
}
