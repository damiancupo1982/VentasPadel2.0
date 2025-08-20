import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Sales from './pages/Sales';
import Courts from './pages/Courts';
import Dashboard from './pages/Dashboard';
import CashRegister from './pages/CashRegister';
import CurrentTurn from './pages/CurrentTurn';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Movements from './pages/Movements';
import Transactions from './pages/Transactions';
import Carnets from './pages/Carnets';
import CourtSchedule from './pages/CourtSchedule';

function App() {
  const { refreshData, isAdmin } = useStore();
  
  useEffect(() => {
    refreshData();
  }, []);

  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Sales />} />
            <Route 
              path="courts" 
              element={
                <ErrorBoundary fallback={
                  <div className="p-8 text-center">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Error en Gestión de Canchas</h2>
                    <p className="text-gray-600">Ha ocurrido un error al cargar la gestión de canchas.</p>
                  </div>
                }>
                  <Courts />
                </ErrorBoundary>
              } 
            />
            <Route 
              path="dashboard" 
              element={isAdmin ? <Dashboard /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="arqueo" 
              element={isAdmin ? <CashRegister /> : <Navigate to="/" replace />} 
            />
            <Route path="turno-actual" element={<CurrentTurn />} />
            <Route path="carnets" element={<Carnets />} />
                       <Route 
              path="products" 
              element={isAdmin ? <Products /> : <Navigate to="/" replace />} 
            />
            <Route path="stock" element={isAdmin ? <Stock /> : <Navigate to="/" replace />} />
            <Route path="movements" element={isAdmin ? <Movements /> : <Navigate to="/" replace />} />
            <Route path="transactions" element={isAdmin ? <Transactions /> : <Navigate to="/" replace />} />
            <Route path="agenda" element={<CourtSchedule />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;