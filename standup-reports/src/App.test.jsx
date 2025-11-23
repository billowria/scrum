import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LightningBoltScrollbarDemo from './components/CustomScrollbar/LightningBoltScrollbarDemo';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="bg-gray-800 p-4">
          <div className="max-w-7xl mx-auto">
            <Link to="/" className="text-white text-lg font-semibold mr-6">Home</Link>
            <Link to="/lightning-demo" className="text-cyan-300 hover:text-cyan-100">Lightning Scroll Demo</Link>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={
            <div className="p-8 text-center">
              <h1 className="text-3xl font-bold text-white mb-4">Custom Scrollbar Demo</h1>
              <p className="text-gray-300 mb-6">Check out the lightning bolt scrollbar demo</p>
              <Link 
                to="/lightning-demo" 
                className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                View Lightning Demo
              </Link>
            </div>
          } />
          <Route path="/lightning-demo" element={<LightningBoltScrollbarDemo />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;