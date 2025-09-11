// =============================================================================
// FRONTEND: Enhanced Ebooks Component with Production Config
// =============================================================================

import React, { useState, useMemo, useCallback, useEffect } from "react";
import axios from "axios";
import "../styles/app.css";

// Configuration Management
const CONFIG = {
  // Environment toggles
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'development', // 'development' | 'production'
  
  // API Configuration
  API: {
    development: 'http://localhost:5000',
    production: process.env.REACT_APP_API_URL || 'https://your-api.com'
  },
  
  // Razorpay Configuration
  RAZORPAY: {
    keyId: process.env.REACT_APP_RAZORPAY_KEY_ID,
    currency: 'INR',
    companyName: 'Elite Knowledge Arsenal'
  },
  
  // Feature Toggles
  FEATURES: {
    emailDelivery: process.env.REACT_APP_ENABLE_EMAIL !== 'false',
    pdfGeneration: process.env.REACT_APP_ENABLE_PDF !== 'false',
    paymentProcessing: process.env.REACT_APP_ENABLE_PAYMENT !== 'false',
    analytics: process.env.REACT_APP_ENABLE_ANALYTICS !== 'false',
    localStorage: process.env.REACT_APP_ENABLE_LOCALSTORAGE !== 'false'
  }
};

// Get current API URL
const getApiUrl = () => CONFIG.API[CONFIG.ENVIRONMENT];

