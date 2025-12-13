import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';

export async function GET() {
    try {
        const plansToCreate = [
            {
                period: 'monthly',
                interval: 1,
                item: {
                    name: 'Standard Plan',
                    amount: 29900, // 299 INR in paise
                    currency: 'INR',
                    description: 'Standard plan for growing businesses',
                },
                notes: { key: 'basic' }
            },
            {
                period: 'monthly',
                interval: 1,
                item: {
                    name: 'Pro Plan',
                    amount: 79900, // 799 INR in paise
                    currency: 'INR',
                    description: 'Pro plan for businesses with multiple shops',
                },
                notes: { key: 'pro' }
            }
        ];

        const createdPlans = [];

        for (const planData of plansToCreate) {
            // @ts-ignore
            const plan: any = await razorpay.plans.create(planData);
            createdPlans.push({
                key: planData.notes.key,
                id: plan.id,
                name: plan.item.name
            });
        }

        return NextResponse.json({ createdPlans });
    } catch (error) {
        console.error('Error creating plans:', error);
        return NextResponse.json({ error: 'Failed to create plans', details: error }, { status: 500 });
    }
}
