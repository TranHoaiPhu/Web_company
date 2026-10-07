import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
    try {
        const { idbooking, status } = await request.json();
        
        if (!idbooking || status === undefined) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Get authorization token from headers
        const authorization = request.headers.get('authorization');
        if (!authorization) {
            return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
        }

        // Call the external API to update booking status
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://ai-trip-api-40205731279.us-central1.run.app/api/v1";
        const response = await fetch(`${API_BASE_URL}/bookings/${idbooking}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorization
            },
            body: JSON.stringify({ status: status })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error updating booking status:', response.status, errorText);
            return NextResponse.json({ error: 'Failed to update booking status' }, { status: response.status });
        }

        const data = await response.json();
        console.log('Booking status updated successfully:', data);

        return NextResponse.json(data);

    } catch (error) {
        console.error('Error in update booking status API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
