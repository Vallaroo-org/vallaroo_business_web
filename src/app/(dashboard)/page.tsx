'use client';

import { useLanguage } from '@/contexts/language-context';
import { useBusiness } from '@/components/providers/business-provider';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { Order } from '@/lib/types';
import { StoriesWidget } from '@/components/dashboard/stories-widget';

export default function DashboardPage() {
    const { t } = useLanguage();
    const { selectedBusiness, selectedShop } = useBusiness();
    const supabase = createClient();

    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        customers: 0,
        products: 0,
    });
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedBusiness) return;

        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Stats
                // Revenue & Orders
                let ordersQuery = supabase
                    .from('bills')
                    .select('total', { count: 'exact' })
                    .eq('business_id', selectedBusiness.id);

                if (selectedShop) {
                    ordersQuery = ordersQuery.eq('shop_id', selectedShop.id);
                }

                const { data: ordersData, count: ordersCount, error: ordersError } = await ordersQuery;
                if (ordersError) {
                    console.error('Orders fetch error:', ordersError);
                    throw ordersError;
                }

                const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

                // Customers (Business level usually, but can be filtered if schema supports)
                const customersQuery = supabase
                    .from('customers')
                    .select('*', { count: 'exact', head: true })
                    .eq('business_id', selectedBusiness.id);
                // Customers might be shared across shops, usually business wide.

                const { count: customersCount, error: customersError } = await customersQuery;
                if (customersError) {
                    console.error('Customers fetch error:', customersError);
                    throw customersError;
                }

                // Products (Business level or Shop level depending on inventory?)
                // Assuming products are business level for now based on types, unless filtered by shop inventory (which might correspond to products table directly or stock table).
                // Let's assume products table has business_id.
                const productsQuery = supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('business_id', selectedBusiness.id);

                const { count: productsCount, error: productsError } = await productsQuery;
                if (productsError) {
                    console.error('Products fetch error:', productsError);
                    throw productsError;
                }


                setStats({
                    revenue: totalRevenue,
                    orders: ordersCount || 0,
                    customers: customersCount || 0,
                    products: productsCount || 0,
                });

                // 2. Fetch Recent Activity
                let activityQuery = supabase
                    .from('bills')
                    .select('*')
                    .eq('business_id', selectedBusiness.id)
                    .order('issued_at', { ascending: false })
                    .limit(5);

                if (selectedShop) {
                    activityQuery = activityQuery.eq('shop_id', selectedShop.id);
                }

                const { data: activityData, error: activityError } = await activityQuery;
                if (activityError) throw activityError;

                setRecentOrders(activityData || []);

            } catch (error) {
                console.error('Error fetching dashboard data:', JSON.stringify(error, null, 2));
                // Also log specificity if available
                if (typeof error === 'object' && error !== null && 'message' in error) {
                    console.error('Error message:', (error as { message: string }).message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [selectedBusiness, selectedShop]);

    if (!selectedBusiness) {
        return <div className="p-8 text-center text-muted-foreground">Select a business to view statistics.</div>;
    }

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-foreground">
                    {t('dashboard')}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Overview for {selectedShop ? selectedShop.name : selectedBusiness.name}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'total_revenue', value: `₹${stats.revenue.toFixed(2)}`, change: null }, // TODO: Implement currency formatter
                    { label: 'orders', value: stats.orders, change: null },
                    { label: 'customers', value: stats.customers, change: null },
                    { label: 'products', value: stats.products, change: null },
                ].map((stat, i) => (
                    <div key={i} className="bg-card border border-border overflow-hidden shadow-sm rounded-lg px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-muted-foreground truncate">{t(stat.label)}</dt>
                        <dd className="mt-1 text-3xl font-semibold text-foreground">{stat.value}</dd>
                        {/* 
                        <div className="mt-1 flex items-baseline md:block lg:flex">
                            <span className="text-green-600 dark:text-green-400 font-semibold text-sm">{stat.change}</span>
                            <span className="ml-2 text-sm text-muted-foreground">{t('from_last_month')}</span>
                        </div>
                        */}
                    </div>
                ))}
            </div>

            {selectedShop && (
                <StoriesWidget
                    shopId={selectedShop.id}
                    subscriptionPlan={selectedShop.subscription_plan ?? 'free'}
                />
            )}

            <div className="bg-card border border-border shadow-sm rounded-lg p-6">
                <h3 className="text-lg font-medium leading-6 text-foreground">{t('recent_orders')}</h3>
                <div className="mt-4 border-t border-border">
                    {recentOrders.length > 0 ? (
                        <div className="divide-y divide-border">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="py-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Order #{order.bill_number}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(order.issued_at || new Date()).toLocaleDateString()} • {order.customer_name || 'Walk-in Customer'}
                                        </p>
                                    </div>
                                    <div className="text-sm font-semibold text-foreground">
                                        ₹{order.total.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">
                            {t('no_recent_activity')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
