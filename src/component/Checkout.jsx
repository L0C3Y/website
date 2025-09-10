import React, { useState, useCallback, useEffect, useMemo } from "react";
import axios from "axios";

// Configuration Management
const CONFIG = {
  // Environment Detection
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'development',
  
  // API Endpoints Configuration
  API: {
    development: 'http://localhost:5000',
    production: import.meta.env.VITE_API_URL || 'https://snowstrom.shop'
  },
  
  // Razorpay Configuration
  RAZORPAY: {
    keyId: import.meta.env.VITE_RAZORPAY_KEY_ID,
    currency: 'INR',
    companyName: import.meta.env.VITE_COMPANY_NAME || 'Snowstorm Store'
  },
  
  // Feature Toggles
  FEATURES: {
    enablePayment: import.meta.env.VITE_ENABLE_PAYMENT !== 'false',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
    enableRetry: import.meta.env.VITE_ENABLE_RETRY !== 'false',
    enableLogging: import.meta.env.VITE_ENABLE_LOGGING !== 'false'
  },

  // Timeouts and limits
  TIMEOUTS: {
    api: 30000,
    retryDelay: 1000,
    maxRetries: 3
  }
};

// Get current API URL based on environment
const getApiUrl = () => CONFIG.API[CONFIG.ENVIRONMENT];

