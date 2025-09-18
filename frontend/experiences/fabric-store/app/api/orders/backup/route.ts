import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Create orders directory if it doesn't exist
    const ordersDir = path.join(process.cwd(), 'orders')
    await fs.mkdir(ordersDir, { recursive: true }).catch(() => {})

    // Save order data to a file
    const fileName = `order_${data.order.id}_${Date.now()}.json`
    const filePath = path.join(ordersDir, fileName)

    await fs.writeFile(filePath, JSON.stringify(data, null, 2))

    console.log('💾 Order backed up to:', fileName)

    return NextResponse.json({
      success: true,
      message: 'Order backed up successfully',
      fileName
    })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to backup order' },
      { status: 500 }
    )
  }
}