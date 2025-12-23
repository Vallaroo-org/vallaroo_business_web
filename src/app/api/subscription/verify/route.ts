
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature
        } = body;

        if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            console.error('RAZORPAY_KEY_SECRET is not set');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Signature is valid. Update subscription status immediately.

        // Fetch subscription details from Razorpay to get accurate dates
        // @ts-ignore
        const rzpSubscription = await import('@/lib/razorpay').then(m => m.razorpay.subscriptions.fetch(razorpay_subscription_id));

        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                status: 'active',
                // @ts-ignore
                current_period_start: rzpSubscription.current_start ? new Date(rzpSubscription.current_start * 1000).toISOString() : new Date().toISOString(),
                // @ts-ignore
                current_period_end: rzpSubscription.current_end ? new Date(rzpSubscription.current_end * 1000).toISOString() : null,
                updated_at: new Date().toISOString()
            })
            .eq('razorpay_subscription_id', razorpay_subscription_id)
            .eq('user_id', user.id);

        if (updateError) {
            console.error('Failed to update subscription:', updateError);
            return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Verification Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
