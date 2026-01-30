import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './store';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Fridge from './pages/Fridge';
import Recipes from './pages/Recipes';
import Cooking from './pages/Cooking';
import MealPlanner from './pages/MealPlanner';

const App = () => {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="fridge" element={<Fridge />} />
            <Route path="recipes" element={<Recipes />} />
            <Route path="cooking/:id" element={<Cooking />} />
            <Route path="plan" element={<MealPlanner />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  );
};

export default App;