/**
 * Multi-Format Document Processor
 * Handles extraction of text from various document types and URLs
 */

import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

type PDFTextItem = {
  str?: string;
};

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  txt: "text/plain",
  csv: "text/csv",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export const SUPPORTED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".csv",
  ".ppt",
  ".pptx",
];

export interface FileMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedAt: number;
}

export interface DocumentExtractionResult {
  text: string;
  metadata: FileMetadata;
  source: "file" | "url" | "text";
}

// ==========================================
// PDF Processing
// ==========================================

async function extractPageText(page: pdfjsLib.PDFPageProxy): Promise<string> {
  const content = await page.getTextContent();
  return content.items
    .map((item) => (item as PDFTextItem).str || "")
    .join(" ")
    .trim();
}

async function renderPageToCanvas(page: pdfjsLib.PDFPageProxy) {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas rendering is unavailable in this browser.");
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return canvas;
}

async function ocrPage(page: pdfjsLib.PDFPageProxy): Promise<string> {
  const canvas = await renderPageToCanvas(page);
  const worker = await createWorker("eng");

  try {
    const {
      data: { text },
    } = await worker.recognize(canvas);
    return text.trim();
  } finally {
    await worker.terminate();
  }
}

async function extractFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const texts: string[] = [];
  const emptyPages: number[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const pageText = await extractPageText(page);
    texts.push(pageText);

    if (!pageText) {
      emptyPages.push(i);
    }
  }

  const textContent = texts.join("\n\n").trim();
  if (textContent.length > 0) {
    return textContent;
  }

  if (emptyPages.length === 0) {
    throw new Error("No readable text was found in this PDF.");
  }

  const ocrTexts: string[] = [];
  const pagesToOCR = emptyPages.slice(0, Math.min(3, emptyPages.length));

  for (const pageNumber of pagesToOCR) {
    const page = await pdf.getPage(pageNumber);
    const ocrText = await ocrPage(page);
    if (ocrText) {
      ocrTexts.push(ocrText);
    }
  }

  const ocrContent = ocrTexts.join("\n\n").trim();
  if (!ocrContent) {
    throw new Error(
      "This PDF appears to be image-based and OCR could not extract readable text.",
    );
  }

  return ocrContent;
}

// ==========================================
// Text Format Processing
// ==========================================

async function extractFromText(file: File): Promise<string> {
  const text = await file.text();
  if (!text.trim()) {
    throw new Error("The text file appears to be empty.");
  }
  return text.trim();
}

async function extractFromCSV(file: File): Promise<string> {
  const text = await file.text();
  if (!text.trim()) {
    throw new Error("The CSV file appears to be empty.");
  }
  // Convert CSV to readable format
  const lines = text.split("\n").filter((line) => line.trim());
  const content = lines
    .map((line) => {
      // Simple CSV parsing - split by comma, preserve structure
      return line.split(",").map((cell) => cell.trim()).join(" | ");
    })
    .join("\n");
  return content.trim();
}

// ==========================================
// Office Document Processing
// ==========================================

async function extractFromDocX(file: File): Promise<string> {
  // For DOCX files, we'll use a simple approach: ask user to convert or use backend
  // This requires docx parsing library or server-side processing
  throw new Error(
    "DOCX extraction is handled server-side. Please use the backend endpoint.",
  );
}

async function extractFromPPT(file: File): Promise<string> {
  // PPT extraction requires server-side processing
  throw new Error(
    "PowerPoint extraction is handled server-side. Please use the backend endpoint.",
  );
}

// ==========================================
// URL/Link Processing
// ==========================================

export async function validateAndProcessURL(url: string): Promise<string> {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;

    // Support public resources
    const supportedDomains = [
      "docs.google.com",
      "wikipedia.org",
      "medium.com",
      "arxiv.org",
      "github.com",
      "dev.to",
    ];

    const isSupported = supportedDomains.some((d) => domain.includes(d));
    if (!isSupported) {
      throw new Error(
        `Domain ${domain} not directly supported. Currently support: Google Drive, Wikipedia, Medium, arXiv, GitHub, Dev.to`,
      );
    }

    // For Google Drive: extract sharing link info
    if (domain.includes("docs.google.com")) {
      return parseGoogleDocLink(url);
    }

    // For other domains: attempt to fetch and parse
    // This will typically fail in browser due to CORS, so should be backend endpoint or user prompted to use server
    throw new Error(
      "URL content extraction requires server-side processing for this domain.",
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Invalid URL provided");
  }
}

function parseGoogleDocLink(url: string): string {
  // Extract document ID from Google Drive/Docs URL
  const patterns = [
    /\/document\/d\/([A-Za-z0-9-_]+)/,
    /id=([A-Za-z0-9-_]+)/,
    /spreadsheets\/d\/([A-Za-z0-9-_]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `Google Drive Document: ${match[1]}`;
    }
  }

  throw new Error("Could not extract document ID from Google Drive link");
}

// ==========================================
// Main Document Processor
// ==========================================

export async function processDocument(file: File): Promise<DocumentExtractionResult> {
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    throw new Error(`File is too large. Maximum size is 50MB. Got ${(file.size / 1024 / 1024).toFixed(1)}MB`);
  }

  let text = "";
  let fileType = "unknown";

  try {
    if (file.type === SUPPORTED_FILE_TYPES.pdf || file.name.endsWith(".pdf")) {
      text = await extractFromPDF(file);
      fileType = "PDF";
    } else if (
      file.type === SUPPORTED_FILE_TYPES.txt ||
      file.name.endsWith(".txt")
    ) {
      text = await extractFromText(file);
      fileType = "Text";
    } else if (
      file.type === SUPPORTED_FILE_TYPES.csv ||
      file.name.endsWith(".csv")
    ) {
      text = await extractFromCSV(file);
      fileType = "CSV";
    } else if (
      file.type === SUPPORTED_FILE_TYPES.docx ||
      file.name.endsWith(".docx")
    ) {
      throw new Error("DOCX files require server-side processing");
    } else if (
      file.type === SUPPORTED_FILE_TYPES.doc ||
      file.name.endsWith(".doc")
    ) {
      throw new Error("DOC files require server-side processing");
    } else if (
      file.type === SUPPORTED_FILE_TYPES.ppt ||
      file.type === SUPPORTED_FILE_TYPES.pptx ||
      file.name.endsWith(".ppt") ||
      file.name.endsWith(".pptx")
    ) {
      throw new Error("PowerPoint files require server-side processing");
    } else {
      throw new Error(
        `Unsupported file type: ${file.type || file.name}. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`,
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to process document");
  }

  if (!text.trim()) {
    throw new Error("No extractable content found in the document");
  }

  return {
    text,
    metadata: {
      fileName: file.name,
      fileType,
      fileSize: file.size,
      extractedAt: Date.now(),
    },
    source: "file",
  };
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
