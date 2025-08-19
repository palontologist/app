import { NextResponse } from 'next/server'
import { createTask } from '@/app/actions/tasks'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const res = await createTask(formData)
    return NextResponse.json(res)
  } catch (error) {
    console.error('Failed to submit task:', error)
    return NextResponse.json({ success: false, error: 'Failed to create task' })
  }
}
