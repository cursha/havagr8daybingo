import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Legacy OIDC callback route — kept as a safety redirect in case bookmarks or
 * old links point here. Our current auth flow uses email/password, so we just
 * send the user to the login page.
 */
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
    </div>
  );
};

export default AuthCallback;