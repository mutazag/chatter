import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Chatter</h1>
        <p className="auth-subtitle">Sign in to your account</p>
        <LoginForm onSuccess={() => navigate('/chat')} />
        <p className="auth-switch">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="auth-link">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
