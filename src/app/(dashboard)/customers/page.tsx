'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Customer } from '@/lib/types';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

import { useBusiness } from '@/hooks/use-business';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: 'asc' | 'desc' } | null>(null);
    const supabase = createClient();
    const { selectedBusiness, isLoading: contextLoading } = useBusiness();

    useEffect(() => {
        if (!contextLoading && selectedBusiness) {
            fetchCustomers();
        }
    }, [contextLoading, selectedBusiness]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchCustomers = async () => {
        try {
            setDataLoading(true);
            if (!selectedBusiness) return;

            const { data: custs, error } = await supabase
                .from('customers')
                .select('*')
                .eq('business_id', selectedBusiness.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCustomers(custs || []);

        } catch (error) {
            console.error('Error loading customers:', JSON.stringify(error, null, 2));
        } finally {
            setDataLoading(false);
        }
    };

    const handleSort = (key: keyof Customer) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const isLoading = contextLoading || dataLoading;

    const filteredCustomers = customers.filter(customer => {
        const searchLower = searchTerm.toLowerCase();
        return customer.name.toLowerCase().includes(searchLower) ||
            (customer.phone_number?.includes(searchLower) || false);
    }).sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        const aValue = a[key] ?? '';
        const bValue = b[key] ?? '';

        if (aValue < bValue) {
            return direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const SortIcon = ({ column }: { column: keyof Customer }) => {
        if (sortConfig?.key !== column) return <div className="w-4 h-4 ml-1 inline-block" />; // spacer
        return sortConfig.direction === 'asc'
            ? <span className="ml-1 inline-block">↑</span> // Simple arrow for now, or lucide icon
            : <span className="ml-1 inline-block">↓</span>;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold text-foreground">Customers</h1>
                <Button asChild>
                    <Link href="/customers/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Customer
                    </Link>
                </Button>
            </div>

            <Card className="border-border bg-card">
                <div className="p-4 border-b border-border">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-8 bg-background border-input text-foreground"
                            placeholder="Search by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <CardContent className="p-0 bg-card">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading customers...</div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="p-12 text-center">
                            <h3 className="text-sm font-semibold text-foreground">No customers found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Get started by adding a new customer.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                                            onClick={() => handleSort('name')}
                                        >
                                            Name <SortIcon column="name" />
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                                            onClick={() => handleSort('phone_number')}
                                        >
                                            Phone <SortIcon column="phone_number" />
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
                                            onClick={() => handleSort('address')}
                                        >
                                            Address <SortIcon column="address" />
                                        </th>
                                        <th scope="col" className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {filteredCustomers.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-foreground">{customer.name}</div>
                                                {customer.name_ml && <div className="text-xs text-muted-foreground">{customer.name_ml}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{customer.phone_number || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground truncate max-w-xs">{customer.address || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link href={`/customers/${customer.id}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">
                                                    View
                                                </Link>
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
