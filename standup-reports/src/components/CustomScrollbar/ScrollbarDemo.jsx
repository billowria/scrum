import React from 'react';
import CustomScrollbar from './CustomScrollbar';

const ScrollbarDemo = () => {
  const content = Array.from({ length: 50 }, (_, i) => (
    <div key={i} className="p-4 border-b border-gray-200">
      <h3 className="font-semibold">List Item {i + 1}</h3>
      <p className="text-gray-600">This is a sample content for scrollbar demonstration. The custom glassmorphic scrollbar should be visible when scrolling through this content.</p>
    </div>
  ));

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Glassmorphic Scrollbar Demo</h2>
      <p className="mb-4 text-gray-600">This section demonstrates the custom glassmorphic scrollbar component. You can see the beautiful glass-like effect with subtle transparency and blur effects when scrolling.</p>

      <div className="border rounded-lg p-4 bg-white shadow-sm glass">
        <h3 className="font-semibold mb-2">Vertical Glassmorphic Scrollbar</h3>
        <CustomScrollbar className="h-64">
          <div>
            {content}
          </div>
        </CustomScrollbar>
      </div>

      <div className="mt-8 border rounded-lg p-4 bg-gray-800 text-white shadow-sm glass-dark">
        <h3 className="font-semibold mb-2">Glassmorphic Scrollbar on Dark Background</h3>
        <CustomScrollbar theme="dark" className="h-64">
          <div>
            {content.map((item, i) => React.cloneElement(item, { key: i, className: "p-4 border-b border-gray-600" }))}
          </div>
        </CustomScrollbar>
      </div>
    </div>
  );
};

export default ScrollbarDemo;