import * as pdfjsLib from "pdfjs-dist";
import { createWorker } from "tesseract.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

type PDFTextItem = {
  str?: string;
};

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

export async function extractTextFromPDF(file: File): Promise<string> {
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

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
