import React from 'react';
import CustomScrollbar from './CustomScrollbar';

const LightGreyGlassmorphicScrollbarDemo = () => {
  const longContent = Array.from({ length: 80 }, (_, i) => (
    <div key={i} className="p-4 border-b border-gray-200 last:border-0">
      <h3 className="font-semibold text-lg text-gray-800 flex items-center">
        <span className="inline-block w-3 h-3 bg-gray-300 rounded-full mr-2 backdrop-blur-sm"></span>
        Light Grey Glass Item {i + 1}
      </h3>
      <p className="text-gray-600 mt-1">Experience the light grey glass effect with transparency and blur as you scroll through this content.</p>
      <div className="mt-2 flex space-x-2">
        <span className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full backdrop-blur-sm">Light Grey</span>
        <span className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full backdrop-blur-sm">Glass</span>
        <span className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full backdrop-blur-sm">Effect</span>
      </div>
    </div>
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Light Grey Glassmorphic Scrollbar</h1>
          <p className="text-gray-600 text-xl">Experience the beautiful light grey glass effect with transparency and blur</p>
          <div className="mt-4 w-24 h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-auto rounded-full backdrop-blur-sm"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Standard Light Grey Glassmorphic Scrollbar */}
          <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg shadow-white/30">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <span className="mr-2">✨</span> Standard Light Grey Glass Effect
            </h2>
            <div className="bg-white/20 p-4 rounded-lg border border-white/30 backdrop-blur-sm">
              <h3 className="font-medium text-gray-700 mb-2">Vertical Scroll</h3>
              <CustomScrollbar className="h-72">
                <div className="text-gray-700">
                  {longContent.slice(0, 30)}
                </div>
              </CustomScrollbar>
            </div>
          </div>
          
          {/* Special Light Grey Glass Theme */}
          <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg shadow-white/30">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <span className="mr-2">✨</span> Special Light Grey Glass Theme
            </h2>
            <div className="bg-white/20 p-4 rounded-lg border border-white/30 backdrop-blur-sm">
              <h3 className="font-medium text-gray-700 mb-2">Vertical Scroll (Light Grey Glass)</h3>
              <CustomScrollbar theme="lightGreyGlass" className="h-72">
                <div className="text-gray-700">
                  {longContent.slice(30, 60).map((item, i) => 
                    React.cloneElement(item, { 
                      key: i, 
                      className: "p-4 border-b border-gray-200 last:border-0 text-gray-700" 
                    })
                  )}
                </div>
              </CustomScrollbar>
            </div>
          </div>
        </div>
        
        {/* Full-width light grey glass container */}
        <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg shadow-white/30 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <span className="mr-2">✨</span> Horizontal & Vertical Scrolling
          </h2>
          <p className="text-gray-600 mb-4">This container demonstrates both horizontal and vertical light grey glassmorphic scrollbars.</p>
          <CustomScrollbar horizontal={true} vertical={true} theme="lightGreyGlass" className="h-64">
            <div className="min-w-[1200px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white/30 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Priority</th>
                  </tr>
                </thead>
                <tbody className="bg-white/20 backdrop-blur-sm divide-y divide-gray-200">
                  {Array.from({ length: 50 }, (_, i) => (
                    <tr key={i} className="hover:bg-white/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">#{i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Light Grey Glass Item {i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${i % 3 === 0 ? 'bg-green-100/50 text-green-800' : 
                            i % 3 === 1 ? 'bg-yellow-100/50 text-yellow-800' : 
                            'bg-red-100/50 text-red-800'}`}>
                          {i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'Pending' : 'Complete'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2023-0{i + 1}-15</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Detailed information about light grey glass effect item {i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Category {i % 5 + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${i % 4 === 0 ? 'bg-purple-100/50 text-purple-800' : 
                            i % 4 === 1 ? 'bg-blue-100/50 text-blue-800' : 
                            i % 4 === 2 ? 'bg-cyan-100/50 text-cyan-800' :
                            'bg-pink-100/50 text-pink-800'}`}>
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
        
        {/* Light grey glassmorphic pattern container */}
        <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-lg shadow-white/30">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 flex justify-center items-center">
            <span className="mr-3">✨</span> Light Grey Glassmorphic Pattern Demo <span className="ml-3">✨</span>
          </h2>
          <p className="text-center text-gray-600 mb-6">Scroll to see the beautiful light grey glass effect in action</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white/30 backdrop-blur-sm p-6 rounded-xl border border-white/40">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Section {item}</h3>
                <CustomScrollbar className="h-40" theme="lightGreyGlass">
                  <div className="space-y-4 text-gray-700">
                    {Array.from({ length: 15 }, (_, i) => (
                      <div key={i} className="p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-gray-300 rounded-full mr-2 backdrop-blur-sm"></div>
                          <span>Light Grey Glass Content {i + 1}</span>
                        </div>
                        <p className="text-sm mt-1 text-gray-500">This content has the light grey glass effect</p>
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

export default LightGreyGlassmorphicScrollbarDemo;