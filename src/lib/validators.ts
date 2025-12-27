// Form Validation Utilities

// Character limits
export const MAX_LENGTHS = {
    name: 100,
    description: 500,
    address: 200,
    city: 50,
    phone: 15,
    email: 100,
    url: 200,
};

// Validators

/**
 * Validates a required field
 */
export const validateRequired = (value: string | undefined, fieldName: string): string | undefined => {
    if (!value || value.trim() === '') {
        return `${fieldName} is required.`;
    }
    return undefined;
};

/**
 * Validates a required description (min 10 chars)
 */
export const validateDescription = (value: string | undefined): string | undefined => {
    if (!value || value.trim() === '') {
        return 'Description is required.';
    }
    if (value.trim().length < 10) {
        return 'Description must be at least 10 characters.';
    }
    return undefined;
};

/**
 * Validates an optional description (validates format only when present)
 */
export const validateOptionalDescription = (value: string | undefined): string | undefined => {
    if (!value || value.trim() === '') {
        return undefined; // Optional, so empty is valid
    }
    if (value.trim().length < 10) {
        return 'Description should be at least 10 characters if provided.';
    }
    return undefined;
};

/**
 * Validates an Indian phone number
 */
export const validatePhone = (value: string | undefined): string | undefined => {
    if (!value || value.trim() === '') {
        return 'Phone number is required.';
    }
    const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    if (!phoneRegex.test(value.trim())) {
        return 'Please enter a valid 10-digit mobile number.';
    }
    return undefined;
};

/**
 * Validates an optional phone number
 */
export const validateOptionalPhone = (value: string | undefined): string | undefined => {
    if (!value || value.trim() === '') {
        return undefined;
    }
    const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
    if (!phoneRegex.test(value.trim())) {
        return 'Please enter a valid 10-digit mobile number.';
    }
    return undefined;
};

/**
 * Validates email
 */
export const validateEmail = (value: string | undefined): string | undefined => {
    if (!value || value.trim() === '') {
        return 'Email address is required.';
    }
    const emailRegex = /^[a-zA-Z0-9.]+@[a-zA-Z0-9]+\.[a-zA-Z]+$/;
    if (!emailRegex.test(value.trim())) {
        return 'Please enter a valid email address.';
    }
    return undefined;
};

/**
 * Validates an optional email
 */
export const validateOptionalEmail = (value: string | undefined): string | undefined => {
    if (!value || value.trim() === '') {
        return undefined;
    }
    const emailRegex = /^[a-zA-Z0-9.]+@[a-zA-Z0-9]+\.[a-zA-Z]+$/;
    if (!emailRegex.test(value.trim())) {
        return 'Please enter a valid email address.';
    }
    return undefined;
};

/**
 * Validates an optional URL (validates format only when present)
 */
export const validateOptionalUrl = (value: string | undefined): string | undefined => {
    if (!value || value.trim() === '') {
        return undefined;
    }
    const urlRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}(\/[^\s]*)?$/i;
    if (!urlRegex.test(value.trim())) {
        return 'Please enter a valid URL (e.g., www.example.com).';
    }
    return undefined;
};

/**
 * Normalizes a URL by prepending https:// if no protocol is present
 */
export const normalizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return trimmed;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return `https://${trimmed}`;
    }
    return trimmed;
};
