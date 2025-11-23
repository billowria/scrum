import React from 'react';
import CustomScrollbar from './CustomScrollbar';

const ThinGreyScrollbarDemo = () => {
  const longContent = Array.from({ length: 80 }, (_, i) => (
    <div key={i} className="p-4 border-b border-gray-200 last:border-0">
      <h3 className="font-semibold text-lg text-gray-800 flex items-center">
        <span className="inline-block w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
        Thin Grey Item {i + 1}
      </h3>
      <p className="text-gray-600 mt-1">Experience the thin grey scrollbar with quick fade effect as you scroll through this content.</p>
      <div className="mt-2 flex space-x-2">
        <span className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full">Thin</span>
        <span className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full">Grey</span>
        <span className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-full">Fade</span>
      </div>
    </div>
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Thin Grey Scrollbar</h1>
          <p className="text-gray-600 text-xl">Experience the thin grey scrollbar with quick fade effect</p>
          <div className="mt-4 w-24 h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Standard Thin Grey Scrollbar */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <span className="mr-2">✨</span> Standard Thin Grey Effect
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-700 mb-2">Vertical Scroll</h3>
              <CustomScrollbar className="h-72">
                <div className="text-gray-700">
                  {longContent.slice(0, 30)}
                </div>
              </CustomScrollbar>
            </div>
          </div>
          
          {/* Special Thin Grey Theme */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <span className="mr-2">✨</span> Special Thin Grey Theme
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-700 mb-2">Vertical Scroll (Thin Grey)</h3>
              <CustomScrollbar theme="thinGrey" className="h-72">
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
        
        {/* Full-width thin grey container */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <span className="mr-2">✨</span> Horizontal & Vertical Scrolling
          </h2>
          <p className="text-gray-600 mb-4">This container demonstrates both horizontal and vertical thin grey scrollbars.</p>
          <CustomScrollbar horizontal={true} vertical={true} theme="thinGrey" className="h-64">
            <div className="min-w-[1200px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
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
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.from({ length: 50 }, (_, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">#{i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Thin Grey Item {i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${i % 3 === 0 ? 'bg-green-100 text-green-800' : 
                            i % 3 === 1 ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'Pending' : 'Complete'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2023-0{i + 1}-15</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Detailed information about thin grey effect item {i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Category {i % 5 + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${i % 4 === 0 ? 'bg-purple-100 text-purple-800' : 
                            i % 4 === 1 ? 'bg-blue-100 text-blue-800' : 
                            i % 4 === 2 ? 'bg-cyan-100 text-cyan-800' :
                            'bg-pink-100 text-pink-800'}`}>
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
        
        {/* Thin grey pattern container */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 flex justify-center items-center">
            <span className="mr-3">✨</span> Thin Grey Pattern Demo <span className="ml-3">✨</span>
          </h2>
          <p className="text-center text-gray-600 mb-6">Scroll to see the thin grey effect with quick fade in action</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Section {item}</h3>
                <CustomScrollbar className="h-40" theme="thinGrey">
                  <div className="space-y-4 text-gray-700">
                    {Array.from({ length: 15 }, (_, i) => (
                      <div key={i} className="p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                          <span>Thin Grey Content {i + 1}</span>
                        </div>
                        <p className="text-sm mt-1 text-gray-500">This content has the thin grey scrollbar effect</p>
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

export default ThinGreyScrollbarDemo;