// Enhanced Checkout Component with Razorpay Integration
const EnhancedCheckout = ({ 
  amount, 
  bookData, 
  customerInfo = {}, 
  onSuccess, 
  onError, 
  onCancel 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const createOrder = async () => {
    const response = await axios.post(`${getApiUrl()}/api/payments/create-order`, {
      amount: amount,
      currency: CONFIG.RAZORPAY.currency,
      bookId: bookData.id,
      bookTitle: bookData.title,
      customerInfo
    });
    return response.data;
  };

  const verifyAndFulfillOrder = async (paymentResponse) => {
    const response = await axios.post(`${getApiUrl()}/api/payments/verify-and-fulfill`, {
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature,
      bookId: bookData.id,
      customerEmail: customerInfo.email || 'customer@example.com'
    });
    return response.data;
  };

  const handlePayment = async () => {
    if (!window.Razorpay) {
      setError('Payment system not loaded. Please refresh the page.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Create order
      const orderData = await createOrder();

      // Razorpay options
      const options = {
        key: CONFIG.RAZORPAY.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: CONFIG.RAZORPAY.companyName,
        description: `${bookData.title} - Digital Access`,
        order_id: orderData.order.id,
        prefill: {
          name: customerInfo.name || '',
          email: customerInfo.email || '',
          contact: customerInfo.phone || ''
        },
        theme: {
          color: '#8A2BE2'
        },
        handler: async (response) => {
          try {
            // Verify payment and fulfill order
            const fulfillmentResult = await verifyAndFulfillOrder(response);
            
            if (fulfillmentResult.success) {
              // Track successful purchase
              if (CONFIG.FEATURES.analytics) {
                trackPurchase(bookData, amount);
              }
              
              onSuccess?.(fulfillmentResult);
              
              // Show success message
              alert(`🎉 SUCCESS! \n\n✅ Payment confirmed\n✅ PDF sent to ${customerInfo.email}\n✅ Access granted\n\nCheck your email for download links!`);
            }
          } catch (error) {
            console.error('Order fulfillment error:', error);
            onError?.(error.response?.data?.message || 'Order processing failed');
          }
        },
        modal: {
          ondismiss: () => {
            onCancel?.('Payment cancelled by user');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment initiation error:', error);
      setError(error.response?.data?.message || 'Failed to start payment');
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const trackPurchase = (book, amount) => {
    // Google Analytics or other tracking
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: `book_${book.id}_${Date.now()}`,
        value: amount,
        currency: 'INR',
        items: [{
          item_id: book.id,
          item_name: book.title,
          category: book.category,
          quantity: 1,
          price: amount
        }]
      });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  return (
    <div className="enhanced-checkout">
      <button
        onClick={handlePayment}
        disabled={isProcessing || !CONFIG.RAZORPAY.keyId}
        className={`premium-btn checkout-btn ${isProcessing ? 'processing' : ''}`}
      >
        {isProcessing ? (
          <>
            <span className="spinner">⏳</span>
            Processing...
          </>
        ) : (
          `🚀 Secure Checkout ${formatPrice(amount)}`
        )}
      </button>
      
      {error && (
        <div className="error-message" role="alert">
          <span>⚠️</span> {error}
        </div>
      )}
      
      <div className="checkout-features">
        <div className="feature">✅ Instant PDF Delivery</div>
        <div className="feature">✅ Secure Payment</div>
        <div className="feature">✅ 30-Day Guarantee</div>
      </div>
    </div>
  );
};

// Main Ebooks Component
const Ebooks = () => {
  const [purchasedBooks, setPurchasedBooks] = useState(() => {
    if (!CONFIG.FEATURES.localStorage) return new Set();
    
    try {
      const stored = localStorage.getItem('purchased_ebooks');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [showCustomerForm, setShowCustomerForm] = useState(null);

  // Ebooks data
  const ebooks = useMemo(() => [
    {
      id: 1,
      title: "Life of a Dot",
      description: "Sequence of Consequences.",
      cover: "../../media/red.png",
      price: 297,
      originalPrice: 497,
      pages: 384,
      rating: 4.9,
      category: "Executive Psychology",
      author: "Marcus Steel",
      preview: "Discover the 7 mental frameworks that separate champions from the masses...",
      bonus: "Includes 3-hour audio masterclass + 30-day action plan",
      testimonial: "This changed my entire approach to leadership. ROI: 10x in first quarter.",
      level: "MASTERMIND",
      exclusivity: "Limited to 500 copies",
      pdfFile: "elite-mind-forge.pdf"
    },
    {
      id: 2,
      title: "Digital Empire Blueprint",
      description: "The complete system for building 7-figure online businesses from zero to empire status.",
      cover: "/covers/digital-empire.jpg",
      price: 497,
      originalPrice: 997,
      pages: 456,
      rating: 4.8,
      category: "Business Strategy",
      author: "Elena Vanguard",
      preview: "Revealed: The 90-day formula that built my $10M digital empire...",
      bonus: "Private community access + Weekly Q&A calls for 6 months",
      testimonial: "Generated $250K in first 90 days following this system.",
      level: "ELITE",
      exclusivity: "VIP Access Only",
      pdfFile: "digital-empire-blueprint.pdf"
    },
    {
      id: 3,
      title: "Influence Mastery Protocol",
      description: "Advanced persuasion psychology and influence tactics for modern leaders and entrepreneurs.",
      cover: "/covers/influence-mastery.jpg",
      price: 397,
      originalPrice: 697,
      pages: 342,
      rating: 4.9,
      category: "Influence Psychology",
      author: "Dr. Alex Raven",
      preview: "The ethical influence framework used by world leaders and top negotiators...",
      bonus: "25 influence scripts + Video training series",
      testimonial: "Closed 3 major deals in first week using these techniques.",
      level: "PROFESSIONAL",
      exclusivity: "Professional Edition",
      pdfFile: "influence-mastery-protocol.pdf"
    }
  ], []);

  // Persist purchases to localStorage
  useEffect(() => {
    if (CONFIG.FEATURES.localStorage) {
      try {
        localStorage.setItem('purchased_ebooks', JSON.stringify([...purchasedBooks]));
      } catch (error) {
        console.warn('Failed to save purchases:', error);
      }
    }
  }, [purchasedBooks]);

  const handlePurchaseClick = useCallback((book) => {
    if (purchasedBooks.has(book.id)) return;
    
    setShowCustomerForm(book);
  }, [purchasedBooks]);

  const handlePurchaseSuccess = useCallback((book, fulfillmentResult) => {
    setPurchasedBooks(prev => new Set([...prev, book.id]));
    setShowCustomerForm(null);
    
    // Optional: Show detailed success info
    if (fulfillmentResult.downloadUrl) {
      console.log('Download URL:', fulfillmentResult.downloadUrl);
    }
  }, []);

  const handleCustomerSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!customerInfo.email) {
      alert('Email is required for PDF delivery');
      return;
    }
    
    // Proceed with purchase
    setShowCustomerForm(prev => ({ ...prev, showCheckout: true }));
  }, [customerInfo]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const getLevelBadgeColor = (level) => {
    const colors = {
      'MASTERMIND': 'linear-gradient(45deg, #FFD700, #FFA500)',
      'ELITE': 'linear-gradient(45deg, #8A2BE2, #4B0082)',
      'PROFESSIONAL': 'linear-gradient(45deg, #FF4500, #DC143C)',
      'PREMIUM': 'linear-gradient(45deg, #32CD32, #228B22)',
      'TACTICAL': 'linear-gradient(45deg, #1E90FF, #4169E1)',
      'STRATEGIC': 'linear-gradient(45deg, #FF6347, #FF4500)'
    };
    return colors[level] || 'linear-gradient(45deg, #666, #333)';
  };

  const featuredBook = ebooks[0];

  return (
    <div className="ebooks-page premium-collection">
      {/* Environment Info (dev only) */}
      {CONFIG.ENVIRONMENT === 'development' && (
        <div className="dev-info">
          <strong>Environment:</strong> {CONFIG.ENVIRONMENT} | 
          <strong> API:</strong> {getApiUrl()} |
          <strong> Features:</strong> {Object.entries(CONFIG.FEATURES).filter(([,v]) => v).map(([k]) => k).join(', ')}
        </div>
      )}

      {/* Premium Page Header */}
      <div className="page-header premium-header">
        <div className="premium-badge">🏆 PREMIUM COLLECTION</div>
        <h1 className="page-title premium-title">
          ⚡ ELITE KNOWLEDGE ARSENAL
        </h1>
        <p className="page-subtitle premium-subtitle">
          High-Value Intelligence for Serious Achievers & Empire Builders
        </p>
        <div className="premium-stats">
          <div className="premium-stat">
            <span className="stat-number">$50M+</span>
            <span className="stat-label">Generated by Students</span>
          </div>
          <div className="premium-stat">
            <span className="stat-number">10,000+</span>
            <span className="stat-label">Elite Members</span>
          </div>
          <div className="premium-stat">
            <span className="stat-number">99.2%</span>
            <span className="stat-label">Success Rate</span>
          </div>
        </div>
      </div>

      {/* Featured Book Section */}
      <div className="featured-section premium-featured">
        <div className="section-header">
          <h2 className="section-title">🔥 FLAGSHIP MASTERPIECE</h2>
          <p className="section-subtitle">The crown jewel of our collection</p>
        </div>
        
        <div className="featured-book premium-featured-book">
          <div className="featured-cover premium-cover">
            <img 
              src={featuredBook.cover} 
              alt={featuredBook.title}
              onError={(e) => {
                e.target.src = '/covers/placeholder-premium.jpg';
              }}
            />
            <div className="premium-level-badge" style={{background: getLevelBadgeColor(featuredBook.level)}}>
              {featuredBook.level}
            </div>
            <div className="exclusivity-badge">{featuredBook.exclusivity}</div>
          </div>
          
          <div className="featured-info premium-info">
            <div className="book-header">
              <h3 className="premium-book-title">{featuredBook.title}</h3>
              <p className="premium-author">by {featuredBook.author}</p>
            </div>
            
            <p className="premium-description">{featuredBook.description}</p>
            
            <div className="premium-features">
              <div className="feature-item">
                <span className="feature-icon">⭐</span>
                <span>Rating: {featuredBook.rating}/5.0</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📖</span>
                <span>{featuredBook.pages} pages of pure value</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span>{featuredBook.category}</span>
              </div>
            </div>
            
            <div className="premium-preview">
              <h4>🔍 Inside Preview:</h4>
              <em>"{featuredBook.preview}"</em>
            </div>
            
            <div className="bonus-section">
              <h4>🎁 EXCLUSIVE BONUSES INCLUDED:</h4>
              <p>{featuredBook.bonus}</p>
            </div>
            
            <div className="testimonial-section">
              <h4>💬 SUCCESS STORY:</h4>
              <blockquote>"{featuredBook.testimonial}"</blockquote>
            </div>
            
            <div className="premium-pricing">
              <div className="price-container">
                <span className="original-price">{formatPrice(featuredBook.originalPrice)}</span>
                <span className="current-price">{formatPrice(featuredBook.price)}</span>
                <span className="savings">Save {formatPrice(featuredBook.originalPrice - featuredBook.price)}</span>
              </div>
              <div className="urgency-text">⚡ Limited Time: 40% OFF</div>
            </div>
            
            <div className="premium-actions">
              <button 
                className="premium-btn flagship-btn"
                onClick={() => handlePurchaseClick(featuredBook)}
                disabled={purchasedBooks.has(featuredBook.id)}
              >
                {purchasedBooks.has(featuredBook.id) ? 
                  '✅ IN YOUR VAULT' : 
                  '🚀 CLAIM YOUR COPY NOW'
                }
              </button>
              <div className="guarantee">
                <span>💎 30-Day Money-Back Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ebooks Grid */}
      <div className="ebooks-grid premium-grid">
        <div className="section-header">
          <h2 className="section-title">👑 COMPLETE ELITE COLLECTION</h2>
          <p className="section-subtitle">Transform every area of your life</p>
        </div>
        
        <div className="books-grid">
          {ebooks.slice(1).map((book) => (
            <div key={book.id} className="book-card premium-book-card">
              <div className="book-cover">
                <img 
                  src={book.cover} 
                  alt={book.title}
                  onError={(e) => {
                    e.target.src = '/covers/placeholder-premium.jpg';
                  }}
                />
                <div className="level-badge" style={{background: getLevelBadgeColor(book.level)}}>
                  {book.level}
                </div>
              </div>
              
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">by {book.author}</p>
                <p className="book-description">{book.description}</p>
                
                <div className="book-stats">
                  <span>⭐ {book.rating}</span>
                  <span>📖 {book.pages}p</span>
                  <span>🎯 {book.category}</span>
                </div>
                
                <div className="pricing">
                  <span className="original-price">{formatPrice(book.originalPrice)}</span>
                  <span className="current-price">{formatPrice(book.price)}</span>
                </div>
                
                <button 
                  className="premium-btn book-btn"
                  onClick={() => handlePurchaseClick(book)}
                  disabled={purchasedBooks.has(book.id)}
                >
                  {purchasedBooks.has(book.id) ? 
                    '✅ OWNED' : 
                    '🛒 GET ACCESS'
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Info Modal */}
      {showCustomerForm && !showCustomerForm.showCheckout && (
        <div className="modal-overlay">
          <div className="modal-content customer-form-modal">
            <div className="modal-header">
              <h3>📧 Delivery Information</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCustomerForm(null)}
              >
                ×
              </button>
            </div>
            
            <div className="selected-book-info">
              <h4>{showCustomerForm.title}</h4>
              <p>Price: {formatPrice(showCustomerForm.price)}</p>
            </div>
            
            <form onSubmit={handleCustomerSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({...prev, name: e.target.value}))}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({...prev, email: e.target.value}))}
                  placeholder="your@email.com"
                  required
                />
                <small>PDF will be delivered to this email</small>
              </div>
              
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({...prev, phone: e.target.value}))}
                  placeholder="+91 9876543210"
                />
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowCustomerForm(null)}>
                  Cancel
                </button>
                <button type="submit" className="premium-btn">
                 Continue to Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCustomerForm?.showCheckout && (
        <div className="modal-overlay">
          <div className="modal-content checkout-modal">
            <div className="modal-header">
              <h3>🔒 Secure Checkout</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCustomerForm(null)}
              >
                ×
              </button>
            </div>
            
            <div className="checkout-summary">
              <h4>{showCustomerForm.title}</h4>
              <p>Customer: {customerInfo.name}</p>
              <p>Email: {customerInfo.email}</p>
              <p className="total">Total: {formatPrice(showCustomerForm.price)}</p>
            </div>
            
            <EnhancedCheckout
              amount={showCustomerForm.price}
              bookData={showCustomerForm}
              customerInfo={customerInfo}
              onSuccess={(result) => handlePurchaseSuccess(showCustomerForm, result)}
              onError={(error) => console.error('Payment error:', error)}
              onCancel={() => setShowCustomerForm(null)}
            />
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="stats-section">
        <h2 className="section-title">📊 YOUR PROGRESS</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{purchasedBooks.size}</div>
            <div className="stat-label">Books Owned</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{ebooks.length}</div>
            <div className="stat-label">Total Available</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {Math.round((purchasedBooks.size / ebooks.length) * 100)}%
            </div>
            <div className="stat-label">Collection Complete</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ebooks;
