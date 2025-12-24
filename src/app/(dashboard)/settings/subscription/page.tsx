'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import Script from 'next/script';

export default function SubscriptionPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [currentPlan, setCurrentPlan] = useState<any>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchSubscriptionAndPlans();
    }, []);

    const fetchSubscriptionAndPlans = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Plans
            const { data: plansData } = await supabase
                .from('plans')
                .select('*')
                .order('price', { ascending: true });

            setPlans(plansData || []);

            // Fetch active subscription
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .in('status', ['active', 'authenticated'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            setSubscription(sub);

            // Determine current plan details
            if (sub) {
                // If user has a subscription, current plan is the one from DB matching sub.plan_id
                const activePlan = plansData?.find(p => p.id === sub.plan_id);
                setCurrentPlan(activePlan || null);
            } else {
                // Default to Free plan if exists
                const freePlan = plansData?.find(p => p.price === 0 || p.id === 'free');
                setCurrentPlan(freePlan || { name: 'Free Plan', features: { max_businesses: 1 } });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planId: string) => {
        if (processingPlan) return;
        setProcessingPlan(planId);

        try {
            const response = await fetch('/api/subscription/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId })
            });

            const data = await response.json();

            if (data.error) {
                alert(data.error);
                setProcessingPlan(null);
                return;
            }

            const options = {
                key: data.key,
                subscription_id: data.subscription_id,
                name: 'Vallaroo Business',
                description: `Upgrade Subscription`,
                handler: async function (response: any) {
                    try {
                        const verifyResponse = await fetch('/api/subscription/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_subscription_id: response.razorpay_subscription_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyResponse.json();

                        if (verifyData.success) {
                            alert('Subscription Successful!');
                            await fetchSubscriptionAndPlans(); // Refresh state
                        } else {
                            alert('Payment verification failed: ' + (verifyData.error || 'Unknown error'));
                        }
                    } catch (err) {
                        console.error('Verification call failed', err);
                        alert('Payment verification failed. Please contact support.');
                    } finally {
                        setProcessingPlan(null);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setProcessingPlan(null);
                    }
                },
                theme: {
                    color: '#0F172A'
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Payment Error:', error);
            alert('Something went wrong. Please try again.');
            setProcessingPlan(null);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    // Filter out free plan from upgrade options usually, or maybe keep it if downgrading is allowed? 
    // Typically upgrade screen shows paid plans. 
    // Assuming 'plans' contains everything.


    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setIsRazorpayLoaded(true)}
            />

            <div>
                <h1 className="text-2xl font-bold text-foreground">Subscription & Billing</h1>
                <p className="mt-2 text-muted-foreground">Manage your subscription plan and upgrade to unlock more features.</p>
            </div>

            {/* Current Plan */}
            <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
                <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                    <h3 className="text-lg font-medium leading-6 text-foreground">Current Plan</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${subscription?.status === 'active' || !subscription ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {subscription ? subscription.status.toUpperCase() : 'FREE PLAN'}
                    </span>
                </div>
                <div className="px-6 py-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Plan</p>
                            <p className="mt-1 text-xl font-semibold text-foreground">{currentPlan?.name || 'Free Plan'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-muted-foreground">Usage & Features</p>
                            <ul className="text-sm mt-1 text-foreground space-y-1">
                                {currentPlan?.features?.benefits?.length > 0 ? (
                                    currentPlan.features.benefits.map((benefit: string, idx: number) => (
                                        <li key={idx}>
                                            <span className="flex items-center justify-end">
                                                {benefit}
                                                <Check className="w-3.5 h-3.5 text-green-500 ml-2" />
                                            </span>
                                        </li>
                                    ))
                                ) : (
                                    <>
                                        <li>Max Businesses: {currentPlan?.features?.max_businesses ?? 1}</li>
                                        <li>Max Shops/Business: {currentPlan?.features?.max_shops_per_business ?? 1}</li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upgrade Options */}
            <div>
                <h3 className="text-xl font-bold text-foreground mb-4">Available Plans</h3>



                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.filter(p => p.price > 0 || p.price === -1 || p.price === null).map((plan) => {
                        const isCurrentPlan = subscription && subscription.plan_id === plan.id;
                        const isProcessing = processingPlan === plan.id;
                        const isCustomPricing = plan.price === -1 || plan.price === null;

                        return (
                            <div
                                key={plan.id}
                                className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-200 ${isCurrentPlan
                                    ? 'border-primary/50 bg-primary/5 shadow-xl shadow-primary/10'
                                    : 'border-border bg-card hover:border-primary/50 hover:shadow-lg'
                                    }`}
                            >
                                {isCurrentPlan && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider">
                                        Current Plan
                                    </div>
                                )}

                                <div className="mb-4">
                                    <h4 className="text-xl font-bold text-foreground">{plan.name}</h4>
                                    <div className="mt-4 flex items-baseline text-foreground">
                                        {isCustomPricing ? (
                                            <span className="text-3xl font-extrabold tracking-tight">Custom</span>
                                        ) : (
                                            <>
                                                <span className="text-4xl font-extrabold tracking-tight">₹{plan.price}</span>
                                                <span className="ml-1 text-sm font-medium text-muted-foreground">/mo</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <ul className="space-y-3 mt-6">
                                        {/* Prioritize benefits array if available as it usually contains the full marketing copy */}
                                        {plan.features?.benefits?.length > 0 ? (
                                            plan.features.benefits.map((benefit: string, idx: number) => (
                                                <li key={idx} className="flex items-start text-sm text-foreground/80">
                                                    <Check className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                                                    <span className="leading-5">{benefit}</span>
                                                </li>
                                            ))
                                        ) : (
                                            /* Fallback to structured limits if no benefits text exists */
                                            <>
                                                {plan.features?.max_businesses !== undefined && (
                                                    <li className="flex items-start text-sm text-foreground/80">
                                                        <Check className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                                                        <span>{plan.features.max_businesses === -1 ? 'Unlimited' : `Up to ${plan.features.max_businesses}`} Business{plan.features.max_businesses !== 1 ? 'es' : ''}</span>
                                                    </li>
                                                )}
                                                {plan.features?.max_shops_per_business !== undefined && (
                                                    <li className="flex items-start text-sm text-foreground/80">
                                                        <Check className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                                                        <span>{plan.features.max_shops_per_business === -1 ? 'Unlimited' : `Up to ${plan.features.max_shops_per_business}`} Shops per Business</span>
                                                    </li>
                                                )}
                                            </>
                                        )}
                                    </ul>
                                </div>

                                <div className="mt-8 pt-6 border-t border-border/50">
                                    {isCustomPricing ? (
                                        <Button
                                            className="w-full h-11 font-medium text-base rounded-xl"
                                            variant="outline"
                                            onClick={() => window.location.href = 'mailto:sales@vallaroo.com?subject=Enterprise%20Plan%20Inquiry'}
                                        >
                                            Contact Sales
                                        </Button>
                                    ) : (
                                        <Button
                                            className={`w-full h-11 font-semibold text-base rounded-xl transition-all ${isCurrentPlan ? '' : 'hover:scale-[1.02] active:scale-[0.98]'
                                                }`}
                                            onClick={() => handleUpgrade(plan.id)}
                                            disabled={!!processingPlan || !isRazorpayLoaded || isCurrentPlan}
                                            variant={isCurrentPlan ? 'secondary' : 'default'}
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                isCurrentPlan ? 'Current Plan' : 'Upgrade Plan'
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
