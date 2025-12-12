'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBusiness } from '@/hooks/use-business';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingBag, CreditCard, Calendar, LucideIcon } from 'lucide-react';

interface DashboardMetric {
    label: string;
    value: string;
    subLabel: string;
    icon: LucideIcon;
    color: string;
}

interface TopProduct {
    name: string;
    quantity: number;
    revenue: number;
}

interface TopCustomer {
    name: string;
    revenue: number;
    visits: number;
}

export default function ReportsPage() {
    const { selectedBusiness, selectedShop, isLoading: contextLoading } = useBusiness();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [todaySales, setTodaySales] = useState(0);
    const [monthSales, setMonthSales] = useState(0);
    const [orderCount, setOrderCount] = useState(0);
    const [recentBills, setRecentBills] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [topProductsList, setTopProductsList] = useState<TopProduct[]>([]);
    const [topCustomersList, setTopCustomersList] = useState<TopCustomer[]>([]);

    useEffect(() => {
        if (!contextLoading && selectedBusiness) {
            fetchStats();
        }
    }, [contextLoading, selectedBusiness, selectedShop]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchStats = async () => {
        try {
            setLoading(true);
            if (!selectedBusiness) return;

            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            let query = supabase.from('bills').select('id, total, created_at, bill_number, customer_name').eq('business_id', selectedBusiness.id);

            if (selectedShop) {
                query = query.eq('shop_id', selectedShop.id);
            }

            // Note: In a real app with massive data, we should use aggregate functions or RPCs.
            // For now, fetching recent records is fine for MVP.
            // Let's fetch last 1000 records to calculate stats client side or use count if available.
            // Actually, let's just fetch for the month to be safe on data usage.

            query = query.gte('created_at', startOfMonth).order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;

            const bills = data || [];

            // Calculate Today's Stats
            const todayBills = bills.filter(b => b.created_at >= startOfDay);
            const todayTotal = todayBills.reduce((acc, curr) => acc + (curr.total || 0), 0);

            // Calculate Month Stats
            const monthTotal = bills.reduce((acc, curr) => acc + (curr.total || 0), 0);

            // Fetch Bill Items for detailed analysis (Top Products)
            // We need bill IDs from the bills we just fetched
            const billIds = bills.map((b: any) => b.id); // eslint-disable-line @typescript-eslint/no-explicit-any
            let topProducts: TopProduct[] = [];

            if (billIds.length > 0) {
                const { data: billItems } = await supabase
                    .from('bill_items')
                    .select('product_id, name, quantity, price, total_price') // Assuming total_price exists, else calc
                    .in('bill_id', billIds);

                if (billItems) {
                    // Aggregate Products
                    const productMap = new Map<string, TopProduct>();

                    billItems.forEach((item: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                        const existing = productMap.get(item.product_id) || { name: item.name, quantity: 0, revenue: 0 };
                        // Handle potential missing total_price by calc
                        const itemRevenue = item.total_price || (item.price * item.quantity);
                        productMap.set(item.product_id, {
                            name: item.name,
                            quantity: existing.quantity + item.quantity,
                            revenue: existing.revenue + itemRevenue
                        });
                    });

                    topProducts = Array.from(productMap.values())
                        .sort((a, b) => b.quantity - a.quantity)
                        .slice(0, 5);
                }
            }

            // Aggregate Top Customers (by revenue)
            const customerMap = new Map<string, TopCustomer>();
            bills.forEach((bill: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                if (bill.customer_name) {
                    const existing = customerMap.get(bill.customer_name) || { name: bill.customer_name, revenue: 0, visits: 0 };
                    customerMap.set(bill.customer_name, {
                        name: bill.customer_name,
                        revenue: existing.revenue + bill.total,
                        visits: existing.visits + 1
                    });
                }
            });
            const topCustomers = Array.from(customerMap.values())
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            setTodaySales(todayTotal);
            setMonthSales(monthTotal);
            setOrderCount(todayBills.length);
            setRecentBills(bills.slice(0, 5));
            setTopProductsList(topProducts);
            setTopCustomersList(topCustomers);

        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const metrics: DashboardMetric[] = [
        {
            label: 'Today\'s Sales',
            value: formatCurrency(todaySales),
            subLabel: `${orderCount} orders today`,
            icon: TrendingUp,
            color: 'text-green-600 bg-green-50'
        },
        {
            label: 'Month to Date',
            value: formatCurrency(monthSales),
            subLabel: 'Total revenue this month',
            icon: Calendar,
            color: 'text-blue-600 bg-blue-50'
        },
        {
            label: 'Avg. Order Value',
            value: orderCount > 0 ? formatCurrency(todaySales / orderCount) : '₹0',
            subLabel: 'For today',
            icon: CreditCard,
            color: 'text-purple-600 bg-purple-50'
        }
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {metrics.map((metric) => (
                    <Card key={metric.label}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                                <p className="text-2xl font-bold text-foreground mt-1">
                                    {loading ? '...' : metric.value}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">{metric.subLabel}</p>
                            </div>
                            <div className={`p-3 rounded-full ${metric.color}`}>
                                <metric.icon className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Top Selling Products
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading...</div>
                        ) : topProductsList.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No product data.</div>
                        ) : (
                            <div className="space-y-4">
                                {topProductsList.map((product, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">{product.quantity} sold</p>
                                        </div>
                                        <div className="text-sm font-semibold text-foreground">
                                            {formatCurrency(product.revenue)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Customers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                            Top Customers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading...</div>
                        ) : topCustomersList.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No customer data.</div>
                        ) : (
                            <div className="space-y-4">
                                {topCustomersList.map((customer, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{customer.name}</p>
                                            <p className="text-xs text-muted-foreground">{customer.visits} visits</p>
                                        </div>
                                        <div className="text-sm font-semibold text-foreground">
                                            {formatCurrency(customer.revenue)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Sales Table */}
            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading data...</div>
                    ) : recentBills.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No sales data available for this month.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Bill #</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {recentBills.map((bill) => (
                                        <tr key={bill.bill_number} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                                                {bill.bill_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {bill.customer_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {new Date(bill.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground text-right">
                                                {formatCurrency(bill.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
