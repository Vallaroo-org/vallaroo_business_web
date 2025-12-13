'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PLANS } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import Script from 'next/script';

export default function SubscriptionPage() {
    const [currentPlan, setCurrentPlan] = useState<any>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: sub } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .in('status', ['active', 'authenticated', 'created']) // 'created' logic needs care
                .order('created_at', { ascending: false }) // Get latest
                .limit(1)
                .single();

            setSubscription(sub);

            if (sub && PLANS[sub.plan_id]) {
                setCurrentPlan(PLANS[sub.plan_id]);
            } else {
                setCurrentPlan(PLANS.free);
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
            setCurrentPlan(PLANS.free);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planKey: string) => {
        if (processing) return;
        setProcessing(true);

        try {
            const response = await fetch('/api/subscription/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planKey })
            });

            const data = await response.json();

            if (data.error) {
                alert(data.error);
                setProcessing(false);
                return;
            }

            const options = {
                key: data.key,
                subscription_id: data.subscription_id,
                name: 'Vallaroo Business',
                description: `Upgrade to ${PLANS[planKey].name}`,
                handler: async function (response: any) {
                    // console.log('Payment Success:', response);
                    alert('Subscription Successful!');
                    fetchSubscription(); // Refresh state
                    setProcessing(false);
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false);
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
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    const plans = [PLANS.basic, PLANS.pro, PLANS.enterprise];

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

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
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Plan</p>
                            <p className="mt-1 text-xl font-semibold text-foreground">{currentPlan?.name || 'Free Plan'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-muted-foreground">Usage</p>
                            <ul className="text-sm mt-1 text-foreground">
                                <li>Max Businesses: {currentPlan?.features.max_businesses}</li>
                                <li>Max Shops/Business: {currentPlan?.features.max_shops_per_business}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upgrade Options */}
            <div>
                <h3 className="text-xl font-bold text-foreground mb-4">Available Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className="border border-border rounded-lg p-6 bg-card flex flex-col hover:border-primary transition-colors">
                            <h4 className="text-lg font-semibold text-foreground">{plan.name}</h4>
                            <div className="mt-2 text-3xl font-bold text-foreground">
                                {plan.price === -1 ? 'Custom' : (
                                    <>
                                        ₹{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                                    </>
                                )}
                            </div>

                            <ul className="mt-6 space-y-4 flex-1">
                                {plan.price === -1 ? (
                                    <>
                                        <li className="flex items-center text-sm">
                                            <Check className="w-4 h-4 text-green-500 mr-2" />
                                            <span>Unlimited Businesses</span>
                                        </li>
                                        <li className="flex items-center text-sm">
                                            <Check className="w-4 h-4 text-green-500 mr-2" />
                                            <span>Custom Shop Limits</span>
                                        </li>
                                        <li className="flex items-center text-sm">
                                            <Check className="w-4 h-4 text-green-500 mr-2" />
                                            <span>Dedicated Support</span>
                                        </li>
                                    </>
                                ) : (
                                    <>
                                        <li className="flex items-center text-sm">
                                            <Check className="w-4 h-4 text-green-500 mr-2" />
                                            <span>Up to {plan.features.max_businesses} Business{plan.features.max_businesses > 1 ? 'es' : ''}</span>
                                        </li>
                                        <li className="flex items-center text-sm">
                                            <Check className="w-4 h-4 text-green-500 mr-2" />
                                            <span>Up to {plan.features.max_shops_per_business} Shops per Business</span>
                                        </li>
                                    </>
                                )}
                            </ul>

                            {plan.price === -1 ? (
                                <Button
                                    className="mt-8 w-full"
                                    variant="outline"
                                    onClick={() => window.location.href = 'mailto:sales@vallaroo.com?subject=Enterprise%20Plan%20Inquiry'}
                                >
                                    Contact Sales
                                </Button>
                            ) : (
                                <Button
                                    className="mt-8 w-full"
                                    onClick={() => handleUpgrade(Object.keys(PLANS).find(key => PLANS[key].id === plan.id) || '')}
                                    disabled={processing || (subscription && subscription.plan_id === Object.keys(PLANS).find(key => PLANS[key].id === plan.id))}
                                    variant={subscription && subscription.plan_id === Object.keys(PLANS).find(key => PLANS[key].id === plan.id) ? 'outline' : 'default'}
                                >
                                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                        (subscription && subscription.plan_id === Object.keys(PLANS).find(key => PLANS[key].id === plan.id) ? 'Current Plan' : 'Upgrade')}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
