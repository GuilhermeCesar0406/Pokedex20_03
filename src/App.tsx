import React from 'react';
import logo from './logo.svg';
import Pokedex from './pokedex/pokedex';
import GuessPokemonScreen from './guess/GuessPokemonScreen';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Pokedex />} />
        <Route path="/guess" element={<GuessPokemonScreen />} />
        {/* Você pode adicionar outras rotas aqui, se necessário */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;