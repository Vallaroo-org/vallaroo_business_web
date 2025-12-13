'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Store, User, CheckCircle2, Globe, Building2, MapPin, Phone } from 'lucide-react';
import { createBusinessAction } from '@/app/actions/onboarding';
import { useLanguage } from '@/contexts/language-context';

enum Step {
    BUSINESS = 0,
    OWNER = 1,
    REVIEW = 2
}

export default function CreateBusinessPage() {
    const [step, setStep] = useState<Step>(Step.BUSINESS);
    const [loading, setLoading] = useState(false);
    const { locale } = useLanguage();
    const router = useRouter();

    const isMalayalam = locale === 'ml';

    const [formData, setFormData] = useState({
        name: '',
        nameMl: '',
        description: '',
        descriptionMl: '',
        website: '',
        city: '', // Headquarters
        ownerName: '', // Although not used in DB yet, we collect for parity/potential
        ownerPhone: ''
    });

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (step === Step.BUSINESS) {
            if (!formData.name || !formData.city) {
                alert('Business Name and City are required');
                return;
            }
            setStep(Step.OWNER);
        } else if (step === Step.OWNER) {
            if (!formData.ownerName || !formData.ownerPhone) {
                alert('Owner Name and Phone are required');
                return;
            }
            setStep(Step.REVIEW);
        }
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value);
            });

            const result = await createBusinessAction(data);

            if (result.error) {
                alert(result.error);
                return;
            }

            if (result.businessId) {
                router.push(`/onboarding/shop?businessId=${result.businessId}`);
            }

        } catch (error) {
            console.error('Error creating business:', error);
            alert('Failed to create business. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Register New Business</h1>
                <p className="text-muted-foreground mt-2">Start by providing your business details.</p>
            </div>

            <div className="mb-8">
                <nav aria-label="Progress">
                    <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
                        {['Business Details', 'Owner Info', 'Review'].map((label, index) => {
                            const isComplete = step > index;
                            const isCurrent = step === index;
                            return (
                                <li key={label} className="md:flex-1">
                                    <div className={`
                                        group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4
                                        ${isComplete ? 'border-primary' : isCurrent ? 'border-primary' : 'border-muted'}
                                    `}>
                                        <span className={`text-sm font-medium ${isComplete || isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                                            Step {index + 1}
                                        </span>
                                        <span className="text-sm font-medium text-foreground">{label}</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </nav>
            </div>

            <Card className="p-6 md:p-8">
                {step === Step.BUSINESS && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
                                <Store className="h-5 w-5 text-muted-foreground" />
                                Business Details
                            </h2>
                        </div>

                        <div className="grid gap-6">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block text-foreground">
                                    Business Name {isMalayalam && '(Malayalam)'} <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={isMalayalam ? formData.nameMl : formData.name}
                                    onChange={(e) => updateField(isMalayalam ? 'nameMl' : 'name', e.target.value)}
                                    placeholder={isMalayalam ? "വല്ലാറൂ" : "e.g. Vallaroo Inc"}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block text-foreground">
                                    Description {isMalayalam && '(Malayalam)'}
                                </label>
                                <Input
                                    value={isMalayalam ? formData.descriptionMl : formData.description}
                                    onChange={(e) => updateField(isMalayalam ? 'descriptionMl' : 'description', e.target.value)}
                                    placeholder={isMalayalam ? "വിവരണം" : "Brief description of your business"}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block text-foreground">
                                    Website (Optional)
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        value={formData.website}
                                        onChange={(e) => updateField('website', e.target.value)}
                                        placeholder="https://vallaroo.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block text-foreground">
                                    Headquarters City <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        value={formData.city}
                                        onChange={(e) => updateField('city', e.target.value)}
                                        placeholder="e.g. Kochi"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === Step.OWNER && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
                                <User className="h-5 w-5 text-muted-foreground" />
                                Owner Information
                            </h2>
                        </div>

                        <div className="grid gap-6">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block text-foreground">
                                    Owner Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={formData.ownerName}
                                    onChange={(e) => updateField('ownerName', e.target.value)}
                                    placeholder="Your Full Name"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block text-foreground">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        type="tel"
                                        value={formData.ownerPhone}
                                        onChange={(e) => updateField('ownerPhone', e.target.value)}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === Step.REVIEW && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
                                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                                Review & Confirm
                            </h2>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg space-y-4 text-sm text-foreground">
                            <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                                <span className="text-muted-foreground">Business Name</span>
                                <span className="col-span-2 font-medium">{formData.name}</span>
                            </div>
                            {formData.nameMl && (
                                <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                                    <span className="text-muted-foreground">Name (ML)</span>
                                    <span className="col-span-2 font-medium">{formData.nameMl}</span>
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                                <span className="text-muted-foreground">City</span>
                                <span className="col-span-2 font-medium">{formData.city}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-b border-border pb-2">
                                <span className="text-muted-foreground">Owner</span>
                                <span className="col-span-2 font-medium">{formData.ownerName}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-muted-foreground">Phone</span>
                                <span className="col-span-2 font-medium">{formData.ownerPhone}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-between pt-4 border-t border-border">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={step === Step.BUSINESS || loading}
                    >
                        Back
                    </Button>

                    {step === Step.REVIEW ? (
                        <Button onClick={handleSubmit} disabled={loading} className="px-8">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Business
                        </Button>
                    ) : (
                        <Button onClick={handleNext} className="px-8">
                            Next
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
