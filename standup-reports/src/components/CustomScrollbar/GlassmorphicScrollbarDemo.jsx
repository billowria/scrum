import React from 'react';
import CustomScrollbar from './CustomScrollbar';

const GlassmorphicScrollbarDemo = () => {
  const longContent = Array.from({ length: 80 }, (_, i) => (
    <div key={i} className="p-4 border-b border-white/20 last:border-0">
      <h3 className="font-semibold text-lg text-white flex items-center">
        <span className="inline-block w-3 h-3 bg-white/30 rounded-full mr-2 backdrop-blur-sm"></span>
        Glass Item {i + 1}
      </h3>
      <p className="text-gray-300 mt-1">Experience the beautiful glass-like effect with transparency and blur as you scroll through this content.</p>
      <div className="mt-2 flex space-x-2">
        <span className="inline-block bg-white/20 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">Glass</span>
        <span className="inline-block bg-white/20 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">Effect</span>
        <span className="inline-block bg-white/20 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">Blur</span>
      </div>
    </div>
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Glassmorphic Scrollbar</h1>
          <p className="text-gray-300 text-xl">Experience the beautiful glass-like effect with transparency and blur</p>
          <div className="mt-4 w-24 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto rounded-full backdrop-blur-sm"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Standard Glassmorphic Scrollbar */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg shadow-white/10">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
              <span className="mr-2">✨</span> Standard Glass Effect
            </h2>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10 backdrop-blur-sm">
              <h3 className="font-medium text-white mb-2">Vertical Scroll</h3>
              <CustomScrollbar className="h-72">
                <div className="text-gray-200">
                  {longContent.slice(0, 30)}
                </div>
              </CustomScrollbar>
            </div>
          </div>
          
          {/* Special Glass Theme */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg shadow-white/10">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
              <span className="mr-2">✨</span> Special Glass Theme
            </h2>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10 backdrop-blur-sm">
              <h3 className="font-medium text-white mb-2">Vertical Scroll (Glass)</h3>
              <CustomScrollbar theme="glass" className="h-72">
                <div className="text-gray-200">
                  {longContent.slice(30, 60).map((item, i) => 
                    React.cloneElement(item, { 
                      key: i, 
                      className: "p-4 border-b border-white/20 last:border-0 text-gray-200" 
                    })
                  )}
                </div>
              </CustomScrollbar>
            </div>
          </div>
        </div>
        
        {/* Full-width glass container */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg shadow-white/10 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
            <span className="mr-2">✨</span> Horizontal & Vertical Scrolling
          </h2>
          <p className="text-gray-300 mb-4">This container demonstrates both horizontal and vertical glassmorphic scrollbars.</p>
          <CustomScrollbar horizontal={true} vertical={true} theme="glass" className="h-64">
            <div className="min-w-[1200px]">
              <table className="min-w-full divide-y divide-white/20">
                <thead className="bg-white/10 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Priority</th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 backdrop-blur-sm divide-y divide-white/10">
                  {Array.from({ length: 50 }, (_, i) => (
                    <tr key={i} className="hover:bg-white/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">#{i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">Glass Item {i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${i % 3 === 0 ? 'bg-green-500/30 text-green-300' : 
                            i % 3 === 1 ? 'bg-yellow-500/30 text-yellow-300' : 
                            'bg-red-500/30 text-red-300'}`}>
                          {i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'Pending' : 'Complete'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">2023-0{i + 1}-15</td>
                      <td className="px-6 py-4 text-sm text-gray-300">Detailed information about glass effect item {i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Category {i % 5 + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${i % 4 === 0 ? 'bg-purple-500/30 text-purple-300' : 
                            i % 4 === 1 ? 'bg-blue-500/30 text-blue-300' : 
                            i % 4 === 2 ? 'bg-cyan-500/30 text-cyan-300' :
                            'bg-pink-500/30 text-pink-300'}`}>
                          {i % 4 === 0 ? 'High' : i % 4 === 1 ? 'Medium' : i % 4 === 2 ? 'Low' : 'Critical'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CustomScrollbar>
        </div>
        
        {/* Glassmorphic pattern container */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-lg shadow-white/5">
          <h2 className="text-2xl font-bold mb-6 text-center text-white flex justify-center items-center">
            <span className="mr-3">✨</span> Glassmorphic Pattern Demo <span className="ml-3">✨</span>
          </h2>
          <p className="text-center text-gray-300 mb-6">Scroll to see the beautiful glass-like effect in action</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-3">Section {item}</h3>
                <CustomScrollbar className="h-40" theme="glass">
                  <div className="space-y-4 text-gray-300">
                    {Array.from({ length: 15 }, (_, i) => (
                      <div key={i} className="p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-white/40 rounded-full mr-2 backdrop-blur-sm"></div>
                          <span>Glass Content {i + 1}</span>
                        </div>
                        <p className="text-sm mt-1 text-gray-400">This content has the beautiful glass effect</p>
                      </div>
                    ))}
                  </div>
                </CustomScrollbar>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlassmorphicScrollbarDemo;