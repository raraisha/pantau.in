import { NextResponse } from 'next/server'

export async function GET(req: Request) {
const { searchParams } = new URL(req.url)
const q = searchParams.get('q')

if (!q) return NextResponse.json([])

const url = https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}

const res = await fetch(url, {
headers: {
'User-Agent': 'pantauin-app'
}
})

const data = await res.json()
return NextResponse.json(data)
}
}    