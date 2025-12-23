import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { razorpay } from '@/lib/razorpay';
import { PLANS } from '@/lib/plans';

export async function POST(req: Request) {
    try {
        const supabase = await createClient(); // Await the promise
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { planKey } = body; // 'basic', 'pro', 'enterprise'

        if (!planKey || !PLANS[planKey]) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        const selectedPlan = PLANS[planKey];
        if (selectedPlan.price === 0) {
            return NextResponse.json({ error: 'Cannot create subscription for free plan' }, { status: 400 });
        }

        // Check if user already has an active subscription
        const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['active', 'created', 'authenticated'])
            .single();

        if (existingSub) {
            // Logic to upgrade/downgrade could go here, but for now blocking new creation
            // return NextResponse.json({ error: 'User already has an active subscription' }, { status: 400 });
            // Actually, if it's 'created' (pending), we might want to return the existing one or cancel it.
            // For simplicity, let's allow creating a new one and client handles the flow.
        }

        // Create subscription on Razorpay
        // We need the Razorpay Plan ID. Since we don't have it yet (waiting for setup),
        // I will assume PLANS[planKey].id will hold the valid Razorpay Plan ID.
        // I need to update PLANS in src/lib/plans.ts with real IDs after running setup.

        const subscriptionOptions = {
            plan_id: selectedPlan.id,
            customer_notify: 1 as 0 | 1,
            total_count: 120, // 10 years monthly
            quantity: 1,
            notes: {
                user_id: user.id,
                plan_key: planKey
            }
        };

        const subscription: any = await razorpay.subscriptions.create(subscriptionOptions);

        // Store in DB
        // Store in DB (Upsert)
        const { error: dbError } = await supabase.from('subscriptions').upsert({
            user_id: user.id,
            plan_id: planKey,
            razorpay_subscription_id: subscription.id,
            status: 'created',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

        if (dbError) {
            console.error('DB Insert Error:', dbError);
            return NextResponse.json({ error: 'Failed to record subscription' }, { status: 500 });
        }

        return NextResponse.json({
            subscription_id: subscription.id,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('Subscription Creation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
