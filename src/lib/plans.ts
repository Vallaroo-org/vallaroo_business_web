import { Plan } from './types';

export const PLANS: Record<string, Plan> = {
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
        id: 'plan_RqnippKbspcMHf', // Standard Plan
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
        id: 'plan_RqniqRO8KXxjVz', // Pro Plan
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
        id: 'plan_Rqniqyx2tuGJPz', // Enterprise Plan
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
