import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MovieFeed from './components/MovieFeed';
import Profile from './components/Profile';
import Navigation from './components/Navigation';
import { ColorModeProvider } from './contexts/ColorModeContext';

const App: React.FC = () => {
  return (
    <ColorModeProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<MovieFeed />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
          <Navigation />
        </div>
      </Router>
    </ColorModeProvider>
  );
};

export default App;
