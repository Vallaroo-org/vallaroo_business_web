import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function ShippingPolicyPage() {
    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground">Shipping Policy</h1>
                </div>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle>Shipping & Delivery</CardTitle>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-4 text-muted-foreground">
                        <p>Last updated: December 10, 2025</p>

                        <h3>1. Processing Time</h3>
                        <p>
                            All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays.
                        </p>

                        <h3>2. Shipping Rates</h3>
                        <p>
                            Shipping charges for your order will be calculated and displayed at checkout.
                        </p>

                        <h3>3. Delivery Estimates</h3>
                        <p>
                            Standard shipping typically takes 3-5 business days. Expedited options may be available depending on your location.
                        </p>

                        <h3>4. Shipment Confirmation & Order Tracking</h3>
                        <p>
                            You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s).
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
