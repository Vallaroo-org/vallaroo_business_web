'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useBusiness } from '@/components/providers/business-provider';

export default function HelpPage() {
    const { selectedBusiness } = useBusiness();

    return (
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Help & Support</h1>
                <p className="text-muted-foreground text-sm sm:text-base">Get assistance and view legal documents.</p>
            </div>

            <Card className="bg-card border-border">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Contact Support</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Need help? Our support team is here for you.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:gap-4 p-4 sm:p-6 pt-0 sm:pt-0">
                    <div className="flex items-center p-2.5 sm:p-3 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-primary/10 rounded-full text-primary flex-shrink-0">
                            <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground text-sm sm:text-base">Email Support</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">support@vallaroo.com</p>
                        </div>
                        <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm flex-shrink-0">
                            <a href="mailto:support@vallaroo.com">Email Us</a>
                        </Button>
                    </div>

                    <div className="flex items-center p-2.5 sm:p-3 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400 flex-shrink-0">
                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground text-sm sm:text-base">WhatsApp Support</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">Chat with us directly</p>
                        </div>
                        <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm flex-shrink-0">
                            <a
                                href="https://wa.me/918137946044"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Chat
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-border">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">Legal & Policies</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Review our terms and privacy policy.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
                    <Link href="/privacy" prefetch={false} className="flex items-center justify-between p-2.5 sm:p-3 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-xs sm:text-sm font-medium text-foreground">Privacy Policy</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    </Link>
                    <Link href="/terms" prefetch={false} className="flex items-center justify-between p-2.5 sm:p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="flex items-center gap-2 sm:gap-3">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs sm:text-sm">Terms of Service</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    </Link>
                    <Link href="/refund" prefetch={false} className="flex items-center justify-between p-2.5 sm:p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="flex items-center gap-2 sm:gap-3">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs sm:text-sm">Refund Policy</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    </Link>
                    <Link href="/shipping" prefetch={false} className="flex items-center justify-between p-2.5 sm:p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="flex items-center gap-2 sm:gap-3">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs sm:text-sm">Shipping Policy</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    </Link>
                </CardContent>
            </Card>

            <Card className="bg-card border-border">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">App Info</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                    <div className="text-xs sm:text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Version</span>
                            <span className="font-medium text-foreground">v0.1.0</span>
                        </div>
                        {selectedBusiness && (
                            <div className="flex justify-between items-start gap-2">
                                <span className="text-muted-foreground flex-shrink-0">Business ID</span>
                                <span className="font-mono text-[10px] sm:text-xs text-foreground bg-muted p-1 rounded break-all text-right">{selectedBusiness.id}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
