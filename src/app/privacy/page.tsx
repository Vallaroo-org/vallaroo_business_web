export default function PrivacyPolicyPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 py-12 prose dark:prose-invert">
            <h1>Privacy Policy</h1>
            <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Introduction</h2>
            <p>
                Welcome to Vallaroo. We respect your privacy and are committed to protecting your personal data.
                This privacy policy will inform you as to how we look after your personal data and tell you about your privacy rights and how the law protects you.
            </p>

            <h2>2. Data We Collect</h2>
            <p>
                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
            </p>
            <ul>
                <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                <li><strong>Contact Data:</strong> includes billing address, delivery address, email address and telephone numbers.</li>
                <li><strong>Transaction Data:</strong> includes details about payments to and from you and other details of products and services you have purchased from us.</li>
            </ul>

            <h2>3. How We Use Your Data</h2>
            <p>
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul>
                <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                <li>Where we need to comply with a legal or regulatory obligation.</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.
            </p>

            <h2>5. Contact Us</h2>
            <p>
                If you have any questions about this privacy policy or our privacy practices, please contact us at support@vallaroo.com.
            </p>
        </div>
    );
}
