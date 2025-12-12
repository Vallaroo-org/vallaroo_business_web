export default function TermsOfServicePage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-12 prose dark:prose-invert">
            <h1>Terms of Service</h1>
            <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Agreement to Terms</h2>
            <p>
                By accessing or using our services, you agree to be bound by these Terms. If you do not agree to any part of the terms, then you may not access the service.
            </p>

            <h2>2. Use of Service</h2>
            <p>
                You represent and warrant that you are of legal age to form a binding contract and meet all of the foregoing eligibility requirements. You must use the service in compliance with all applicable laws and regulations.
            </p>

            <h2>3. Account Registration</h2>
            <p>
                To access certain features of the service, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
            </p>

            <h2>4. Intellectual Property</h2>
            <p>
                The service and its original content, features, and functionality are and will remain the exclusive property of Vallaroo and its licensors.
            </p>

            <h2>5. Termination</h2>
            <p>
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>

            <h2>6. Limitation of Liability</h2>
            <p>
                In no event shall Vallaroo, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.
            </p>

            <h2>7. Changes to Terms</h2>
            <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
            </p>
        </div>
    );
}
