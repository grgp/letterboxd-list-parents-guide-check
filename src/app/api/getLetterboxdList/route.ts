import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://api.letterboxd.com/api/v0';
const LIST_ID = 'grgp/to-watch-3-w-descriptions'; // Replace with the actual list ID

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/list/${LIST_ID}`, {
      headers: {
        'Authorization': `Bearer ${process.env.LETTERBOXD_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Letterboxd list:', error);
    return NextResponse.json({ error: 'Failed to fetch Letterboxd list' }, { status: 500 });
  }
}
