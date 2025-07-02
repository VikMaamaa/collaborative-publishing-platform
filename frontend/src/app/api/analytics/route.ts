import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Log analytics data (in production, you'd send this to your analytics service)
    console.log('[Analytics]', {
      timestamp: new Date().toISOString(),
      ...data,
    });
    
    // Here you could:
    // 1. Send to Google Analytics
    // 2. Send to Mixpanel
    // 3. Store in your database
    // 4. Send to error tracking service (Sentry, etc.)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Analytics data received' 
    });
    
  } catch (error) {
    console.error('[Analytics Error]', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process analytics data' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Analytics endpoint is working' 
  });
} 