import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    
    const { login, register, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redirect to home if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password) {
            setError('请输入用户名和密码');
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }

        let result;
        if (isLogin) {
            result = login(username, password);
        } else {
            result = register(username, password);
        }

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="auth-page container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>{isLogin ? '欢迎回来' : '创建新账号'}</h2>
                    <p>{isLogin ? '登录以继续您的阅读之旅' : '注册以开始您的阅读之旅'}</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>用户名</label>
                        <input
                            type="text"
                            className="input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="请输入用户名"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>密码</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入密码"
                        />
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label>确认密码</label>
                            <input
                                type="password"
                                className="input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="请再次输入密码"
                            />
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary auth-submit">
                        {isLogin ? '登录' : '注册'}
                    </button>
                </form>

                <div className="auth-footer">
                    <span>{isLogin ? '还没有账号？' : '已有账号？'}</span>
                    <button type="button" className="btn-link" onClick={toggleMode}>
                        {isLogin ? '立即注册' : '返回登录'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AuthPage;
