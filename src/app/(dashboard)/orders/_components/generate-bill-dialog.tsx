'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnlineOrder, OnlineOrderItem, Product } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { formatCurrency, cn } from '@/lib/utils';
import { Loader2, Trash2, Plus, Minus, Check, ChevronsUpDown } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { useBusiness } from '@/hooks/use-business';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface GenerateBillDialogProps {
    order: OnlineOrder & { items: OnlineOrderItem[] };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Extended item type for editing
interface EditableItem extends OnlineOrderItem {
    editPrice: number;
    editQuantity: number;
    variant_id?: string | null;
    tag?: 'Free' | 'Sample' | 'Other' | null;
}

export function GenerateBillDialog({ order, open, onOpenChange }: GenerateBillDialogProps) {
    const supabase = createClient();
    const router = useRouter();
    const { selectedBusiness } = useBusiness();
    const [loading, setLoading] = useState(false);

    // Form State
    const [items, setItems] = useState<EditableItem[]>([]);
    const [discount, setDiscount] = useState<number>(0);
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial'>('unpaid');
    const [paidAmount, setPaidAmount] = useState<string>('0');

    // Product Selection State
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [openCombobox, setOpenCombobox] = useState(false);

    useEffect(() => {
        if (open && order) {
            setItems(order.items.map(item => ({
                ...item,
                editPrice: item.price,
                editQuantity: item.quantity,
                tag: null
            })));
            setDetailsFromOrder();
            fetchProducts();
        }
    }, [open, order]);

    const fetchProducts = async () => {
        if (!order.shop_id) return;
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('shop_id', order.shop_id)
            .order('name');

        if (data) setAvailableProducts(data);
    };

    const setDetailsFromOrder = () => {
        // Default payment status from order if available, else unpaid
        if (order.payment_status === 'paid') {
            setPaymentStatus('paid');
        } else {
            setPaymentStatus('unpaid');
        }
    };

    // Calculate Totals
    const subTotal = items.reduce((sum, item) => sum + (item.editPrice * item.editQuantity), 0);
    const totalPayable = Math.max(0, subTotal - discount);

    // Update paid amount suggestion
    useEffect(() => {
        if (paymentStatus === 'paid') {
            setPaidAmount(totalPayable.toString());
        } else if (paymentStatus === 'unpaid') {
            setPaidAmount('0');
        }
    }, [paymentStatus, totalPayable]);

    const handleQuantityChange = (index: number, delta: number) => {
        setItems(prev => {
            const newItems = [...prev];
            const newQty = Math.max(1, newItems[index].editQuantity + delta);
            newItems[index].editQuantity = newQty;
            return newItems;
        });
    };

    const handlePriceChange = (index: number, newPrice: string) => {
        const price = parseFloat(newPrice);
        if (!isNaN(price)) {
            setItems(prev => {
                const newItems = [...prev];
                newItems[index].editPrice = price;
                return newItems;
            });
        }
    };

    const handleTagChange = (index: number, tag: 'Free' | 'Sample' | 'Other' | 'None') => {
        setItems(prev => {
            const newItems = [...prev];
            if (tag === 'Free' || tag === 'Sample') {
                newItems[index].editPrice = 0;
                newItems[index].tag = tag;
            } else if (tag === 'None') {
                // Revert to original price stored in 'price' (from order or product default)
                newItems[index].editPrice = newItems[index].price;
                newItems[index].tag = null;
            } else {
                newItems[index].tag = tag === 'Other' ? 'Other' : null;
            }
            return newItems;
        });
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddProduct = (product: Product) => {
        setItems(prev => {
            // Check if already exists by product_id (ignoring variants for simplicity in this flow)
            const existingIndex = prev.findIndex(i => i.product_id === product.id && !i.variant_id);

            if (existingIndex >= 0) {
                const newItems = [...prev];
                newItems[existingIndex].editQuantity += 1;
                return newItems;
            }

            // Create new item
            const newItem: EditableItem = {
                id: `temp-${Date.now()}`, // temp id
                order_id: order.id,
                product_id: product.id,
                variant_id: null,
                product_name: product.name,
                variant_name: null,
                quantity: 1,
                price: product.price, // Original price reference
                total: product.price,
                editPrice: product.price,
                editQuantity: 1,
                tag: null
            };
            return [...prev, newItem];
        });
        setOpenCombobox(false);
    };

    const handleGenerateBill = async () => {
        if (items.length === 0) {
            toast.error("Cannot generate empty bill");
            return;
        }

        setLoading(true);
        try {
            // Validate Partial Amount
            let finalPaidAmount = parseFloat(paidAmount);
            if (paymentStatus === 'partial') {
                if (isNaN(finalPaidAmount) || finalPaidAmount < 0 || finalPaidAmount > totalPayable) {
                    toast.error('Invalid partial amount');
                    setLoading(false);
                    return;
                }
            } else if (paymentStatus === 'paid') {
                finalPaidAmount = totalPayable;
            } else {
                finalPaidAmount = 0;
            }

            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
            const billNumber = `ORD-${dateStr}-${timeStr}`;

            if (!selectedBusiness) {
                toast.error("Business info missing");
                setLoading(false);
                return;
            }

            // 1. Create Bill
            const { data: bill, error: billError } = await supabase
                .from('bills')
                .insert({
                    business_id: selectedBusiness.id,
                    shop_id: order.shop_id,
                    bill_number: billNumber,
                    customer_name: order.customer_name,
                    customer_phone: order.customer_phone,
                    items: items.map(i => ({ ...i, price: i.editPrice, quantity: i.editQuantity })),
                    total: totalPayable,
                    subtotal: subTotal,
                    discount: discount,
                    issued_at: now.toISOString(),
                    payment_status: paymentStatus,
                    paid_amount: finalPaidAmount,
                    order_id: order.id
                })
                .select()
                .single();

            if (billError) {
                console.error("Bill Create Error", billError);
                throw billError;
            }

            // 2. Create Bill Items
            const billItemsInsert = items.map(item => ({
                bill_id: bill.id,
                business_id: selectedBusiness.id,
                shop_id: order.shop_id,
                product_id: item.product_id,
                name: item.tag ? `${item.product_name} (${item.tag})` : item.product_name,
                name_ml: '',
                quantity: item.editQuantity,
                price: item.editPrice,
            }));

            const { error: itemsError } = await supabase
                .from('bill_items')
                .insert(billItemsInsert);

            if (itemsError) throw itemsError;

            // 3. Update Order Status
            const { error: updateError } = await supabase
                .from('orders')
                .update({ status: 'completed' })
                .eq('id', order.id);

            if (updateError) throw updateError;

            toast.success("Bill generated successfully!");
            onOpenChange(false);
            router.push(`/bill-history/${bill.id}`);

        } catch (error: any) {
            console.error(error);
            toast.error("Failed to generate bill: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Generate Bill for Order #{order.id.slice(0, 8)}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Items List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label>Order Items</Label>

                            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8">
                                        <Plus className="mr-2 h-4 w-4" /> Add Item
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 w-[300px]" side="bottom" align="end">
                                    <Command>
                                        <CommandInput placeholder="Search products..." />
                                        <CommandList>
                                            <CommandEmpty>No products found.</CommandEmpty>
                                            <CommandGroup>
                                                {availableProducts.map((product) => (
                                                    <CommandItem
                                                        key={product.id}
                                                        value={product.name}
                                                        onSelect={() => handleAddProduct(product)}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                items.some(i => i.product_id === product.id) ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span>{product.name}</span>
                                                            <span className="text-xs text-muted-foreground">{formatCurrency(product.price)}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {items.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                No items in bill. Add items using the button above.
                            </div>
                        )}

                        {items.map((item, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-card/50 relative group">
                                <div className="flex-1">
                                    <div className="font-medium">{item.product_name}</div>
                                    <div className="text-xs text-muted-foreground">{item.variant_name}</div>
                                    {item.tag && (
                                        <Badge variant="secondary" className="mt-1 text-xs">
                                            {item.tag}
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Tag Selector */}
                                    <Select
                                        value={item.tag || 'None'}
                                        onValueChange={(val: any) => handleTagChange(index, val)}
                                    >
                                        <SelectTrigger className="w-[100px] h-8 text-xs">
                                            <SelectValue placeholder="Tag" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="None">Normal</SelectItem>
                                            <SelectItem value="Free">Free</SelectItem>
                                            <SelectItem value="Sample">Sample</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {/* Qty */}
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(index, -1)}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-8 text-center text-sm">{item.editQuantity}</span>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(index, 1)}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    {/* Price */}
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            value={item.editPrice}
                                            onChange={(e) => handlePriceChange(index, e.target.value)}
                                            className="h-8 text-right"
                                            min="0"
                                            disabled={item.tag === 'Free' || item.tag === 'Sample'}
                                        />
                                    </div>

                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveItem(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Financials */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Payment Status</Label>
                                <Select value={paymentStatus} onValueChange={(v: any) => setPaymentStatus(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="unpaid">Unpaid</SelectItem>
                                        <SelectItem value="partial">Partial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {paymentStatus === 'partial' && (
                                <div className="space-y-2">
                                    <Label>Amount Paid</Label>
                                    <Input
                                        type="number"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        min="0"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subTotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Discount</span>
                                <Input
                                    type="number"
                                    value={discount}
                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    className="w-24 h-8 text-right"
                                    min="0"
                                />
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                <span>Total Payable</span>
                                <span>{formatCurrency(totalPayable)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleGenerateBill} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate Bill
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
