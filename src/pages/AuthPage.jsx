import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

// 模式：login / register / forgot / resetPassword
function AuthPage() {
    const [searchParams] = useSearchParams();
    const oobCode = searchParams.get('oobCode');
    const queryMode = searchParams.get('mode');

    const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'resetPassword'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register, resetPassword, handleConfirmPasswordReset, isAuthenticated, isAdmin } = useAuth();
    const navigate = useNavigate();

    // 监听邮件链接重置密码模式
    useEffect(() => {
        if (queryMode === 'resetPassword' && oobCode) {
            setMode('resetPassword');
        }
    }, [queryMode, oobCode]);

    useEffect(() => {
        if (isAuthenticated) {
            if (isAdmin) {
                navigate('/admin');
            } else {
                navigate('/');
            }
        }
    }, [isAuthenticated, isAdmin, navigate]);

    const switchMode = (newMode) => {
        setMode(newMode);
        setError('');
        setSuccessMsg('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        // 1️⃣ 忘记密码模式（仅需输入邮箱发送重置链接）
        if (mode === 'forgot') {
            if (!email.trim()) {
                setError('请输入邮箱地址');
                return;
            }
            if (!email.includes('@')) {
                setError('请输入有效的邮箱地址');
                return;
            }
            setLoading(true);
            const result = await resetPassword(email.trim());
            setLoading(false);
            if (result.success) {
                setSuccessMsg('📧 重置密码邮件已发送！请查看您的收件箱（含垃圾邮件），点击邮件中的链接设置新密码。');
            } else {
                setError(result.error);
            }
            return;
        }

        // 2️⃣ 邮件链接设置新密码模式（点击邮件链接跳转后，要求输入两遍新密码）
        if (mode === 'resetPassword') {
            if (!password) {
                setError('请输入新密码');
                return;
            }
            if (password.length < 6) {
                setError('密码长度至少需要6位');
                return;
            }
            if (password !== confirmPassword) {
                setError('两次输入的新密码不一致');
                return;
            }
            if (!oobCode) {
                setError('重置链接无效或丢失验证码');
                return;
            }

            setLoading(true);
            const result = await handleConfirmPasswordReset(oobCode, password);
            setLoading(false);
            if (result.success) {
                setSuccessMsg('🎉 密码重置成功！即将为您跳转到登录界面...');
                setPassword('');
                setConfirmPassword('');
                setTimeout(() => {
                    switchMode('login');
                }, 2500);
            } else {
                setError(result.error);
            }
            return;
        }

        // 3️⃣ 登录 / 注册模式
        if (!email.trim()) {
            setError('请输入邮箱地址');
            return;
        }
        if (!email.includes('@')) {
            setError('请输入有效的邮箱地址');
            return;
        }
        if (!password) {
            setError('请输入密码');
            return;
        }

        if (mode === 'register') {
            if (password !== confirmPassword) {
                setError('两次输入的密码不一致');
                return;
            }
            if (password.length < 6) {
                setError('密码长度至少6位');
                return;
            }
        }

        setLoading(true);
        let result;
        if (mode === 'login') {
            result = await login(email.trim(), password);
        } else {
            result = await register(email.trim(), password, displayName.trim());
        }
        setLoading(false);

        if (result.success) {
            if (result.role === 'admin' || isAdmin) {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } else {
            setError(result.error);
        }
    };

    const titles = {
        login:         { h2: '欢迎回来 👋', sub: '登录以继续您的阅读之旅' },
        register:      { h2: '创建新账号 ✨', sub: '用邮箱注册，开始您的阅读之旅' },
        forgot:        { h2: '重置密码 🔑', sub: '输入您的注册邮箱，我们将向您发送重置链接' },
        resetPassword: { h2: '设置新密码 🔐', sub: '请输入您的新密码（须输入两遍以确认）' },
    };

    return (
        <div className="auth-page container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>{titles[mode].h2}</h2>
                    <p>{titles[mode].sub}</p>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {successMsg && <div className="auth-success">{successMsg}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    {/* 邮箱（重置新密码模式下不需要输入邮箱） */}
                    {mode !== 'resetPassword' && (
                        <div className="form-group">
                            <label>邮箱地址</label>
                            <input
                                type="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="请输入邮箱地址"
                                autoComplete="email"
                            />
                        </div>
                    )}

                    {/* 昵称（仅注册时显示） */}
                    {mode === 'register' && (
                        <div className="form-group">
                            <label>昵称 <span className="label-hint">（选填，默认取邮箱前缀）</span></label>
                            <input
                                type="text"
                                className="input"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="请输入您的昵称"
                                autoComplete="nickname"
                            />
                        </div>
                    )}

                    {/* 密码（申请重置邮件模式下隐藏） */}
                    {mode !== 'forgot' && (
                        <div className="form-group">
                            <label>
                                {mode === 'resetPassword' ? '新密码' : '密码'}
                                {mode === 'login' && (
                                    <button
                                        type="button"
                                        className="btn-link label-right"
                                        onClick={() => switchMode('forgot')}
                                    >
                                        忘记密码？
                                    </button>
                                )}
                            </label>
                            <input
                                type="password"
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={mode === 'login' ? '请输入密码' : '至少6位'}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            />
                        </div>
                    )}

                    {/* 确认密码（仅在注册和设置新密码模式下显示，需输入两遍密码） */}
                    {(mode === 'register' || mode === 'resetPassword') && (
                        <div className="form-group">
                            <label>{mode === 'resetPassword' ? '确认新密码' : '确认密码'}</label>
                            <input
                                type="password"
                                className="input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="请再次输入密码"
                                autoComplete="new-password"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary auth-submit"
                        disabled={loading}
                    >
                        {loading
                            ? '处理中...'
                            : mode === 'login' ? '登录'
                            : mode === 'register' ? '注册'
                            : mode === 'forgot' ? '发送重置邮件'
                            : '确认重置密码'}
                    </button>
                </form>

                {/* 底部切换区 */}
                <div className="auth-footer">
                    {mode === 'login' && <>
                        <span>还没有账号？</span>
                        <button type="button" className="btn-link" onClick={() => switchMode('register')}>
                            立即注册
                        </button>
                    </>}
                    {mode === 'register' && <>
                        <span>已有账号？</span>
                        <button type="button" className="btn-link" onClick={() => switchMode('login')}>
                            返回登录
                        </button>
                    </>}
                    {(mode === 'forgot' || mode === 'resetPassword') && (
                        <button type="button" className="btn-link" onClick={() => switchMode('login')}>
                            ← 返回登录
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuthPage;
