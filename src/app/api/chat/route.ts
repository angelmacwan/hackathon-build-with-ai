import { VertexAI } from '@google-cloud/vertexai';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    const project = process.env.GOOGLE_CLOUD_PROJECT || '';
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    if (!project) {
      return NextResponse.json(
        { error: 'GOOGLE_CLOUD_PROJECT environment variable is not set' },
        { status: 500 }
      );
    }

    const vertexAI = new VertexAI({ project: project, location: location });
    const generativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-1.5-flash-002',
    });

    const result = await generativeModel.generateContent(message);
    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI';

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Error calling Vertex AI:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
