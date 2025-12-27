'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBusiness } from '@/hooks/use-business';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingBag, CreditCard, Calendar, LucideIcon, Download, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PAYMENT_STATUS_OPTIONS, SORT_OPTIONS, DATE_RANGES } from './constants';
import { format } from 'date-fns';

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

    // Filters
    const [dateRange, setDateRange] = useState('this_month');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [paymentStatus, setPaymentStatus] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    // Initialize dates on mount
    useEffect(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const endOfToday = now.toISOString().split('T')[0];
        setStartDate(startOfMonth);
        setEndDate(endOfToday);
    }, []);

    useEffect(() => {
        if (!contextLoading && selectedBusiness && startDate && endDate) {
            fetchStats();
        }
    }, [contextLoading, selectedBusiness, selectedShop, startDate, endDate, paymentStatus, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchStats = async () => {
        try {
            setLoading(true);
            if (!selectedBusiness) return;

            if (!startDate || !endDate) return;

            let query = supabase.from('bills')
                .select('id, total, created_at, bill_number, customer_name, payment_status, payment_method')
                .eq('business_id', selectedBusiness.id)
                .gte('created_at', new Date(startDate).toISOString())
                .lte('created_at', new Date(endDate + 'T23:59:59').toISOString());

            if (selectedShop) {
                query = query.eq('shop_id', selectedShop.id);
            }

            if (paymentStatus !== 'all') {
                query = query.eq('payment_status', paymentStatus);
            }

            // Apply Sort
            switch (sortBy) {
                case 'newest':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'oldest':
                    query = query.order('created_at', { ascending: true });
                    break;
                case 'amount_desc':
                    query = query.order('total', { ascending: false });
                    break;
                case 'amount_asc':
                    query = query.order('total', { ascending: true });
                    break;
                default:
                    query = query.order('created_at', { ascending: false });
            }

            const { data, error } = await query;

            if (error) throw error;

            const bills = data || [];

            // Calculate Period Stats
            // (We fetched only filtered bills, so sum is total for period)
            const periodTotal = bills.reduce((acc, curr) => acc + (curr.total || 0), 0);



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

            setTodaySales(0); // Deprecated use
            setMonthSales(periodTotal); // Using monthSales state for "Period Total" to avoid widespread refactor
            setOrderCount(bills.length);
            setRecentBills(bills.slice(0, 50)); // Show more in table
            setTopProductsList(topProducts);
            setTopCustomersList(topCustomers);

        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateRangeChange = (value: string) => {
        setDateRange(value);
        const now = new Date();
        let start = new Date();
        const end = new Date();

        switch (value) {
            case 'today':
                // start is today
                break;
            case 'yesterday':
                start.setDate(now.getDate() - 1);
                end.setDate(now.getDate() - 1);
                break;
            case 'this_week':
                start.setDate(now.getDate() - now.getDay()); // Sunday
                break;
            case 'last_7_days':
                start.setDate(now.getDate() - 7);
                break;
            case 'this_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last_30_days':
                start.setDate(now.getDate() - 30);
                break;
            case 'custom':
                return; // Don't change dates, user will pick
        }

        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const handleExportCSV = () => {
        if (!recentBills.length) return;

        const headers = ['Bill Number', 'Date', 'Customer', 'Amount', 'Status', 'Payment Method'];
        const csvContent = [
            headers.join(','),
            ...recentBills.map(bill => [
                bill.bill_number,
                new Date(bill.created_at).toLocaleDateString(),
                `"${bill.customer_name || ''}"`,
                bill.total,
                bill.payment_status || '-',
                bill.payment_method || '-'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sales_report_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        if (!recentBills.length) return;

        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text('Sales Report', 14, 22);

        doc.setFontSize(10);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 30);
        if (selectedBusiness) doc.text(`Business: ${selectedBusiness.name}`, 14, 35);

        // Summary
        doc.text(`Total Sales: ${formatCurrency(monthSales)}`, 14, 45); // Note: monthSales var name is reused for "Filtered Total" in UI logic? need to check
        doc.text(`Total Orders: ${recentBills.length}`, 80, 45);

        const tableColumn = ["Bill #", "Date", "Customer", "Amount", "Status"];
        const tableRows = recentBills.map(bill => [
            bill.bill_number,
            new Date(bill.created_at).toLocaleDateString(),
            bill.customer_name || '-',
            formatCurrency(bill.total),
            bill.payment_status || '-'
        ]);

        autoTable(doc, {
            head: [tableColumn],

            body: tableRows,
            startY: 50,
        });

        doc.save(`sales_report_${startDate}_to_${endDate}.pdf`);
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
            label: 'Total Sales',
            value: formatCurrency(monthSales), // Reusing monthSales as "Total Filtered Sales"
            subLabel: `In selected period`,
            icon: TrendingUp,
            color: 'text-green-600 bg-green-50'
        },
        {
            label: 'Orders',
            value: orderCount.toString(),
            subLabel: 'Total orders in period',
            icon: Calendar,
            color: 'text-blue-600 bg-blue-50'
        },
        {
            label: 'Avg. Order Value',
            value: orderCount > 0 ? formatCurrency(monthSales / orderCount) : '₹0',
            subLabel: 'Based on selection',
            icon: CreditCard,
            color: 'text-purple-600 bg-purple-50'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={handleExportCSV} className="flex-1 sm:flex-none">
                        <Download className="w-4 h-4 mr-1 sm:mr-2" />
                        CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF} className="flex-1 sm:flex-none">
                        <Download className="w-4 h-4 mr-1 sm:mr-2" />
                        PDF
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <Card className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                    <div className="w-full sm:w-auto sm:min-w-[150px]">
                        <Select value={dateRange} onValueChange={handleDateRangeChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Date Range" />
                            </SelectTrigger>
                            <SelectContent>
                                {DATE_RANGES.map(range => (
                                    <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="flex-1 sm:w-auto text-sm"
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="flex-1 sm:w-auto text-sm"
                            />
                        </div>
                    )}

                    <div className="w-full sm:w-auto sm:min-w-[130px]">
                        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Payment Status" />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_STATUS_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full sm:w-auto sm:min-w-[150px]">
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

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
