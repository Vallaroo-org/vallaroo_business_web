// Error Utility - Get user-friendly error messages

/**
 * Converts any error to a user-friendly message.
 * Hides raw technical details from users.
 */
export function getUserFriendlyErrorMessage(error: unknown, fallback?: string): string {
    // If it's a known user-friendly message, return it
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();

        // Check for known error types and return appropriate messages
        if (msg.includes('network') || msg.includes('fetch')) {
            return 'Network error. Please check your connection and try again.';
        }
        if (msg.includes('unauthorized') || msg.includes('401')) {
            return 'You are not authorized. Please log in again.';
        }
        if (msg.includes('forbidden') || msg.includes('403')) {
            return 'Access denied. You do not have permission.';
        }
        if (msg.includes('not found') || msg.includes('404')) {
            return 'The requested item was not found.';
        }
        if (msg.includes('bad request') || msg.includes('400')) {
            return 'Invalid request. Please check your input.';
        }
        if (msg.includes('timeout')) {
            return 'Request timed out. Please try again.';
        }
    }

    // Return fallback or generic message - never expose raw error
    return fallback || 'Something went wrong. Please try again.';
}

/**
 * Simple wrapper to log error to console but return user-friendly message
 */
export function handleError(error: unknown, fallback?: string): string {
    console.error('Error:', error);
    return getUserFriendlyErrorMessage(error, fallback);
}
