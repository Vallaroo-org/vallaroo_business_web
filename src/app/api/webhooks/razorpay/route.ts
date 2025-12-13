import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-razorpay-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
            // If secret is not set, we can't verify. For safety, log error.
            console.error('RAZORPAY_WEBHOOK_SECRET is not set');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (generatedSignature !== signature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const event = JSON.parse(body);
        const supabase = await createClient();

        // Handle relevant events
        // subscription.authenticated, subscription.charged, subscription.halted, subscription.cancelled

        switch (event.event) {
            case 'subscription.authenticated':
            case 'subscription.activated':
                await handleSubscriptionUpdate(supabase, event.payload.subscription.entity);
                break;
            case 'subscription.charged':
                // Optional: Record payment in payment_history
                await handleSubscriptionUpdate(supabase, event.payload.subscription.entity);
                break;
            case 'subscription.halted':
            case 'subscription.cancelled':
            case 'subscription.completed':
            case 'subscription.expired':
            case 'subscription.paused':
                await handleSubscriptionUpdate(supabase, event.payload.subscription.entity);
                break;
            default:
                break;
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function handleSubscriptionUpdate(supabase: any, subscriptionEntity: any) {
    const {
        id: razorpay_subscription_id,
        status,
        current_start,
        current_end,
        notes
    } = subscriptionEntity;

    const user_id = notes?.user_id;

    if (!user_id && !razorpay_subscription_id) {
        console.error('Missing user_id or subscription_id in webhook payload');
        return;
    }

    // Identify user by razorpay_subscription_id if user_id missing
    let query = supabase.from('subscriptions').select('*');
    if (razorpay_subscription_id) {
        query = query.eq('razorpay_subscription_id', razorpay_subscription_id);
    } else {
        // Fallback, though we should really find by sub id
        return;
    }

    const { data: existingSub, error: updateError } = await supabase
        .from('subscriptions')
        .update({
            status: status, // active, authenticated, etc.
            current_period_start: current_start ? new Date(current_start * 1000).toISOString() : null,
            current_period_end: current_end ? new Date(current_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString()
        })
        .eq('razorpay_subscription_id', razorpay_subscription_id);

    if (updateError) {
        console.error('Failed to update subscription:', updateError);
    }
}