// Enhanced axios instance with interceptors
const createApiClient = () => {
  const client = axios.create({
    baseURL: getApiUrl(),
    timeout: CONFIG.TIMEOUTS.api,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor for logging
  client.interceptors.request.use(
    (config) => {
      if (CONFIG.FEATURES.enableLogging) {
        console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    (error) => {
      if (CONFIG.FEATURES.enableLogging) {
        console.error('❌ Request Error:', error);
      }
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => {
      if (CONFIG.FEATURES.enableLogging) {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
      }
      return response;
    },
    (error) => {
      if (CONFIG.FEATURES.enableLogging) {
        console.error('❌ Response Error:', error.response?.status, error.message);
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Custom hook for Razorpay loading
const useRazorpayLoader = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkRazorpay = () => {
      if (window.Razorpay) {
        setIsLoaded(true);
        return;
      }

      // Load Razorpay script if not loaded
      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existingScript) return;

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => setIsLoaded(true);
      script.onerror = () => setError('Failed to load payment system');
      document.body.appendChild(script);
    };

    checkRazorpay();
  }, []);

  return { isLoaded, error };
};

// Enhanced Checkout Component
export default function Checkout({ 
  amount, 
  bookData = {},
  customerInfo = {},
  onSuccess, 
  onError, 
  onCancel,
  disabled = false,
  className = "",
  showAmount = true,
  buttonText,
  theme = { color: "#3399cc" },
  testMode = false // New prop for testing
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [paymentId, setPaymentId] = useState(null);

  const { isLoaded: isRazorpayLoaded, error: razorpayError } = useRazorpayLoader();
  const apiClient = useMemo(() => createApiClient(), []);
  const maxRetries = CONFIG.FEATURES.enableRetry ? CONFIG.TIMEOUTS.maxRetries : 0;

  // Set Razorpay loading error
  useEffect(() => {
    if (razorpayError) {
      setError(razorpayError);
    }
  }, [razorpayError]);

  // Validation function
  const validateInputs = useCallback(() => {
    if (!CONFIG.FEATURES.enablePayment) {
      setError('Payment system is currently disabled');
      return false;
    }

    if (!CONFIG.RAZORPAY.keyId) {
      setError('Payment configuration missing');
      return false;
    }

    if (!amount || amount <= 0) {
      setError('Invalid amount');
      return false;
    }

    if (!isRazorpayLoaded && !testMode) {
      setError('Payment system not ready');
      return false;
    }

    // Validate amount range (minimum 100 paise = ₹1)
    if (amount < 100) {
      setError('Minimum amount is ₹1');
      return false;
    }

    // Validate customer info if provided
    if (customerInfo.email && !/\S+@\S+\.\S+/.test(customerInfo.email)) {
      setError('Invalid email address');
      return false;
    }

    if (customerInfo.phone && !/^\+?[\d\s-()]{10,15}$/.test(customerInfo.phone)) {
      setError('Invalid phone number');
      return false;
    }

    return true;
  }, [amount, isRazorpayLoaded, customerInfo, testMode]);

  // Create order function with better error handling
  const createOrder = useCallback(async (orderAmount) => {
    try {
      const orderData = {
        amount: orderAmount,
        currency: CONFIG.RAZORPAY.currency,
        bookData,
        customerInfo,
        metadata: {
          source: 'checkout_component',
          timestamp: new Date().toISOString(),
          environment: CONFIG.ENVIRONMENT,
          userAgent: navigator.userAgent,
          testMode
        }
      };

      const response = await apiClient.post('/api/payment/orders', orderData);

      // Validate response
      if (!response.data.id) {
        throw new Error('Invalid order response from server');
      }

      return response.data;
    } catch (error) {
      console.error('Order creation failed:', error);
      
      // More specific error messages
      if (error.response?.status === 400) {
        throw new Error('Invalid order details. Please check your information.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please refresh and try again.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again in a few moments.');
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to create payment order'
      );
    }
  }, [bookData, customerInfo, apiClient, testMode]);

  // Verify payment function
  const verifyPayment = useCallback(async (paymentData) => {
    try {
      const verificationData = {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        bookData,
        customerInfo,
        metadata: {
          verifiedAt: new Date().toISOString(),
          environment: CONFIG.ENVIRONMENT,
          testMode
        }
      };

      const response = await apiClient.post('/api/payment/verify', verificationData);

      if (!response.data.success) {
        throw new Error('Payment verification failed');
      }

      return response.data;
    } catch (error) {
      console.error('Payment verification failed:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Payment verification failed'
      );
    }
  }, [bookData, customerInfo, apiClient, testMode]);

  // Enhanced analytics tracking
  const trackEvent = useCallback((eventName, eventData = {}) => {
    if (!CONFIG.FEATURES.enableAnalytics) return;

    const baseEventData = {
      ...eventData,
      value: amount / 100,
      currency: CONFIG.RAZORPAY.currency,
      environment: CONFIG.ENVIRONMENT,
      timestamp: new Date().toISOString(),
      testMode
    };

    try {
      // Google Analytics 4
      if (window.gtag) {
        window.gtag('event', eventName, {
          ...baseEventData,
          items: [{
            item_id: bookData.id || 'unknown',
            item_name: bookData.title || 'Unknown Book',
            category: bookData.category || 'Ebook',
            quantity: 1,
            price: amount / 100
          }]
        });
      }

      // Facebook Pixel
      if (window.fbq) {
        window.fbq('track', eventName, {
          value: amount / 100,
          currency: CONFIG.RAZORPAY.currency,
          content_ids: [bookData.id],
          content_type: 'product'
        });
      }

      // Custom analytics
      if (window.analytics) {
        window.analytics.track(eventName, {
          ...baseEventData,
          bookId: bookData.id
        });
      }

      // Console log in development
      if (CONFIG.ENVIRONMENT === 'development') {
        console.log('📊 Analytics:', eventName, baseEventData);
      }
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }, [amount, bookData, testMode]);

  // Payment success handler with better error handling
  const handlePaymentSuccess = useCallback(async (response) => {
    try {
      setError(null);
      setPaymentId(response.razorpay_payment_id);
      trackEvent('payment_initiated', { payment_id: response.razorpay_payment_id });

      const verifyResult = await verifyPayment(response);

      if (verifyResult.success) {
        trackEvent('purchase', { 
          transaction_id: response.razorpay_payment_id,
          payment_method: 'razorpay',
          order_id: response.razorpay_order_id
        });

        // Call success callback with more data
        onSuccess?.({
          ...verifyResult,
          paymentDetails: response,
          bookData,
          customerInfo,
          amount
        });

        // Show success message if no custom handler
        if (!onSuccess) {
          alert(`✅ Payment successful!\n\nPayment ID: ${response.razorpay_payment_id}\n\nThank you for your purchase!`);
        }
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment success handling failed:', error);
      const errorMessage = error.message || 'Payment processing failed';
      setError(errorMessage);
      trackEvent('payment_failed', { 
        error: errorMessage,
        payment_id: response.razorpay_payment_id,
        stage: 'verification'
      });
      onError?.(errorMessage, error);
    } finally {
      setIsLoading(false);
    }
  }, [verifyPayment, onSuccess, onError, trackEvent, bookData, customerInfo, amount]);

  // Payment error handler
  const handlePaymentError = useCallback((error) => {
    console.error('Razorpay payment error:', error);
    const errorMessage = error.description || error.reason || 'Payment failed';
    setError(errorMessage);
    trackEvent('payment_failed', { 
      error: errorMessage,
      error_code: error.code,
      stage: 'payment'
    });
    onError?.(errorMessage, error);
    setIsLoading(false);
  }, [onError, trackEvent]);

  // Payment modal dismiss handler
  const handleModalDismiss = useCallback(() => {
    const cancelMessage = 'Payment cancelled by user';
    trackEvent('payment_cancelled', { stage: 'modal_dismiss' });
    onCancel?.(cancelMessage);
    setIsLoading(false);
  }, [onCancel, trackEvent]);

  // Retry mechanism with exponential backoff
  const retryWithBackoff = useCallback(async (fn, maxAttempts) => {
    let attempts = 0;
    
    while (attempts <= maxAttempts) {
      try {
        return await fn();
      } catch (error) {
        attempts++;
        if (attempts > maxAttempts) throw error;
        
        const delay = CONFIG.TIMEOUTS.retryDelay * Math.pow(2, attempts);
        await new Promise(resolve => setTimeout(resolve, delay));
        setRetryCount(attempts);
      }
    }
  }, []);

  // Main payment handler with enhanced retry logic
  const handlePayment = useCallback(async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    setError(null);
    setRetryCount(0);
    setPaymentId(null);

    try {
      trackEvent('checkout_initiated');

      // Test mode simulation
      if (testMode) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockResponse = {
          razorpay_payment_id: 'pay_test_' + Date.now(),
          razorpay_order_id: 'order_test_' + Date.now(),
          razorpay_signature: 'test_signature'
        };
        handlePaymentSuccess(mockResponse);
        return;
      }

      // Create order with retry logic
      const order = await retryWithBackoff(() => createOrder(amount), maxRetries);

      // Configure Razorpay options
      const options = {
        key: CONFIG.RAZORPAY.keyId,
        amount: order.amount,
        currency: order.currency || CONFIG.RAZORPAY.currency,
        name: CONFIG.RAZORPAY.companyName,
        description: bookData.title ? `${bookData.title} - Digital Access` : "Ebook Purchase",
        order_id: order.id,
        handler: handlePaymentSuccess,
        prefill: {
          name: customerInfo.name || '',
          email: customerInfo.email || '',
          contact: customerInfo.phone || ''
        },
        notes: {
          bookId: bookData.id?.toString() || '',
          bookTitle: bookData.title || '',
          customerEmail: customerInfo.email || '',
          environment: CONFIG.ENVIRONMENT
        },
        theme: {
          color: theme.color,
          backdrop_color: 'rgba(0,0,0,0.7)'
        },
        modal: {
          ondismiss: handleModalDismiss,
          escape: true,
          backdropclose: false,
          animation: true,
          confirm_close: true
        },
        retry: {
          enabled: CONFIG.FEATURES.enableRetry,
          max_count: maxRetries
        },
        remember_customer: true,
        readonly: {
          email: !!customerInfo.email,
          contact: !!customerInfo.phone
        },
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Pay using Netbanking',
                instruments: [
                  { method: 'netbanking' }
                ]
              },
              other: {
                name: 'Other Payment Methods',
                instruments: [
                  { method: 'card' },
                  { method: 'wallet' },
                  { method: 'upi' }
                ]
              }
            },
            sequence: ['block.banks', 'block.other'],
            preferences: {
              show_default_blocks: true
            }
          }
        }
      };

      // Initialize Razorpay and open checkout
      const rzp = new window.Razorpay(options);
      
      // Handle payment errors
      rzp.on('payment.failed', handlePaymentError);
      
      rzp.open();
      
      // Track checkout opened
      trackEvent('checkout_opened', { order_id: order.id });

    } catch (error) {
      console.error('Payment initialization failed:', error);
      const errorMessage = error.message || 'Failed to start payment process';
      setError(errorMessage);
      trackEvent('checkout_failed', { 
        error: errorMessage,
        retry_count: retryCount 
      });
      onError?.(errorMessage, error);
      setIsLoading(false);
    }
  }, [
    validateInputs, amount, retryWithBackoff, createOrder, maxRetries,
    handlePaymentSuccess, handlePaymentError, handleModalDismiss, 
    trackEvent, bookData, customerInfo, theme, onError, testMode, retryCount
  ]);

  // Format amount for display
  const formatAmount = useCallback((amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: CONFIG.RAZORPAY.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amt / 100);
  }, []);

  // Determine button text
  const getButtonText = useCallback(() => {
    if (buttonText) return buttonText;
    
    if (isLoading) {
      if (testMode) return 'Test Payment...';
      return retryCount > 0 ? `Retrying... (${retryCount}/${maxRetries})` : 'Processing...';
    }
    
    if (testMode) {
      return showAmount ? `Test Pay ${formatAmount(amount)}` : 'Test Payment';
    }
    
    if (showAmount) {
      return `Pay ${formatAmount(amount)}`;
    }
    
    return 'Pay Now';
  }, [buttonText, isLoading, testMode, retryCount, maxRetries, showAmount, formatAmount, amount]);

  // Determine if button should be disabled
  const isButtonDisabled = useMemo(() => {
    return disabled || isLoading || (!isRazorpayLoaded && !testMode) || !!error;
  }, [disabled, isLoading, isRazorpayLoaded, testMode, error]);

  // Component render
  return (
    <div className={`checkout-container ${className}`}>
      {/* Environment indicator (development only) */}
      {CONFIG.ENVIRONMENT === 'development' && (
        <div className="env-indicator" style={{
          fontSize: '12px',
          color: '#666',
          marginBottom: '8px',
          padding: '4px 8px',
          backgroundColor: testMode ? '#fff3cd' : '#f0f0f0',
          borderRadius: '4px',
          border: testMode ? '1px solid #ffeaa7' : '1px solid #ddd'
        }}>
          {testMode ? '🧪 Test Mode' : '🔧 Dev Mode'} | API: {getApiUrl()}
        </div>
      )}

      {/* Main payment button */}
      <button
        onClick={handlePayment}
        disabled={isButtonDisabled}
        className={`pay-btn ${isLoading ? 'loading' : ''} ${error ? 'error' : ''} ${testMode ? 'test-mode' : ''}`}
        aria-label={`Pay ${formatAmount(amount)} for ${bookData.title || 'ebook'}`}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          border: 'none',
          borderRadius: '8px',
          cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
          backgroundColor: error ? '#dc3545' : 
                          testMode ? '#17a2b8' :
                          (isLoading ? '#6c757d' : theme.color),
          color: '#ffffff',
          transition: 'all 0.3s ease',
          opacity: isButtonDisabled ? 0.7 : 1,
          minWidth: '140px',
          position: 'relative',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        {isLoading && (
          <span 
            className="spinner"
            style={{
              display: 'inline-block',
              marginRight: '8px',
              animation: 'spin 1s linear infinite'
            }}
            aria-hidden="true"
          >
            ⏳
          </span>
        )}
        {getButtonText()}
      </button>

      {/* Payment ID display */}
      {paymentId && (
        <div className="payment-id" style={{
          fontSize: '12px',
          color: '#28a745',
          marginTop: '8px',
          padding: '6px 10px',
          backgroundColor: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: '4px'
        }}>
          Payment ID: {paymentId}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div 
          className="error-message" 
          role="alert" 
          aria-live="polite"
          style={{
            color: '#dc3545',
            fontSize: '14px',
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span aria-hidden="true">⚠</span>
          {error}
        </div>
      )}

      {/* Payment features */}
      <div className="payment-features" style={{
        fontSize: '12px',
        color: '#666',
        marginTop: '12px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        justifyContent: 'center'
      }}>
        <span>🔒 Secure Payment</span>
        <span>⚡ Instant Access</span>
        <span>💳 All Cards Accepted</span>
        {CONFIG.FEATURES.enableRetry && <span>🔄 Auto Retry</span>}
        {testMode && <span>🧪 Test Mode</span>}
      </div>

      {/* Powered by Razorpay */}
      {!testMode && (
        <div className="payment-powered-by" style={{
          fontSize: '11px',
          color: '#999',
          marginTop: '8px',
          textAlign: 'center'
        }}>
          Powered by Razorpay
        </div>
      )}

      {/* Required CSS for animations and responsive design */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .pay-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .pay-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .pay-btn.test-mode {
          background: linear-gradient(135deg, #17a2b8 0%, #138496 100%) !important;
        }
        
        .checkout-container {
          text-align: center;
          max-width: 300px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .error-message {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 480px) {
          .pay-btn {
            width: 100%;
            padding: 14px 20px;
          }
          
          .payment-features {
            flex-direction: column;
            gap: 8px;
          }
          
          .checkout-container {
            max-width: none;
            padding: 0 16px;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .pay-btn:hover:not(:disabled) {
            transform: none;
          }
          
          .spinner {
            animation: none;
          }
          
          .error-message {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}