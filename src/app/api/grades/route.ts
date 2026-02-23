import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Save to public dir to ensure stability across hot reloads and easy access
const GRADES_FILE = path.join(process.cwd(), 'public', 'global_grades.json');

export async function GET() {
  try {
    if (fs.existsSync(GRADES_FILE)) {
      const data = fs.readFileSync(GRADES_FILE, 'utf8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json({});
  } catch {
    return NextResponse.json({ error: 'Failed to read grades' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const grades = await request.json();
    fs.writeFileSync(GRADES_FILE, JSON.stringify(grades, null, 2));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save grades' }, { status: 500 });
  }
}
