import React, { useState, useEffect } from "react";

const Carousel = ({ ebooks, onPurchase, purchasedBooks }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ebooks.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [ebooks.length, isAutoPlaying]);

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex(prev => prev === 0 ? ebooks.length - 1 : prev - 1);
    setIsAutoPlaying(false); // Stop auto-play when user interacts
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % ebooks.length);
    setIsAutoPlaying(false); // Stop auto-play when user interacts
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  // Touch handling for mobile swipe
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    }
    if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === ' ') {
        e.preventDefault();
        setIsAutoPlaying(!isAutoPlaying);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAutoPlaying]);

  if (!ebooks || ebooks.length === 0) {
    return (
      <div className="carousel-empty">
        <p>No books available at the moment.</p>
      </div>
    );
  }

  const currentBook = ebooks[currentIndex];

  return (
    <div className="carousel-container">
      <div 
        className="carousel"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Previous Button */}
        <button 
          className="carousel-btn left" 
          onClick={goToPrevious}
          aria-label="Previous book"
        >
          ‹
        </button>

        {/* Carousel Track */}
        <div className="carousel-track">
          <div 
            className="carousel-slides"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {ebooks.map((book, index) => (
              <div 
                key={book.id} 
                className={`carousel-item ${index === currentIndex ? 'active' : ''}`}
              >
                <div className="ebook-box">
                  {/* Book Cover */}
                  <div className="ebook-cover-container">
                    <img 
                      src={book.cover} 
                      alt={book.title}
                      className="ebook-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/covers/placeholder.jpg';
                        console.warn(`Failed to load cover for: ${book.title}`);
                      }}
                    />
                    {purchasedBooks.has(book.id) && (
                      <div className="owned-badge">✅</div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="ebook-info">
                    <h3 className="ebook-title">{book.title}</h3>
                    <p className="ebook-author">by {book.author}</p>
                    <p className="ebook-description">{book.description}</p>
                    
                    {/* Book Stats */}
                    <div className="ebook-stats">
                      <span className="ebook-rating">⭐ {book.rating}</span>
                      <span className="ebook-pages">📖 {book.pages}p</span>
                      <span className="ebook-category">🏷️ {book.category}</span>
                    </div>

                    {/* Price and Action */}
                    <div className="ebook-actions">
                      <span className="ebook-price">{book.price}</span>
                      <button 
                        className="ebook-btn"
                        onClick={() => onPurchase(book.id)}
                        disabled={purchasedBooks.has(book.id)}
                      >
                        {purchasedBooks.has(book.id) ? 'Owned' : 'Buy Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Button */}
        <button 
          className="carousel-btn right" 
          onClick={goToNext}
          aria-label="Next book"
        >
          ›
        </button>
      </div>

      {/* Carousel Indicators */}
      <div className="carousel-indicators">
        {ebooks.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Carousel Controls */}
      <div className="carousel-controls">
        <button 
          className="control-btn"
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
        >
          {isAutoPlaying ? '⏸️' : '▶️'}
        </button>
        <span className="slide-counter">
          {currentIndex + 1} / {ebooks.length}
        </span>
      </div>

      {/* Book Preview (Optional) */}
      <div className="book-preview">
        <p className="preview-text">
          <em>"{currentBook.preview}"</em>
        </p>
      </div>
    </div>
  );
};

export default Carousel;