
import dotenv from 'dotenv';
import path from 'path';
import Razorpay from 'razorpay';
// import { PLANS } from '../src/lib/plans';

const PLANS = {
    free: {
        id: 'free',
        name: 'Free Plan',
        price: 0,
        interval: 'monthly',
        currency: 'INR',
        features: {
            max_businesses: 1,
            max_shops_per_business: 1,
        },
    },
    basic: {
        id: 'basic_placeholder', // To be updated
        name: 'Standard Plan',
        price: 299,
        interval: 'monthly',
        currency: 'INR',
        features: {
            max_businesses: 1,
            max_shops_per_business: 3,
        },
    },
    pro: {
        id: 'pro_placeholder', // To be updated
        name: 'Pro Plan',
        price: 799,
        interval: 'monthly',
        currency: 'INR',
        features: {
            max_businesses: 1,
            max_shops_per_business: 10,
        },
    },
    enterprise: {
        id: 'enterprise_placeholder', // To be updated
        name: 'Enterprise Plan',
        price: 1499,
        interval: 'monthly',
        currency: 'INR',
        features: {
            max_businesses: 5,
            max_shops_per_business: 50,
        },
    },
};

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') }); // Fallback or override


if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('Error: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing in .env.production');
    process.exit(1);
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createPlan(key: string, planDetails: any) {
    console.log(`Creating plan: ${planDetails.name} (${key})...`);

    try {
        const plan = await razorpay.plans.create({
            period: planDetails.interval,
            interval: 1,
            item: {
                name: `Vallaroo ${planDetails.name}`,
                amount: planDetails.price * 100, // Amount in paise
                currency: planDetails.currency,
                description: `Subscription for ${planDetails.name} - ${planDetails.interval}`
            },
            notes: {
                internal_key: key
            }
        });

        console.log(`✅ Plan Created: ${key}`);
        console.log(`   ID: ${plan.id}`);
        return { key, id: plan.id };
    } catch (error) {
        console.error(`❌ Failed to create plan ${key}:`, error);
        return { key, error };
    }
}

async function main() {
    console.log('Starting Razorpay Plan Generation...');

    const results: Record<string, string> = {};

    for (const [key, plan] of Object.entries(PLANS)) {
        if (plan.price === 0) {
            console.log(`Skipping free plan: ${key}`);
            continue;
        }

        const result = await createPlan(key, plan);
        if (result.id) {
            results[key] = result.id;
        }
    }

    console.log('\n--- GENERATED IDS ---');
    console.log('Copy these IDs into src/lib/plans.ts:\n');
    console.log(JSON.stringify(results, null, 2));
}

main();
