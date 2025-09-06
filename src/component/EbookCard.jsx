import React from "react";
import "../styles/cards.css";

const EbookCard = ({ ebook }) => {
  return (
    <div className="ebook-box">
      <img
        src={ebook.cover}
        alt={ebook.title}
        className="ebook-cover"
      />
      <h3>{ebook.title}</h3>
      <p>{ebook.description}</p>
      <button className="ebook-btn">Get Now</button>
    </div>
  );
};

export default EbookCard;