import React from 'react';
import CustomScrollbar from '../components/CustomScrollbar';
import './GlassScrollbarDemo.css';

const GlassScrollbarDemo = () => {
  const longContent = Array.from({ length: 100 }, (_, i) => (
    <div key={i} className="p-4 border-b border-gray-200 last:border-0">
      <h3 className="font-semibold text-lg">Glassmorphic Item {i + 1}</h3>
      <p className="text-gray-600 mt-1">Beautiful glass effect scrollbar with transparency, blur, and subtle lighting effects.</p>
      <div className="mt-2 flex space-x-2">
        <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">Tag {i + 1}</span>
        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Glass</span>
        <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">Effect</span>
      </div>
    </div>
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Glassmorphic Scrollbar</h1>
        <p className="text-center text-gray-600 mb-8">Experience the beautiful glass-like effect with transparency and blur</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Light Glassmorphic */}
          <div className="glass p-6 rounded-2xl shadow-lg border border-white/20 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4 text-white">Light Glass Effect</h2>
            <div className="bg-white/30 p-4 rounded-lg">
              <h3 className="font-medium text-white mb-2">Vertical Scroll</h3>
              <CustomScrollbar className="h-64">
                <div className="text-gray-800">
                  {longContent.slice(0, 30)}
                </div>
              </CustomScrollbar>
            </div>
          </div>
          
          {/* Dark Glassmorphic */}
          <div className="glass-dark p-6 rounded-2xl shadow-lg border border-white/10 backdrop-blur-sm bg-gray-800/30">
            <h2 className="text-xl font-semibold mb-4 text-white">Dark Glass Effect</h2>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h3 className="font-medium text-white mb-2">Vertical Scroll</h3>
              <CustomScrollbar theme="dark" className="h-64">
                <div className="text-white">
                  {longContent.slice(30, 60).map((item, i) => 
                    React.cloneElement(item, { 
                      key: i, 
                      className: "p-4 border-b border-gray-600 last:border-0 text-white" 
                    })
                  )}
                </div>
              </CustomScrollbar>
            </div>
          </div>
        </div>
        
        {/* Full-width glassmorphic container */}
        <div className="mt-8 glass p-6 rounded-2xl shadow-lg border border-white/20 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-4 text-white">Full Width Glass Container</h2>
          <p className="text-white mb-4">This container demonstrates the glassmorphic effect with the custom scrollbar.</p>
          <CustomScrollbar horizontal={true} vertical={true} className="h-48">
            <div className="min-w-[1200px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white/10 divide-y divide-gray-200">
                  {Array.from({ length: 50 }, (_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">#{i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">Item {i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">2023-0{i + 1}-15</td>
                      <td className="px-6 py-4 text-sm text-white">Detailed information about item {i + 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CustomScrollbar>
        </div>
      </div>
    </div>
  );
};

export default GlassScrollbarDemo;