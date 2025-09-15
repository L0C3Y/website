import React from "react";
import EnhancedCheckout from "../component/EnhancedCheckout";

const eBook = () => {
  return (
    <div>
      <h1>Buy eBook</h1>
      <EnhancedCheckout amount={199} />
    </div>
  );
};

export default eBook;
