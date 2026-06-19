/**
 * Vercel Web Analytics Integration
 * This file initializes and configures Vercel Web Analytics for the application.
 * 
 * The analytics script is loaded from the @vercel/analytics package and automatically
 * tracks page views across all pages of the application.
 * 
 * For more information, see: https://vercel.com/docs/analytics
 */

// Import the inject function from @vercel/analytics
import { inject } from '../node_modules/@vercel/analytics/dist/index.mjs';

// Initialize Vercel Web Analytics
// This will automatically track page views when users navigate the application
inject({
  mode: 'auto', // Auto-detect environment (production/development)
  debug: false  // Set to true for debugging in development
});

// Export for potential use in other modules
export { track } from '../node_modules/@vercel/analytics/dist/index.mjs';
