// src/router/AppRouter.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Pokedex from '../pokedex/pokedex';
import GuessPokemonScreen from '../guess/GuessPokemonScreen';

const AppRouter: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Pokedex />} />
                <Route path="/guess" element={<GuessPokemonScreen />} />
                {/* Adicione outras rotas aqui, se necessário */}
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;