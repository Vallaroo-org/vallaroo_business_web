'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useBusiness } from '@/hooks/use-business';
import { Product, Customer, Service } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Trash2, ShoppingCart, User, Save, Loader2, ArrowLeft, Minus, CreditCard, Tag, X } from 'lucide-react';
import Link from 'next/link';
import AddCustomerDialog from '@/components/pos/add-customer-dialog';
import BillSuccessDialog from '@/components/pos/bill-success-dialog';
import { toast } from 'sonner';

interface CartItem {
    product_id?: string;
    service_id?: string;
    product?: Product;
    service?: Service;
    quantity: number;
    price: number;
    name_ml?: string;
}

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function NewBillContent() {
    const router = useRouter();
    const { selectedBusiness, selectedShop, isLoading: contextLoading } = useBusiness();
    const supabase = createClient();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    // Data State
    // Data State
    const [products, setProducts] = useState<Product[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);

    // Selection State
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [itemSearch, setItemSearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');

    // Derived State for Categories
    const categories = ['all', ...Array.from(new Set(products.map(p => p.category_id).filter(Boolean)))];

    // Submission State
    const [submitting, setSubmitting] = useState(false);
    const [loadingBill, setLoadingBill] = useState(false);
    const [mobileCartOpen, setMobileCartOpen] = useState(false);

    useEffect(() => {
        if (!contextLoading && selectedBusiness && selectedShop) {
            fetchInitialData();
        }
    }, [contextLoading, selectedBusiness, selectedShop]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch existing bill if in edit mode
    useEffect(() => {
        if (editId && selectedShop && products.length > 0) {
            fetchBillToEdit(editId);
        }
    }, [editId, selectedShop, products]); // eslint-disable-line react-hooks/exhaustive-deps


    const fetchBillToEdit = async (id: string) => {
        try {
            setLoadingBill(true);
            const { data: bill, error } = await supabase
                .from('bills')
                .select('*, items:bill_items(*)')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!bill) return;

            // Populate state
            if (bill.customer_name && bill.customer_name !== 'Walking Customer') {
                // Try to find existing customer object or create temp one
                const existing = customers.find(c => c.name === bill.customer_name && c.phone_number === bill.customer_phone);
                if (existing) {
                    setSelectedCustomer(existing);
                } else {
                    setSelectedCustomer({
                        id: 'temp',
                        name: bill.customer_name,
                        phone_number: bill.customer_phone,
                        business_id: bill.business_id
                    } as Customer);
                }
            }

            setDiscount(bill.discount || 0);
            setPaymentStatus(bill.payment_status || 'unpaid');
            setPaidAmount(bill.paid_amount?.toString() || '0');

            // Populate cart
            // Need full product details. Map from loaded products.
            const recreatedCart: CartItem[] = bill.items.map((item: any) => {
                if (item.product_id) {
                    const product = products.find(p => p.id === item.product_id);
                    if (product) {
                        return {
                            product_id: product.id,
                            product: product,
                            quantity: item.quantity,
                            price: item.price,
                            name_ml: item.name_ml
                        };
                    }
                } else if (item.service_id) {
                    const service = services.find(s => s.id === item.service_id);
                    if (service) {
                        return {
                            service_id: service.id,
                            service: service,
                            quantity: item.quantity,
                            price: item.price,
                            name_ml: item.name_ml
                        };
                    }
                }
                // Fallback for deleted products/services?
                return null;
            }).filter(Boolean);

            setCart(recreatedCart);

        } catch (error) {
            console.error('Error fetching bill to edit:', error);
            toast.error('Failed to load bill details');
        } finally {
            setLoadingBill(false);
        }
    };

    const fetchInitialData = async () => {
        try {
            setLoadingData(true);
            if (!selectedShop) return;

            // Fetch Products
            const { data: productsData } = await supabase
                .from('products')
                .select('*')
                .eq('shop_id', selectedShop.id)
                .order('name');

            setProducts(productsData || []);

            // Fetch Services
            const { data: servicesData } = await supabase
                .from('services')
                .select('*')
                .eq('shop_id', selectedShop.id)
                .eq('is_active', true)
                .order('name');

            setServices(servicesData || []);

            // Auto-select tab based on shop type
            if (selectedShop.shop_type === 'service') {
                setActiveTab('services');
            } else {
                setActiveTab('products');
            }

            // Fetch Customers
            const { data: customersData } = await supabase
                .from('customers')
                .select('*')
                .eq('business_id', selectedBusiness!.id)
                .order('name');

            setCustomers(customersData || []);

        } catch (error) {
            console.error('Error loading POS data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    // Cart Actions
    // Cart Actions
    const addToCart = (item: Product | Service, type: 'product' | 'service') => {
        setCart(prev => {
            const id = item.id;
            const existing = prev.find(i => (type === 'product' ? i.product_id === id : i.service_id === id));

            if (existing) {
                return prev.map(cartItem => {
                    const isMatch = type === 'product' ? cartItem.product_id === id : cartItem.service_id === id;
                    return isMatch
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem;
                });
            }

            const newItem: CartItem = {
                quantity: 1,
                price: item.price,
                name_ml: item.name_ml || undefined
            };

            if (type === 'product') {
                newItem.product_id = item.id;
                newItem.product = item as Product;
            } else {
                newItem.service_id = item.id;
                newItem.service = item as Service;
            }

            return [...prev, newItem];
        });
        setItemSearch('');
    };

    const removeFromCart = (id: string, type: 'product' | 'service') => {
        setCart(prev => prev.filter(item => {
            if (type === 'product') return item.product_id !== id;
            return item.service_id !== id;
        }));
    };

    const updateQuantity = (id: string, type: 'product' | 'service', delta: number) => {
        setCart(prev => prev.map(item => {
            const isMatch = type === 'product' ? item.product_id === id : item.service_id === id;
            if (isMatch) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Filtered Lists
    // Filtered Lists
    const filteredItems = activeTab === 'products'
        ? products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(itemSearch.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
            return matchesSearch && matchesCategory;
        })
        : services.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(itemSearch.toLowerCase());
            // Services category filtering logic if needed
            return matchesSearch;
        });

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone_number?.includes(customerSearch)
    );

    // Payment State
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial'>('unpaid');
    const [paidAmount, setPaidAmount] = useState<string>('');
    const [discount, setDiscount] = useState<number>(0);
    const [partialError, setPartialError] = useState<string | null>(null);

    const subTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalPayable = Math.max(0, subTotal - discount);

    // Update paid amount when status updates or total changes - ONLY if NOT editing or user changed status
    // Complex: If editing, we want to respect loaded values unless user changes things.
    // For simplicity: If totalPayable changes, providing smart defaults is good, but overwriting user input is bad.
    // Let's rely on manual user change for status, but auto-update 'Paid' amount if total changes.
    useEffect(() => {
        if (paymentStatus === 'paid') {
            setPaidAmount(totalPayable.toString());
        } else if (paymentStatus === 'unpaid') {
            setPaidAmount('0');
        }
    }, [paymentStatus, totalPayable]);

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }
        if (!selectedShop) return;

        setSubmitting(true);
        setPartialError(null);

        try {
            // Validate Partial Amount
            let finalPaidAmount = parseFloat(paidAmount);
            if (paymentStatus === 'partial') {
                if (isNaN(finalPaidAmount) || finalPaidAmount < 0 || finalPaidAmount > totalPayable) {
                    setPartialError('Please enter a valid partial amount (less than total)');
                    setSubmitting(false);
                    return;
                }
            } else if (paymentStatus === 'paid') {
                finalPaidAmount = totalPayable;
            } else {
                finalPaidAmount = 0;
            }

            const now = new Date();
            const billData = {
                business_id: selectedBusiness!.id,
                shop_id: selectedShop.id,
                customer_name: selectedCustomer?.name || 'Walking Customer',
                customer_phone: selectedCustomer?.phone_number,
                total: totalPayable,
                subtotal: subTotal,
                discount: discount,
                payment_status: paymentStatus,
                paid_amount: finalPaidAmount
            };

            let targetBillId = editId;

            if (editId) {
                // UPDATE
                const { error: updateError } = await supabase
                    .from('bills')
                    .update(billData)
                    .eq('id', editId);

                if (updateError) throw updateError;

                // Delete existing items
                const { error: deleteItemsError } = await supabase
                    .from('bill_items')
                    .delete()
                    .eq('bill_id', editId);

                if (deleteItemsError) throw deleteItemsError;

                // We do NOT creating initial transaction again for editing.
                // If the user wants to add payment, they should use Add Payment feature.
                // However, update the 'paid_amount' column is fine. 

            } else {
                // INSERT
                const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
                const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
                const billNumber = `${dateStr}-${timeStr}`;

                const { data: bill, error: billError } = await supabase
                    .from('bills')
                    .insert({
                        ...billData,
                        bill_number: billNumber,
                        issued_at: now.toISOString(),
                        items: cart, // Storing JSON snapshot too? The schema suggests 'items' column exists.
                    })
                    .select()
                    .single();

                if (billError) throw billError;
                targetBillId = bill.id;

                // 3. Create Transaction for Initial Payment (if any)
                if (finalPaidAmount > 0) {
                    const { error: transactionError } = await supabase
                        .from('bill_transactions')
                        .insert({
                            id: crypto.randomUUID(),
                            bill_id: targetBillId,
                            amount: finalPaidAmount,
                            payment_method: 'cash',
                            recorded_at: now.toISOString(),
                            note: 'Initial payment',
                            recorded_by: (await supabase.auth.getUser()).data.user?.id,
                            business_id: selectedBusiness!.id,
                            shop_id: selectedShop.id,
                        });

                    if (transactionError) throw transactionError;
                }
            }

            const billItems = cart.map(item => ({
                bill_id: targetBillId,
                business_id: selectedBusiness!.id,
                shop_id: selectedShop.id,
                product_id: item.product_id,
                service_id: item.service_id,
                name: item.product?.name || item.service?.name || '',
                name_ml: item.name_ml,
                quantity: item.quantity,
                price: item.price,
            }));

            const { error: itemsError } = await supabase
                .from('bill_items')
                .insert(billItems);

            if (itemsError) throw itemsError;

            toast.success(editId ? 'Bill updated successfully' : 'Bill created successfully');
            router.push(`/bill-history/${targetBillId}`);

        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Checkout failed details:', JSON.stringify(error, null, 2));
            toast.error('Checkout failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Color gradients for products without images
    const gradients = [
        'from-pink-500 to-rose-500',
        'from-purple-500 to-indigo-500',
        'from-blue-500 to-cyan-500',
        'from-emerald-500 to-teal-500',
        'from-orange-500 to-amber-500'
    ];

    const getGradient = (id: string) => {
        const index = id.charCodeAt(0) % gradients.length;
        return gradients[index];
    };

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-background">
            {/* Left Side: Product Catalog */}
            <div className="flex-1 flex flex-col min-w-0 pr-0 lg:pr-6">
                {/* Header & Search & Tabs */}
                <div className="mb-4 space-y-4 shrink-0 px-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href="/bill-history">
                                <Button variant="ghost" size="icon" className="hover:bg-muted/50">
                                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    {editId ? 'Edit Bill' : 'New Sale'}
                                    {loadingBill && <Loader2 className="ml-2 w-4 h-4 inline animate-spin" />}
                                </h1>
                                <p className="text-xs text-muted-foreground">{selectedShop?.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs for Hybrid Shops */}
                    {selectedShop?.shop_type === 'both' && (
                        <div className="flex p-1 bg-muted/50 rounded-xl">
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'products'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Products
                            </button>
                            <button
                                onClick={() => setActiveTab('services')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'services'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Services
                            </button>
                        </div>
                    )}

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        </div>
                        <Input
                            className="pl-10 pr-10 h-12 text-lg bg-card/50 backdrop-blur-sm border-border focus:ring-2 ring-primary/20 transition-all rounded-xl shadow-sm"
                            placeholder={`Search ${activeTab}...`}
                            value={itemSearch}
                            onChange={(e) => setItemSearch(e.target.value)}
                            autoFocus
                            maxLength={50}
                        />
                        {itemSearch && (
                            <button
                                type="button"
                                onClick={() => setItemSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Item Grid */}
                <div className="flex-1 overflow-y-auto px-1 pb-4 scrollbar-hide">
                    {loadingData ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground animate-pulse">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <p>Loading catalog...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Search className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-lg">No items found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => addToCart(item, activeTab === 'services' ? 'service' : 'product')}
                                    className="group relative flex flex-col overflow-hidden rounded-2xl bg-card border border-border/50 hover:border-primary/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-left h-48 sm:h-56"
                                >
                                    {/* Image / Gradient Area */}
                                    <div className={`h-2/3 w-full bg-gradient-to-br ${getGradient(item.id)} p-4 flex items-start justify-end p-2 relative`}>
                                        <div className="absolute top-2 right-2 bg-black/20 backdrop-blur-md px-2 py-1 rounded-lg text-white text-xs font-bold">
                                            {formatCurrency(item.price)}
                                        </div>
                                        <div className="mt-auto w-full">
                                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                                                <Plus className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-3 flex-1 flex flex-col justify-between bg-card">
                                        <div>
                                            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{item.name}</h3>
                                            {item.name_ml && <p className="text-xs text-muted-foreground font-ml">{item.name_ml}</p>}
                                        </div>
                                        <div className="flex items-center gap-1 mt-2">
                                            <Tag className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground capitalize">
                                                {activeTab === 'services' ? 'Service' : 'Item'}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Cart Panel */}
            <div className="hidden lg:flex flex-col w-[380px] shrink-0 bg-card rounded-2xl border border-border shadow-xl overflow-hidden ml-4">
                {/* Cart Header */}
                <div className="p-5 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-foreground font-semibold">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <ShoppingCart className="w-5 h-5" />
                            </div>
                            <span>Current Order</span>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            {cart.length} items
                        </span>
                    </div>

                    {/* Customer Selection */}
                    <div className="relative z-10">
                        {selectedCustomer ? (
                            <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-primary/20 shadow-sm group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {selectedCustomer.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{selectedCustomer.name}</p>
                                        <p className="text-xs text-muted-foreground">{selectedCustomer.phone_number}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedCustomer(null)}
                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="relative group">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    className="pl-9 bg-background border-border focus:ring-1 focus:ring-primary rounded-xl"
                                    placeholder="Add Customer..."
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                />
                                {customerSearch && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-black border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 p-1">
                                        {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                                            <button
                                                key={c.id}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-lg text-foreground flex items-center justify-between group/item"
                                                onClick={() => {
                                                    setSelectedCustomer(c);
                                                    setCustomerSearch('');
                                                }}
                                            >
                                                <span>{c.name}</span>
                                                <span className="text-xs text-muted-foreground group-hover/item:text-primary">{c.phone_number}</span>
                                            </button>
                                        )) : (
                                            <div className="p-3 text-xs text-center text-muted-foreground">No customers found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-60">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                                <ShoppingCart className="w-10 h-10" />
                            </div>
                            <p className="text-sm">Start adding items to cart</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {cart.map((item) => {
                                const isProduct = !!item.product_id;
                                const id = item.product_id || item.service_id!;
                                const type = isProduct ? 'product' : 'service';
                                const name = item.product?.name || item.service?.name || 'Unknown Item';

                                return (
                                    <div key={id} className="p-3 flex items-center gap-3 bg-background hover:bg-muted/30 rounded-xl border border-transparent hover:border-border transition-all group">
                                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getGradient(id)} shrink-0`} />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm font-medium line-clamp-1">{name}</span>
                                                <span className="text-sm font-bold ml-2">{formatCurrency(item.price * item.quantity)}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs text-muted-foreground">{formatCurrency(item.price)} x {item.quantity}</span>

                                                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-0.5">
                                                    <button
                                                        onClick={() => updateQuantity(id, type, -1)}
                                                        disabled={item.quantity <= 1}
                                                        className="p-1 hover:bg-background rounded-md text-muted-foreground disabled:opacity-30 transition-shadow hover:shadow-sm"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateQuantity(id, type, 1)}
                                                        className="p-1 hover:bg-background rounded-md text-foreground transition-shadow hover:shadow-sm"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(id, type)}
                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Cart Footer */}
                <div className="p-5 bg-card border-t border-border space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>Discount</span>
                            <div className="w-24">
                                <Input
                                    type="number"
                                    value={discount || ''}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setDiscount(isNaN(val) ? 0 : val);
                                    }}
                                    className="h-8 text-right bg-background"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Payment Status Selection */}
                        <div className="pt-2 border-t border-border space-y-3">
                            <span className="text-sm font-medium">Payment Status</span>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => setPaymentStatus('paid')}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${paymentStatus === 'paid'
                                        ? 'bg-[#16a34a] text-white border-[#16a34a] font-medium'
                                        : 'bg-background hover:bg-muted border-border'
                                        }`}
                                >
                                    Paid
                                </button>
                                <button
                                    onClick={() => setPaymentStatus('unpaid')}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${paymentStatus === 'unpaid'
                                        ? 'bg-[#dc2626] text-white border-[#dc2626] font-medium'
                                        : 'bg-background hover:bg-muted border-border'
                                        }`}
                                >
                                    Unpaid
                                </button>
                                <button
                                    onClick={() => setPaymentStatus('partial')}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${paymentStatus === 'partial'
                                        ? 'bg-[#ca8a04] text-white border-[#ca8a04] font-medium'
                                        : 'bg-background hover:bg-muted border-border'
                                        }`}
                                >
                                    Partial
                                </button>
                            </div>

                            {paymentStatus === 'partial' && (
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Amount Paid</label>
                                    <Input
                                        type="number"
                                        value={paidAmount}
                                        onChange={(e) => {
                                            setPaidAmount(e.target.value);
                                            if (partialError) setPartialError(null);
                                        }}
                                        placeholder="Enter amount paid"
                                        className={`h-9 ${partialError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                    />
                                    {partialError && <p className="text-xs text-red-500">{partialError}</p>}
                                </div>
                            )}
                        </div>

                        <div className="pt-2 border-t border-border flex justify-between items-end">
                            <span className="text-base font-semibold">Total Payable</span>
                            <span className="text-2xl font-bold text-primary">{formatCurrency(totalPayable)}</span>
                        </div>
                    </div>

                    <Button
                        className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl"
                        size="lg"
                        disabled={cart.length === 0 || submitting}
                        onClick={handleCheckout}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5 mr-2" />
                                {editId ? 'Update Bill' : 'Please Checkout'}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile Cart Floating Action Button */}
            {cart.length > 0 && (
                <div className="lg:hidden fixed bottom-6 right-6 z-40">
                    <Button
                        size="lg"
                        className="rounded-full h-14 w-14 shadow-2xl shadow-primary/40 p-0 flex items-center justify-center relative"
                        onClick={() => setMobileCartOpen(true)}
                    >
                        <ShoppingCaret className="w-6 h-6" />
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center border-2 border-background">
                            {cart.length}
                        </span>
                    </Button>
                </div>
            )}

            {/* Mobile Cart Panel (Slide Up) */}
            {mobileCartOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setMobileCartOpen(false)}
                    />

                    {/* Cart Panel */}
                    <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
                        {/* Handle & Header */}
                        <div className="p-4 border-b border-border">
                            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-3" />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-foreground font-semibold">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <ShoppingCart className="w-5 h-5" />
                                    </div>
                                    <span>Your Cart</span>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                        {cart.length} items
                                    </span>
                                </div>
                                <button
                                    onClick={() => setMobileCartOpen(false)}
                                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Customer Selection (Mobile) */}
                        <div className="px-4 py-3 border-b border-border">
                            {selectedCustomer ? (
                                <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-primary/20">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {selectedCustomer.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{selectedCustomer.name}</p>
                                            <p className="text-xs text-muted-foreground">{selectedCustomer.phone_number}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedCustomer(null)}
                                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9 bg-background border-border rounded-xl"
                                        placeholder="Add Customer..."
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                    />
                                    {customerSearch && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl max-h-40 overflow-y-auto z-50 p-1">
                                            {filteredCustomers.length > 0 ? filteredCustomers.slice(0, 5).map(c => (
                                                <button
                                                    key={c.id}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-lg text-foreground flex items-center justify-between"
                                                    onClick={() => {
                                                        setSelectedCustomer(c);
                                                        setCustomerSearch('');
                                                    }}
                                                >
                                                    <span>{c.name}</span>
                                                    <span className="text-xs text-muted-foreground">{c.phone_number}</span>
                                                </button>
                                            )) : (
                                                <div className="p-3 text-xs text-center text-muted-foreground">No customers found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Cart Items (Mobile) */}
                        <div className="flex-1 overflow-y-auto p-4 min-h-0" style={{ maxHeight: '35vh' }}>
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                                    <ShoppingCart className="w-12 h-12 mb-2" />
                                    <p className="text-sm">Your cart is empty</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {cart.map((item) => {
                                        const isProduct = !!item.product_id;
                                        const id = item.product_id || item.service_id!;
                                        const type = isProduct ? 'product' : 'service';
                                        const name = item.product?.name || item.service?.name || 'Unknown Item';

                                        return (
                                            <div key={id} className="p-3 flex items-center gap-3 bg-background rounded-xl border border-border">
                                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getGradient(id)} shrink-0`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-sm font-medium line-clamp-1">{name}</span>
                                                        <span className="text-sm font-bold ml-2">{formatCurrency(item.price * item.quantity)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="text-xs text-muted-foreground">{formatCurrency(item.price)} x {item.quantity}</span>
                                                        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
                                                            <button
                                                                onClick={() => updateQuantity(id, type, -1)}
                                                                disabled={item.quantity <= 1}
                                                                className="p-1.5 hover:bg-background rounded-md text-muted-foreground disabled:opacity-30"
                                                            >
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(id, type, 1)}
                                                                className="p-1.5 hover:bg-background rounded-md text-foreground"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(id, type)}
                                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Cart Footer (Mobile) */}
                        <div className="p-4 bg-card border-t border-border space-y-3">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subTotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>Discount</span>
                                <div className="w-20">
                                    <Input
                                        type="number"
                                        value={discount || ''}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setDiscount(isNaN(val) ? 0 : val);
                                        }}
                                        className="h-8 text-right bg-background"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Payment Status (Mobile) */}
                            <div className="pt-2 border-t border-border space-y-2">
                                <span className="text-sm font-medium">Payment Status</span>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setPaymentStatus('paid')}
                                        className={`px-2 py-2 text-sm rounded-lg border transition-all ${paymentStatus === 'paid'
                                            ? 'bg-[#16a34a] text-white border-[#16a34a] font-medium'
                                            : 'bg-background hover:bg-muted border-border'
                                            }`}
                                    >
                                        Paid
                                    </button>
                                    <button
                                        onClick={() => setPaymentStatus('unpaid')}
                                        className={`px-2 py-2 text-sm rounded-lg border transition-all ${paymentStatus === 'unpaid'
                                            ? 'bg-[#dc2626] text-white border-[#dc2626] font-medium'
                                            : 'bg-background hover:bg-muted border-border'
                                            }`}
                                    >
                                        Unpaid
                                    </button>
                                    <button
                                        onClick={() => setPaymentStatus('partial')}
                                        className={`px-2 py-2 text-sm rounded-lg border transition-all ${paymentStatus === 'partial'
                                            ? 'bg-[#ca8a04] text-white border-[#ca8a04] font-medium'
                                            : 'bg-background hover:bg-muted border-border'
                                            }`}
                                    >
                                        Partial
                                    </button>
                                </div>

                                {paymentStatus === 'partial' && (
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Amount Paid</label>
                                        <Input
                                            type="number"
                                            value={paidAmount}
                                            onChange={(e) => {
                                                setPaidAmount(e.target.value);
                                                if (partialError) setPartialError(null);
                                            }}
                                            placeholder="Enter amount paid"
                                            className={`h-9 ${partialError ? 'border-red-500' : ''}`}
                                        />
                                        {partialError && <p className="text-xs text-red-500">{partialError}</p>}
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 border-t border-border flex justify-between items-end">
                                <span className="text-base font-semibold">Total</span>
                                <span className="text-xl font-bold text-primary">{formatCurrency(totalPayable)}</span>
                            </div>

                            <Button
                                className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 rounded-xl"
                                size="lg"
                                disabled={cart.length === 0 || submitting}
                                onClick={() => {
                                    handleCheckout();
                                    setMobileCartOpen(false);
                                }}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-5 h-5 mr-2" />
                                        {editId ? 'Update Bill' : 'Checkout'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function NewBillPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        }>
            <NewBillContent />
        </Suspense>
    );
}

// Helper icon component for correct imports
const ShoppingCaret = ShoppingCart;
