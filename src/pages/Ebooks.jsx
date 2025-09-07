import React, { useState } from "react";
import Carousel from "../component/Carousel";
import "../styles/app.css";

const Ebooks = () => {
  const [purchasedBooks, setPurchasedBooks] = useState(new Set());

  // 🔥 Premium Ebooks Collection - High-Value Digital Assets
  const ebooks = [
    {
      id: 1,
      title: "The Elite Mind Forge",
      description: "Transform your consciousness with battle-tested strategies used by Fortune 500 CEOs and military leaders.",
      cover: "/covers/elite-mind.jpg",
      price: "$297",
      originalPrice: "$497",
      pages: 384,
      rating: 4.9,
      category: "Executive Psychology",
      author: "Marcus Steel",
      preview: "Discover the 7 mental frameworks that separate champions from the masses...",
      bonus: "Includes 3-hour audio masterclass + 30-day action plan",
      testimonial: "This changed my entire approach to leadership. ROI: 10x in first quarter.",
      level: "MASTERMIND",
      exclusivity: "Limited to 500 copies"
    },
    {
      id: 2,
      title: "Digital Empire Blueprint",
      description: "The complete system for building 7-figure online businesses from zero to empire status.",
      cover: "/covers/digital-empire.jpg",
      price: "$497",
      originalPrice: "$997",
      pages: 456,
      rating: 4.8,
      category: "Business Strategy",
      author: "Elena Vanguard",
      preview: "Revealed: The 90-day formula that built my $10M digital empire...",
      bonus: "Private community access + Weekly Q&A calls for 6 months",
      testimonial: "Generated $250K in first 90 days following this system.",
      level: "ELITE",
      exclusivity: "VIP Access Only"
    },
    {
      id: 3,
      title: "Influence Mastery Protocol",
      description: "Advanced persuasion psychology and influence tactics for modern leaders and entrepreneurs.",
      cover: "/covers/influence-mastery.jpg",
      price: "$397",
      originalPrice: "$697",
      pages: 342,
      rating: 4.9,
      category: "Influence Psychology",
      author: "Dr. Alex Raven",
      preview: "The ethical influence framework used by world leaders and top negotiators...",
      bonus: "25 influence scripts + Video training series",
      testimonial: "Closed 3 major deals in first week using these techniques.",
      level: "PROFESSIONAL",
      exclusivity: "Professional Edition"
    },
    {
      id: 4,
      title: "Wealth Consciousness Code",
      description: "Reprogram your money mindset and unlock the millionaire's mental operating system.",
      cover: "/covers/wealth-code.jpg",
      price: "$247",
      originalPrice: "$447",
      pages: 298,
      rating: 4.7,
      category: "Wealth Psychology",
      author: "Victoria Gold",
      preview: "The hidden beliefs that keep 99% of people broke and how to rewire them...",
      bonus: "21-day wealth meditation series + Money affirmation deck",
      testimonial: "Doubled my income within 6 months of applying these principles.",
      level: "PREMIUM",
      exclusivity: "First Edition"
    },
    {
      id: 5,
      title: "Peak Performance Arsenal",
      description: "The ultimate collection of biohacking, productivity, and performance optimization strategies.",
      cover: "/covers/peak-performance.jpg",
      price: "$347",
      originalPrice: "$597",
      pages: 412,
      rating: 4.8,
      category: "Performance Optimization",
      author: "Commander Phoenix",
      preview: "Military-grade performance protocols for civilian elite achievement...",
      bonus: "Performance tracking app + Personalized optimization plan",
      testimonial: "Increased productivity 300% while working half the hours.",
      level: "TACTICAL",
      exclusivity: "Tactical Edition"
    },
    {
      id: 6,
      title: "Networking Kingdom Secrets",
      description: "Build powerful connections and create an unstoppable network of influence and opportunity.",
      cover: "/covers/networking-kingdom.jpg",
      price: "$197",
      originalPrice: "$397",
      pages: 267,
      rating: 4.6,
      category: "Relationship Capital",
      author: "Alexander Network",
      preview: "The insider's guide to building relationships with industry titans...",
      bonus: "Contact management system + 50 conversation starters",
      testimonial: "Connected with 5 billionaires using these exact strategies.",
      level: "STRATEGIC",
      exclusivity: "Insider Access"
    }
  ];

  const handlePurchase = (bookId) => {
    setPurchasedBooks(prev => new Set([...prev, bookId]));
    
    const book = ebooks.find(b => b.id === bookId);
    console.log(`Processing premium purchase: ${book.title} for ${book.price}`);
    
    // Premium purchase simulation
    alert(`🏆 PREMIUM ACCESS GRANTED!\n\n"${book.title}" added to your Elite Library.\n\nCheck your email for:\n✅ Instant download link\n✅ Bonus materials\n✅ Exclusive access codes\n\nWelcome to the inner circle! 🔥`);
  };

  const featuredBook = ebooks[0]; // Premium featured book

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

  return (
    <div className="ebooks-page premium-collection">
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

      {/* Premium Featured Book Section */}
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
                <span className="original-price">{featuredBook.originalPrice}</span>
                <span className="current-price">{featuredBook.price}</span>
                <span className="savings">Save ${parseInt(featuredBook.originalPrice.slice(1)) - parseInt(featuredBook.price.slice(1))}</span>
              </div>
              <div className="urgency-text">⚡ Limited Time: 40% OFF</div>
            </div>
            
            <div className="premium-actions">
              <button 
                className="premium-btn flagship-btn"
                onClick={() => handlePurchase(featuredBook.id)}
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

      {/* Premium Collection Carousel */}
      <div className="carousel-section premium-carousel-section">
        <div className="section-header">
          <h2 className="section-title">👑 COMPLETE ELITE COLLECTION</h2>
          <p className="section-subtitle">Transform every area of your life with these premium resources</p>
        </div>
        <Carousel 
          ebooks={ebooks} 
          onPurchase={handlePurchase}
          purchasedBooks={purchasedBooks}
          isPremium={true}
        />
      </div>

      {/* Premium Categories */}
      <div className="categories-section premium-categories">
        <h2 className="section-title">🎯 ELITE SPECIALIZATIONS</h2>
        <div className="premium-category-grid">
          {[...new Set(ebooks.map(book => book.category))].map((category, index) => (
            <div key={category} className="premium-category-card">
              <div className="category-icon">
                {['🧠', '💼', '🎯', '💰', '⚡', '🤝'][index] || '🔥'}
              </div>
              <h3>{category}</h3>
              <p>Master the elite strategies</p>
            </div>
          ))}
        </div>
      </div>

      {/* Premium Stats & Social Proof */}
      <div className="social-proof-section">
        <h2 className="section-title">🏆 JOIN THE ELITE</h2>
        <div className="proof-grid">
          <div className="proof-card">
            <div className="proof-number">{ebooks.length}</div>
            <div className="proof-label">Premium Masterpieces</div>
          </div>
          <div className="proof-card">
            <div className="proof-number">{purchasedBooks.size}</div>
            <div className="proof-label">In Your Arsenal</div>
          </div>
          <div className="proof-card">
            <div className="proof-number">50M+</div>
            <div className="proof-label">Revenue Generated</div>
          </div>
          <div className="proof-card">
            <div className="proof-number">99.2%</div>
            <div className="proof-label">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Exclusive Access Section */}
      <div className="exclusive-access-section">
        <div className="access-container">
          <h2>🔐 EXCLUSIVE MEMBER BENEFITS</h2>
          <div className="benefits-grid">
            <div className="benefit-item">
              <span className="benefit-icon">⚡</span>
              <h4>Instant Access</h4>
              <p>Download immediately after purchase</p>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🎁</span>
              <h4>Premium Bonuses</h4>
              <p>Exclusive content worth $500+</p>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">👥</span>
              <h4>Elite Community</h4>
              <p>Connect with high achievers</p>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🔄</span>
              <h4>Lifetime Updates</h4>
              <p>Always get the latest versions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ebooks;