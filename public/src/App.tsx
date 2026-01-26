import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Library from "./pages/Library";
import PlaylistDetail from "./pages/PlaylistDetail";
import OfflineLibrary from "./pages/OfflineLibrary";
import AIChat from "./pages/AIChat";
import AuthScreen from "./pages/AuthScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import InstallPWA from "./components/InstallPWA"; // ✅ Import the install component
import { PlayerProvider } from "./context/PlayerContext";
import { LibraryProvider } from "./context/LibraryContext";
import { AuthProvider } from "./context/AuthContext";
import { LikeProvider } from "./context/LikeContext";
import { DownloadProvider } from "./context/DownloadContext";
import { HistoryProvider } from "./context/HistoryContext";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LikeProvider>
        <DownloadProvider>
          <LibraryProvider>
            <HistoryProvider>
              <PlayerProvider>
                <Router>
                  {/* ✅ Add InstallPWA here - it will show on all pages */}
                  <InstallPWA />

                  <Routes>
                    {/* Public: Auth screen */}
                    <Route path="/auth" element={<AuthScreen />} />

                    {/* Protected: AI Chat */}
                    <Route
                      path="/ai-chat"
                      element={
                        <ProtectedRoute>
                          <AIChat />
                        </ProtectedRoute>
                      }
                    />

                    {/* Protected: Main app with Layout */}
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Layout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Home />} />
                      <Route path="search" element={<Search />} />
                      <Route path="library" element={<Library />} />
                      <Route path="offline" element={<OfflineLibrary />} />
                      <Route path="playlist/:id" element={<PlaylistDetail />} />
                    </Route>
                  </Routes>
                </Router>
              </PlayerProvider>
            </HistoryProvider>
          </LibraryProvider>
        </DownloadProvider>
      </LikeProvider>
    </AuthProvider>
  );
};

export default App;
