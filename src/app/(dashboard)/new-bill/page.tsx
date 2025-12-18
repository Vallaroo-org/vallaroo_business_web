'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useBusiness } from '@/hooks/use-business';
import { Product, Customer } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Trash2, ShoppingCart, User, Save, Loader2, ArrowLeft, Minus, CreditCard, Tag, X } from 'lucide-react';
import Link from 'next/link';
import AddCustomerDialog from '@/components/pos/add-customer-dialog';
import BillSuccessDialog from '@/components/pos/bill-success-dialog';

interface CartItem {
    product_id: string;
    product: Product;
    quantity: number;
    price: number;
    name_ml?: string;
}

export default function NewBillPage() {
    const router = useRouter();
    const { selectedBusiness, selectedShop, isLoading: contextLoading } = useBusiness();
    const supabase = createClient();

    // Data State
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);

    // Selection State
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [productSearch, setProductSearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Derived State for Categories
    const categories = ['all', ...Array.from(new Set(products.map(p => p.category_id).filter(Boolean)))];

    // Submission State
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!contextLoading && selectedBusiness && selectedShop) {
            fetchInitialData();
        }
    }, [contextLoading, selectedBusiness, selectedShop]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product_id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product_id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, {
                product_id: product.id,
                product,
                quantity: 1,
                price: product.price,
                name_ml: product.name_ml || undefined
            }];
        });
        setProductSearch('');
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product_id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product_id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Filtered Lists
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone_number?.includes(customerSearch)
    );

    // Payment State
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial'>('unpaid');
    const [paidAmount, setPaidAmount] = useState<string>('');
    const [discount, setDiscount] = useState<number>(0);

    const subTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalPayable = Math.max(0, subTotal - discount);

    // Update paid amount when status updates or total changes
    useEffect(() => {
        if (paymentStatus === 'paid') {
            setPaidAmount(totalPayable.toString());
        } else if (paymentStatus === 'unpaid') {
            setPaidAmount('0');
        }
    }, [paymentStatus, totalPayable]);

    const handleCheckout = async () => {
        if (cart.length === 0) return alert('Cart is empty');
        if (!selectedShop) return;

        setSubmitting(true);
        try {
            // Validate Partial Amount
            let finalPaidAmount = parseFloat(paidAmount);
            if (paymentStatus === 'partial') {
                if (isNaN(finalPaidAmount) || finalPaidAmount < 0 || finalPaidAmount > totalPayable) {
                    alert('Please enter a valid partial amount (less than total)');
                    setSubmitting(false);
                    return;
                }
            } else if (paymentStatus === 'paid') {
                finalPaidAmount = totalPayable;
            } else {
                finalPaidAmount = 0;
            }

            // 1. Create Bill
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
            const billNumber = `${dateStr}-${timeStr}`;

            const { data: bill, error: billError } = await supabase
                .from('bills')
                .insert({
                    business_id: selectedBusiness!.id,
                    shop_id: selectedShop.id,
                    bill_number: billNumber,
                    customer_name: selectedCustomer?.name || 'Walking Customer',
                    customer_phone: selectedCustomer?.phone_number,
                    items: cart,
                    total: totalPayable,
                    subtotal: subTotal,
                    discount: discount,
                    issued_at: now.toISOString(),
                    payment_status: paymentStatus,
                    paid_amount: finalPaidAmount
                })
                .select()
                .single();

            if (billError) throw billError;

            // 2. Create Bill Items
            const billItems = cart.map(item => ({
                bill_id: bill.id,
                business_id: selectedBusiness!.id,
                shop_id: selectedShop.id,
                product_id: item.product_id,
                name: item.product.name,
                name_ml: item.name_ml,
                quantity: item.quantity,
                price: item.price,
            }));

            const { error: itemsError } = await supabase
                .from('bill_items')
                .insert(billItems);

            if (itemsError) throw itemsError;

            // 3. Create Transaction for Initial Payment (if any)
            if (finalPaidAmount > 0) {
                const { error: transactionError } = await supabase
                    .from('bill_transactions')
                    .insert({
                        id: crypto.randomUUID(),
                        bill_id: bill.id,
                        amount: finalPaidAmount,
                        payment_method: 'cash', // Defaulting to cash for POS, or could add selector
                        recorded_at: now.toISOString(),
                        note: 'Initial payment',
                        recorded_by: (await supabase.auth.getUser()).data.user?.id,
                        business_id: selectedBusiness!.id,
                        shop_id: selectedShop.id,
                    });

                if (transactionError) throw transactionError;
            }

            router.push(`/bill-history/${bill.id}`);

        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Checkout failed details:', JSON.stringify(error, null, 2));
            alert(`Checkout failed: ${error.message || JSON.stringify(error)}`);
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
                {/* Header & Search */}
                <div className="mb-4 space-y-4 shrink-0 px-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Link href="/bill-history">
                                <Button variant="ghost" size="icon" className="hover:bg-muted/50">
                                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">New Sale</h1>
                                <p className="text-xs text-muted-foreground">{selectedShop?.name}</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        </div>
                        <Input
                            className="pl-10 h-12 text-lg bg-card/50 backdrop-blur-sm border-border focus:ring-2 ring-primary/20 transition-all rounded-xl shadow-sm"
                            placeholder="Search products..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto px-1 pb-4 scrollbar-hide">
                    {loadingData ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground animate-pulse">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <p>Loading catalog...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Search className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-lg">No products found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredProducts.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="group relative flex flex-col overflow-hidden rounded-2xl bg-card border border-border/50 hover:border-primary/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-left h-48 sm:h-56"
                                >
                                    {/* Image / Gradient Area */}
                                    <div className={`h-2/3 w-full bg-gradient-to-br ${getGradient(product.id)} p-4 flex items-start justify-end p-2 relative`}>
                                        <div className="absolute top-2 right-2 bg-black/20 backdrop-blur-md px-2 py-1 rounded-lg text-white text-xs font-bold">
                                            {formatCurrency(product.price)}
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
                                            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                                            {product.name_ml && <p className="text-xs text-muted-foreground font-ml">{product.name_ml}</p>}
                                        </div>
                                        <div className="flex items-center gap-1 mt-2">
                                            <Tag className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground capitalize">Item</span>
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
                            {cart.map((item) => (
                                <div key={item.product_id} className="p-3 flex items-center gap-3 bg-background hover:bg-muted/30 rounded-xl border border-transparent hover:border-border transition-all group">
                                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getGradient(item.product_id)} shrink-0`} />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <span className="text-sm font-medium line-clamp-1">{item.product.name}</span>
                                            <span className="text-sm font-bold ml-2">{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-xs text-muted-foreground">{formatCurrency(item.price)} x {item.quantity}</span>

                                            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-0.5">
                                                <button
                                                    onClick={() => updateQuantity(item.product_id, -1)}
                                                    disabled={item.quantity <= 1}
                                                    className="p-1 hover:bg-background rounded-md text-muted-foreground disabled:opacity-30 transition-shadow hover:shadow-sm"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => updateQuantity(item.product_id, 1)}
                                                    className="p-1 hover:bg-background rounded-md text-foreground transition-shadow hover:shadow-sm"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => removeFromCart(item.product_id)}
                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
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
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        placeholder="Enter amount paid"
                                        className="h-9"
                                    />
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
                                Please Checkout
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile Cart Floating Action Button (if needed for responsive, though design targets desktop first) */}
            {cart.length > 0 && (
                <div className="lg:hidden fixed bottom-6 right-6 z-50">
                    <Button
                        size="lg"
                        className="rounded-full h-14 w-14 shadow-2xl shadow-primary/40 p-0 flex items-center justify-center relative"
                        onClick={() => {
                            // Simple responsive handling: could toggle a drawer, for now sticking to the basics or alerting
                            alert("Mobile layouts would typically open a drawer here. For now, please use desktop for full POS experience.");
                        }}
                    >
                        <ShoppingCaret className="w-6 h-6" />
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center border-2 border-background">
                            {cart.length}
                        </span>
                    </Button>
                </div>
            )}
        </div>
    );
}

// Helper icon component for correct imports
const ShoppingCaret = ShoppingCart;
