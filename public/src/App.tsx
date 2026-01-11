import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import PlaylistDetail from './pages/PlaylistDetail';
import AIChat from './pages/AIChat';
import { PlayerProvider } from './context/PlayerContext';
import { LibraryProvider } from './context/LibraryContext';

const App: React.FC = () => {
  return (
    <LibraryProvider>
      <PlayerProvider>
        <Router>
          <Routes>
            {/* AI Chat - Separate full-screen route */}
            <Route path="/ai-chat" element={<AIChat />} />
            
            {/* Main app with Layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="search" element={<Search />} />
              <Route path="library" element={<Library />} />
              <Route path="playlist/:id" element={<PlaylistDetail />} />
            </Route>
          </Routes>
        </Router>
      </PlayerProvider>
    </LibraryProvider>
  );
};

export default App;