import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET() {
  try {
    // Test basic functionality
    const testData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      runtime: process.env.NEXT_RUNTIME || 'unknown',
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
    
    console.log('🧪 Test endpoint called:', testData)
    
    return NextResponse.json(testData)
  } catch (error) {
    console.error('❌ Test endpoint error:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🧪 Test POST received:', body)
    
    return NextResponse.json({ 
      status: 'ok',
      received: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Test POST error:', error)
    return NextResponse.json({ 
      error: 'Test POST failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
