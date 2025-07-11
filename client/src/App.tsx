import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AlbumList } from './components/AlbumList';
import { AlbumPage } from './pages/AlbumPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<AlbumList />} />
          <Route path="/album/:albumId" element={<AlbumPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
