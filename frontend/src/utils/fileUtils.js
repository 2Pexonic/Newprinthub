import { PDFDocument } from "pdf-lib";

const SUPPORTED_TYPES = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/png": "image",
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Validate a file for upload.
 */
export function validateFile(file) {
  if (!file) return { valid: false, error: "No file selected" };
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is 100MB.` };
  }
  const ext = file.name.split(".").pop().toLowerCase();
  const validExts = ["pdf", "docx", "pptx", "jpg", "jpeg", "png"];
  if (!validExts.includes(ext)) {
    return { valid: false, error: `Unsupported format. Supported: PDF, DOCX, PPTX, JPG, PNG` };
  }
  return { valid: true, error: null };
}

/**
 * Get page count from a PDF file.
 */
async function getPdfPageCount(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    return pdfDoc.getPageCount();
  } catch (error) {
    console.error("Error reading PDF:", error);
    return 1;
  }
}

/**
 * Estimate page count from DOCX file by word count approximation.
 */
async function getDocxPageCount(file) {
  try {
    // Simple estimation: ~250 words per page, ~5 chars per word
    const text = await file.text();
    const wordCount = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 250));
  } catch {
    return 1;
  }
}

/**
 * Estimate page count from PPTX (each slide = 1 page).
 */
async function getPptxPageCount(file) {
  try {
    // PPTX files are ZIP archives; slides are in ppt/slides/
    // Simple estimation based on file size
    const sizeMB = file.size / (1024 * 1024);
    return Math.max(1, Math.ceil(sizeMB * 10)); // rough estimate
  } catch {
    return 1;
  }
}

/**
 * Detect page count from a file.
 */
export async function detectPageCount(file) {
  const ext = file.name.split(".").pop().toLowerCase();

  switch (ext) {
    case "pdf":
      return await getPdfPageCount(file);
    case "docx":
      return await getDocxPageCount(file);
    case "pptx":
      return await getPptxPageCount(file);
    case "jpg":
    case "jpeg":
    case "png":
      return 1;
    default:
      return 1;
  }
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/**
 * Get file type icon name.
 */
export function getFileTypeIcon(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "pdf": return "FileText";
    case "docx": return "FileText";
    case "pptx": return "Presentation";
    case "jpg":
    case "jpeg":
    case "png": return "Image";
    default: return "File";
  }
}

/**
 * Generate a unique file name for storage.
 */
export function generateStorageFileName(originalName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 8);
  const ext = originalName.split(".").pop();
  return `${timestamp}_${random}.${ext}`;
}
