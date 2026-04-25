/**
 * Firebase Storage helpers — server-side file operations.
 * Used for PDF uploads and certificate storage.
 */
import { adminStorage } from './admin';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file buffer to Firebase Storage.
 * Returns the public download URL.
 */
export async function uploadFileBuffer(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const bucket = adminStorage.bucket();
  const file = bucket.file(path);

  await file.save(buffer, {
    contentType,
    metadata: {
      firebaseStorageDownloadTokens: uuidv4(),
    },
  });

  // Make file publicly accessible via download token
  const [metadata] = await file.getMetadata();
  const token = metadata.metadata?.firebaseStorageDownloadTokens;
  const encodedPath = encodeURIComponent(path);
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const bucket_name = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  return `https://firebasestorage.googleapis.com/v0/b/${bucket_name}/o/${encodedPath}?alt=media&token=${token}`;
}

/**
 * Deletes a file from Firebase Storage by its full path.
 */
export async function deleteStorageFile(path: string): Promise<void> {
  const bucket = adminStorage.bucket();
  const file = bucket.file(path);
  await file.delete({ ignoreNotFound: true });
}

/**
 * Returns the storage path for a user's uploaded document.
 */
export function getUserUploadPath(uid: string, filename: string): string {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `uploads/${uid}/${Date.now()}_${sanitized}`;
}

/**
 * Returns the storage path for a certificate PDF.
 */
export function getCertificatePath(certId: string): string {
  return `certificates/${certId}.pdf`;
}
