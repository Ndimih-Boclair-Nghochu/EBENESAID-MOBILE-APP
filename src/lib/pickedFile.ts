import type { DocumentPickerAsset } from 'expo-document-picker';
import type { ImagePickerAsset } from 'expo-image-picker';

export interface PickedFile {
  uri: string;
  filename: string;
  mimeType: string;
  fileSize?: number;
}

const extensionMimeTypes: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf'
};

function filenameFromUri(uri: string, fallback: string) {
  const candidate = uri.split('/').filter(Boolean).pop();
  return candidate?.includes('.') ? candidate : fallback;
}

export function mimeFromFilename(filename: string, fallback = 'application/octet-stream') {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? extensionMimeTypes[extension] ?? fallback : fallback;
}

export function normalizeImageAsset(asset: ImagePickerAsset, fallbackName = 'photo.jpg'): PickedFile {
  const filename = asset.fileName ?? filenameFromUri(asset.uri, fallbackName);
  return {
    uri: asset.uri,
    filename,
    mimeType: asset.mimeType ?? mimeFromFilename(filename, 'image/jpeg'),
    fileSize: asset.fileSize
  };
}

export function normalizeDocumentAsset(
  asset: DocumentPickerAsset,
  fallbackName = 'document.pdf'
): PickedFile {
  const filename = asset.name ?? filenameFromUri(asset.uri, fallbackName);
  return {
    uri: asset.uri,
    filename,
    mimeType: asset.mimeType ?? mimeFromFilename(filename),
    fileSize: asset.size
  };
}

export function validatePickedFile(
  file: PickedFile,
  allowedMimeTypes: readonly string[],
  maxBytes: number
): string | null {
  if (!allowedMimeTypes.includes(file.mimeType)) {
    return `Unsupported file type: ${file.mimeType}`;
  }

  if (file.fileSize && file.fileSize > maxBytes) {
    const maxMegabytes = Math.round(maxBytes / (1024 * 1024));
    return `File must be ${maxMegabytes}MB or smaller.`;
  }

  return null;
}
