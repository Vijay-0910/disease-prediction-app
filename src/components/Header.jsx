import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Header.css';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="main-header">
      <div className="header-container">
        <div className="logo">
          <h1>AI Health Predict</h1>
        </div>

        <nav className="header-nav">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-email">{user?.email || user?.mobile || user?.identifier}</span>
            </div>
          </div>

          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
