import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { image } = await request.json();
    
    // Use the API key from environment variable
    const apiKey = process.env.PLANT_ID_API_KEY || process.env.NEXT_PUBLIC_PLANT_ID_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'API key not configured',
        plant: 'Unknown',
        confidence: 0
      });
    }
    
    const response = await fetch('https://api.plant.id/v3/identification', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: [image],
        plant_details: ['common_names'],
        plant_language: 'en',
      }),
    });
    
    const data = await response.json();
    
    if (data.suggestions && data.suggestions.length > 0) {
      return NextResponse.json({
        plant: data.suggestions[0].plant_name,
        confidence: Math.round(data.suggestions[0].probability * 100),
        suggestions: data.suggestions
      });
    }
    
    return NextResponse.json({
      plant: 'Unknown',
      confidence: 0
    });
    
  } catch (error) {
    console.error('Plant scan error:', error);
    return NextResponse.json({
      error: 'Failed to scan plant',
      plant: 'Unknown',
      confidence: 0
    });
  }
}