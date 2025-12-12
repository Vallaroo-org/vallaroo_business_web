export default function SubscriptionPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Subscription & Billing</h1>
                <p className="mt-2 text-muted-foreground">Manage your subscription plan and payment methods.</p>
            </div>

            {/* Current Plan Card */}
            <div className="bg-card shadow rounded-lg overflow-hidden border border-border">
                <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                    <h3 className="text-lg font-medium leading-6 text-foreground">Current Plan</h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        Active
                    </span>
                </div>
                <div className="px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Plan</p>
                            <p className="mt-1 text-xl font-semibold text-foreground">Pro Plan</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-muted-foreground">Price</p>
                            <p className="mt-1 text-xl font-semibold text-foreground">₹999<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                        </div>
                    </div>
                    <div className="mt-6 border-t border-border pt-4">
                        <p className="text-sm text-muted-foreground">Your next billing date is <span className="font-medium text-foreground">January 10, 2026</span></p>
                    </div>
                </div>
                <div className="bg-muted/30 px-6 py-4 flex justify-end space-x-3 border-t border-border">
                    <button className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-input rounded-md hover:bg-muted transition-colors shadow-sm">
                        Cancel Subscription
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 shadow-sm transition-colors">
                        Upgrade Plan
                    </button>
                </div>
            </div>

            {/* Billing History (Placeholder) */}
            <div className="bg-card shadow rounded-lg border border-border">
                <div className="px-6 py-5 border-b border-border">
                    <h3 className="text-lg font-medium leading-6 text-foreground">Billing History</h3>
                </div>
                <div className="px-6 py-8 text-center text-muted-foreground">
                    No past invoices found.
                </div>
            </div>
        </div>
    );
}
