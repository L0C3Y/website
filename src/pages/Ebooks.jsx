import React from "react";
import Carousel from "../component/Carousel";

const Ebooks = () => {
  // ⚔️ For now mock data, later fetched from backend
  const ebooks = [
    {
      id: 1,
      title: "Mastering Shadows",
      description: "Learn to bend reality and control narratives.",
      cover: "/covers/shadows.jpg",
    },
    {
      id: 2,
      title: "The Mind Forge",
      description: "Reforging human thought into steel logic.",
      cover: "/covers/mindforge.jpg",
    },
    {
      id: 3,
      title: "War of Illusions",
      description: "Destroy false systems before they consume you.",
      cover: "/covers/illusions.jpg",
    },
  ];

  return (
    <div className="ebooks-page">
      <h2>Available eBooks</h2>
      <Carousel ebooks={ebooks} />
    </div>
  );
};

export default Ebooks;