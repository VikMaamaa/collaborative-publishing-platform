import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  const { searchParams } = new URL(req.url);
  const providedSecret = searchParams.get('secret');
  const postId = searchParams.get('postId');

  if (!secret || providedSecret !== secret) {
    return new NextResponse(JSON.stringify({ message: 'Invalid secret' }), {
      status: 401,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
    });
  }
  if (!postId) {
    return new NextResponse(JSON.stringify({ message: 'Missing postId' }), {
      status: 400,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
    });
  }

  try {
    // Revalidate the post detail page
    // For app router, use revalidatePath
    // @ts-ignore
    await (global as any).revalidatePath(`/posts/${postId}`);
    return new NextResponse(JSON.stringify({ revalidated: true, postId }), {
      status: 200,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new NextResponse(JSON.stringify({ message: 'Error revalidating', error: String(err) }), {
      status: 500,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
    });
  }
} 