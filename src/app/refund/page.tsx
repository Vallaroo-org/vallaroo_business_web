import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground">Refund Policy</h1>
                </div>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle>Return and Refund Policy</CardTitle>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none space-y-4 text-muted-foreground">
                        <p>Last updated: December 10, 2025</p>

                        <h3>1. Returns</h3>
                        <p>
                            We accept returns for items within 7 days of purchase. To be eligible for a return, your item must be unused,
                            in the same condition that you received it, and in the original packaging.
                        </p>

                        <h3>2. Refunds</h3>
                        <p>
                            Once we receive your item, we will inspect it and notify you that we have received your returned item.
                            If your return is approved, we will initiate a refund to your credit card (or original method of payment).
                        </p>

                        <h3>3. Shipping</h3>
                        <p>
                            You will be responsible for paying for your own shipping costs for returning your item.
                            Shipping costs are non-refundable.
                        </p>

                        <h3>4. Contact Us</h3>
                        <p>
                            If you have any questions on how to return your item to us, contact us at support@vallaroo.com.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
