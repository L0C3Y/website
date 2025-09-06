import React, { useState } from "react";
import EbookCard from "./EbookCard";
import "../styles/carousel.css";

const Carousel = ({ ebooks }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? ebooks.length - 1 : prev - 1
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev === ebooks.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="carousel">
      <button className="carousel-btn left" onClick={prevSlide}>
        ‹
      </button>

      <div className="carousel-track">
        {ebooks.map((ebook, index) => (
          <div
            key={ebook.id}
            className={`carousel-item ${
              index === currentIndex ? "active" : ""
            }`}
          >
            <EbookCard ebook={ebook} />
          </div>
        ))}
      </div>

      <button className="carousel-btn right" onClick={nextSlide}>
        ›
      </button>
    </div>
  );
};

export default Carousel;