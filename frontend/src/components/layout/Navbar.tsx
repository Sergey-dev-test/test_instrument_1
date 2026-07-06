// src/components/layout/Navbar.tsx

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-xl font-bold">
              🏢 Instrument_v3
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="hover:text-indigo-200">
                  Главная
                </Link>
                <Link to="/connections" className="hover:text-indigo-200">
                  Подключения
                </Link>
                <Link to="/tables" className="hover:text-indigo-200">
                  Таблицы
                </Link>
                <Link to="/excel" className="hover:text-indigo-200">
                  Excel
                </Link>
                <Link to="/sql" className="hover:text-indigo-200">
                  SQL
                </Link>
                <Link to="/methods" className="hover:text-indigo-200">
                  Методики
                </Link>
                <Link to="/ai" className="hover:text-indigo-200">
                  AI
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm bg-indigo-700 hover:bg-indigo-800 rounded"
                >
                  Выход
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-indigo-200">
                  Вход
                </Link>
                <Link to="/register" className="hover:text-indigo-200">
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}