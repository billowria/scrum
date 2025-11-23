import React from 'react';
import CustomScrollbar from './CustomScrollbar';

const LightningBoltScrollbarDemo = () => {
  const longContent = Array.from({ length: 80 }, (_, i) => (
    <div key={i} className="p-4 border-b border-gray-200 last:border-0">
      <h3 className="font-semibold text-lg flex items-center">
        <span className="inline-block w-3 h-3 bg-cyan-400 rounded-full mr-2 animate-pulse"></span>
        Lightning Item {i + 1}
      </h3>
      <p className="text-gray-600 mt-1">Experience the electrifying cyan glow and lightning bolt effect as you scroll through this content.</p>
      <div className="mt-2 flex space-x-2">
        <span className="inline-block bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded-full">Lightning</span>
        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Cyan Glow</span>
        <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Effect</span>
      </div>
    </div>
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Lightning Bolt Scrollbar</h1>
          <p className="text-cyan-300 text-xl">Experience the electrifying cyan glow effect</p>
          <div className="mt-4 w-24 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Standard Lightning Bolt Scrollbar */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
            <h2 className="text-xl font-semibold mb-4 text-cyan-300 flex items-center">
              <span className="mr-2">⚡</span> Standard Lightning Effect
            </h2>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <h3 className="font-medium text-cyan-200 mb-2">Vertical Scroll</h3>
              <CustomScrollbar className="h-72">
                <div className="text-gray-200">
                  {longContent.slice(0, 30)}
                </div>
              </CustomScrollbar>
            </div>
          </div>
          
          {/* Special Lightning Theme */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
            <h2 className="text-xl font-semibold mb-4 text-cyan-300 flex items-center">
              <span className="mr-2">⚡</span> Special Lightning Theme
            </h2>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <h3 className="font-medium text-cyan-200 mb-2">Vertical Scroll (Lightning)</h3>
              <CustomScrollbar theme="lightning" className="h-72">
                <div className="text-gray-200">
                  {longContent.slice(30, 60).map((item, i) => 
                    React.cloneElement(item, { 
                      key: i, 
                      className: "p-4 border-b border-gray-700 last:border-0 text-gray-200" 
                    })
                  )}
                </div>
              </CustomScrollbar>
            </div>
          </div>
        </div>
        
        {/* Full-width lightning container */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 shadow-lg shadow-cyan-500/20 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-cyan-300 flex items-center">
            <span className="mr-2">⚡</span> Horizontal & Vertical Scrolling
          </h2>
          <p className="text-cyan-200 mb-4">This container demonstrates both horizontal and vertical lightning bolt scrollbars.</p>
          <CustomScrollbar horizontal={true} vertical={true} theme="lightning" className="h-64">
            <div className="min-w-[1200px]">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">Priority</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900/30 divide-y divide-gray-700">
                  {Array.from({ length: 50 }, (_, i) => (
                    <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-200">#{i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">Lightning Item {i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${i % 3 === 0 ? 'bg-green-500/30 text-green-300' : 
                            i % 3 === 1 ? 'bg-yellow-500/30 text-yellow-300' : 
                            'bg-red-500/30 text-red-300'}`}>
                          {i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'Pending' : 'Complete'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">2023-0{i + 1}-15</td>
                      <td className="px-6 py-4 text-sm text-gray-300">Detailed information about lightning bolt effect item {i + 1}</td>
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
        
        {/* Lightning bolt pattern container */}
        <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 backdrop-blur-sm rounded-2xl p-8 border border-cyan-400/40 shadow-lg shadow-cyan-500/10">
          <h2 className="text-2xl font-bold mb-6 text-center text-cyan-300 flex justify-center items-center">
            <span className="mr-3">⚡</span> Lightning Bolt Pattern Demo <span className="ml-3">⚡</span>
          </h2>
          <p className="text-center text-cyan-200 mb-6">Scroll to see the electrifying cyan glow effect in action</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-gray-800/40 p-6 rounded-xl border border-cyan-500/20">
                <h3 className="text-lg font-semibold text-cyan-300 mb-3">Section {item}</h3>
                <CustomScrollbar className="h-40" theme="lightning">
                  <div className="space-y-4 text-gray-300">
                    {Array.from({ length: 15 }, (_, i) => (
                      <div key={i} className="p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></div>
                          <span>Lightning Bolt Content {i + 1}</span>
                        </div>
                        <p className="text-sm mt-1 text-gray-400">This content has the electrifying cyan glow effect</p>
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

export default LightningBoltScrollbarDemo;