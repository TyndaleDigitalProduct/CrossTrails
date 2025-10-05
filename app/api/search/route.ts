import { NextRequest, NextResponse } from 'next/server'
import { SearchAPIResponse, APIError } from '@/lib/types'
import nltClient from '@/lib/bible-api/nltClient'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const terms = searchParams.get('terms')?.trim() || ''

    try {
        const searchResponse: SearchAPIResponse[] = []
        const response = await nltClient.getPassagesBySearch(terms);
        response.structuredOutput.results.map((item) => {
            const refParts = item.reference.split('.');

            const searchItem: SearchAPIResponse = {
                book: refParts[0],
                chapter: parseInt(refParts[1]),
                text: item.passage,
                translation: 'NLT',
                copyright: '© 1996, 2004, 2015 by Tyndale House Foundation'
            }

            searchResponse.push(searchItem)
        })

        return NextResponse.json(searchResponse)
    } catch (error) {
        console.error('Error fetching verses:', error)

        return NextResponse.json(
            {
                error: {
                    code: 'VERSE_FETCH_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to fetch verses',
                    timestamp: new Date().toISOString(),
                    request_id: generateRequestId()
                }
            } as APIError,
            { status: 500 }
        )
    }
}

function generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}