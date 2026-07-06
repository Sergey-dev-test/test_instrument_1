// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Layout
import Navbar from './components/layout/Navbar';

// Pages
import Dashboard from './pages/dashboard/Dashboard';
import ConnectionList from './pages/connections/ConnectionList';
import ConnectionForm from './pages/connections/ConnectionForm';
import TableList from './pages/tables/TableList';
import TableDetail from './pages/tables/TableDetail';
import ExcelUpload from './pages/excel/ExcelUpload';
import SQLGenerator from './pages/sql/SQLGenerator';
import MethodList from './pages/methods/MethodList';
import MethodForm from './pages/methods/MethodForm';
import AIChat from './pages/ai/AIChat';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />

          <main className="pt-6 pb-12">
            <Routes>
              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/connections" element={<ProtectedRoute><ConnectionList /></ProtectedRoute>} />
              <Route path="/connections/:id?" element={<ProtectedRoute><ConnectionForm /></ProtectedRoute>} />
              <Route path="/tables" element={<ProtectedRoute><TableList /></ProtectedRoute>} />
              <Route path="/tables/:tableId" element={<ProtectedRoute><TableDetail /></ProtectedRoute>} />
              <Route path="/excel" element={<ProtectedRoute><ExcelUpload /></ProtectedRoute>} />
              <Route path="/sql" element={<ProtectedRoute><SQLGenerator /></ProtectedRoute>} />
              <Route path="/methods" element={<ProtectedRoute><MethodList /></ProtectedRoute>} />
              <Route path="/methods/new" element={<ProtectedRoute><MethodForm /></ProtectedRoute>} />
              <Route path="/tables/:tableId/methods" element={<ProtectedRoute><MethodList /></ProtectedRoute>} />
              <Route path="/tables/:tableId/methods/:methodId?" element={<ProtectedRoute><MethodForm /></ProtectedRoute>} />
              <Route path="/ai" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;