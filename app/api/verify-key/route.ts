import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify case.dev API Key
 * Simple endpoint to validate API keys without authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    if (!apiKey.startsWith('sk_case_')) {
      return NextResponse.json(
        { error: 'Invalid API key format. Key should start with sk_case_' },
        { status: 400 }
      );
    }

    // Verify API key works by calling the vaults list endpoint
    try {
      const response = await fetch('https://api.case.dev/vault', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API key verification failed:', response.status, errorText);

        if (response.status === 401) {
          return NextResponse.json(
            { error: 'Invalid API key - please check your credentials' },
            { status: 401 }
          );
        }

        if (response.status === 403) {
          return NextResponse.json(
            { error: 'API key does not have required permissions' },
            { status: 403 }
          );
        }

        if (response.status === 429) {
          return NextResponse.json(
            { error: 'Rate limit exceeded - please try again in a moment' },
            { status: 429 }
          );
        }

        return NextResponse.json(
          { error: 'Failed to verify API key' },
          { status: 500 }
        );
      }

      const data = await response.json();

      // Verify response format
      if (typeof data.total === 'undefined' || !Array.isArray(data.vaults)) {
        console.error('Unexpected API response format:', data);
        return NextResponse.json(
          { error: 'Unexpected API response format' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'API key verified successfully',
      });
    } catch (error: any) {
      console.error('Error verifying API key:', error);

      if (error.message?.includes('timed out')) {
        return NextResponse.json(
          { error: 'Request timed out - case.dev API may be slow. Please try again.' },
          { status: 504 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to verify API key. Please check your connection.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[verify-key] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify API key' },
      { status: 500 }
    );
  }
}
