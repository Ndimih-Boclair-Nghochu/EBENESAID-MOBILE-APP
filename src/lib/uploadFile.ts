import * as FileSystem from 'expo-file-system/legacy';
import {
  getDownloadURL,
  ref,
  uploadBytes,
  uploadBytesResumable,
  type UploadTask
} from 'firebase/storage';

import { getFirebaseStorage } from './firebase';

export interface UploadResult {
  fileUrl: string;
  storageKey: string;
}

interface UploadOptions {
  cacheControl?: string;
  onProgress?: (progress: number) => void;
}

export interface CancellableUpload<T> {
  promise: Promise<T>;
  cancel: () => void;
}

async function uriToBytes(uri: string): Promise<Uint8Array> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64
  });
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function sanitize(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9._-]/g, '-');
}

async function uploadInlineDataUrl(
  uri: string,
  mimeType: string,
  storageKey: string
): Promise<UploadResult> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64
  });

  return {
    fileUrl: `data:${mimeType};base64,${base64}`,
    storageKey: `inline-${storageKey}`
  };
}

async function uploadFile(
  storageKey: string,
  uri: string,
  mimeType: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const storage = getFirebaseStorage();

  if (!storage) {
    return uploadInlineDataUrl(uri, mimeType, storageKey);
  }

  const bytes = await uriToBytes(uri);
  const storageRef = ref(storage, storageKey);

  if (options.onProgress) {
    await new Promise<void>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, bytes, {
        contentType: mimeType,
        cacheControl: options.cacheControl
      });

      task.on(
        'state_changed',
        (snapshot) => {
          const progress =
            snapshot.totalBytes > 0 ? snapshot.bytesTransferred / snapshot.totalBytes : 0;
          options.onProgress?.(progress);
        },
        reject,
        () => resolve()
      );
    });
  } else {
    await uploadBytes(storageRef, bytes, {
      contentType: mimeType,
      cacheControl: options.cacheControl
    });
  }

  const fileUrl = await getDownloadURL(storageRef);
  return { fileUrl, storageKey };
}

function createCancellableUpload(
  storageKey: string,
  uri: string,
  mimeType: string,
  options: UploadOptions = {}
): CancellableUpload<UploadResult> {
  const storage = getFirebaseStorage();
  let task: UploadTask | null = null;
  let cancelled = false;

  if (!storage) {
    return {
      promise: uploadInlineDataUrl(uri, mimeType, storageKey),
      cancel: () => {
        cancelled = true;
      }
    };
  }

  const promise = uriToBytes(uri).then(
    (bytes) =>
      new Promise<UploadResult>((resolve, reject) => {
        if (cancelled) {
          reject(new Error('Upload cancelled.'));
          return;
        }

        const storageRef = ref(storage, storageKey);
        task = uploadBytesResumable(storageRef, bytes, {
          contentType: mimeType,
          cacheControl: options.cacheControl
        });

        task.on(
          'state_changed',
          (snapshot) => {
            const progress =
              snapshot.totalBytes > 0 ? snapshot.bytesTransferred / snapshot.totalBytes : 0;
            options.onProgress?.(progress);
          },
          reject,
          () => {
            void getDownloadURL(storageRef)
              .then((fileUrl) => resolve({ fileUrl, storageKey }))
              .catch(reject);
          }
        );
      })
  );

  return {
    promise,
    cancel: () => {
      cancelled = true;
      task?.cancel();
    }
  };
}

export async function uploadStudentDocument(
  userId: number,
  uri: string,
  filename: string,
  mimeType: string,
  options?: UploadOptions
): Promise<UploadResult> {
  const storageKey = `students/${userId}/documents/${Date.now()}-${sanitize(filename)}`;
  return uploadFile(storageKey, uri, mimeType, {
    cacheControl: 'private,max-age=3600',
    ...options
  });
}

export function createStudentDocumentUpload(
  userId: number,
  uri: string,
  filename: string,
  mimeType: string,
  options?: UploadOptions
): CancellableUpload<UploadResult> {
  const storageKey = `students/${userId}/documents/${Date.now()}-${sanitize(filename)}`;
  return createCancellableUpload(storageKey, uri, mimeType, {
    cacheControl: 'private,max-age=3600',
    ...options
  });
}

export async function uploadProfilePhoto(
  userId: number,
  uri: string,
  filename: string,
  mimeType: string,
  options?: UploadOptions
): Promise<UploadResult> {
  const storageKey = `students/${userId}/profile/${Date.now()}-${sanitize(filename)}`;
  return uploadFile(storageKey, uri, mimeType, {
    cacheControl: 'public,max-age=86400',
    ...options
  });
}

export async function uploadPartnerDocument(
  userId: number,
  role: string,
  uri: string,
  filename: string,
  mimeType: string,
  options?: UploadOptions
): Promise<UploadResult> {
  const storageKey = `${role}Partners/${userId}/documents/${Date.now()}-${sanitize(filename)}`;
  return uploadFile(storageKey, uri, mimeType, {
    cacheControl: 'private,max-age=3600',
    ...options
  });
}
