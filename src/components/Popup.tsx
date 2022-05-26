import React from "react";

const Popup = () => {
  return (
    <div style={{ width: "300px" }}>
      <JSONOptions />
    </div>
  );
};

export default Popup;

/* This example requires Tailwind CSS v2.0+ */
const items = [
  { id: 1, title: "Item 1" },
  { id: 2, title: "Item 2" },
  { id: 3, title: "Item 3" },
];

function JSONOptions() {
  return (
    <ul className="divide-y divide-gray-200">
      {items.map((item) => (
        <li key={item.id} className="py-4">
          {item.title}
        </li>
      ))}
    </ul>
  );
}
