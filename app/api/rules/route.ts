import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is missing' }, { status: 500 });
  }

  try {
    const response = await fetch(apiKey);
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: 'Failed to fetch data', details: message }, { status: 500 });
  }
}