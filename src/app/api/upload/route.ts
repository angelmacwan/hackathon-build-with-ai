/**
 * POST /api/upload — Upload PDF to Firebase Storage.
 * Returns download URL for use in the chat.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/lib/firebase/auth';
import { uploadFileBuffer, getUserUploadPath } from '@/lib/firebase/storage';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

export async function POST(req: NextRequest) {
  let uid: string;
  try {
    uid = await verifyAuthHeader(req.headers.get('Authorization'));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = getUserUploadPath(uid, file.name);
    const downloadUrl = await uploadFileBuffer(storagePath, buffer, file.type);

    // Save upload metadata to user's Firestore record
    await adminDb.collection('users').doc(uid).collection('uploads').add({
      filename: file.name,
      storagePath,
      downloadUrl,
      size: file.size,
      uploadedAt: FieldValue.serverTimestamp(),
    });

    // Award XP for upload
    await adminDb.collection('users').doc(uid).update({
      xp: FieldValue.increment(40),
    });

    return NextResponse.json({ downloadUrl, filename: file.name, storagePath });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
