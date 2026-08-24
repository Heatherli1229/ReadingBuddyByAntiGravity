import { Link, useLocation } from 'react-router-dom';
import { useVocab } from '../context/VocabContext';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
    const location = useLocation();
    const { wordCount } = useVocab();
    const { currentUser, logout, isAuthenticated, isAdmin } = useAuth();
    const active = (path) => location.pathname === path ? 'active' : '';

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <Link to={isAdmin ? "/admin" : "/"} className="navbar-brand">
                    <span className="navbar-logo">📚</span>
                    <span className="navbar-title">AI 阅读小帮手</span>
                </Link>

                <div className="navbar-links">
                    {!isAdmin && (
                        <Link to="/" className={`navbar-link ${active('/')}`}>文章列表</Link>
                    )}

                    {isAuthenticated ? (
                        <>
                            {currentUser.role === 'student' && (
                                <>
                                    <Link to="/vocabulary" className={`navbar-link vocab-link ${active('/vocabulary')}`}>
                                        <span className="vocab-icon">📝</span>
                                        <span>我的生词本</span>
                                        {wordCount > 0 && <span className="vocab-count">{wordCount}</span>}
                                    </Link>
                                    <Link to="/my-articles" className={`navbar-link ${active('/my-articles')}`}>
                                        <span className="teacher-icon">✍️</span>
                                        <span>我的上传</span>
                                    </Link>
                                </>
                            )}

                            {currentUser.role === 'teacher' && (
                                <Link to="/teacher" className={`navbar-link ${active('/teacher')}`}>
                                    <span className="teacher-icon">✍️</span>
                                    <span>我的文章</span>
                                </Link>
                            )}

                            {isAdmin && (
                                <Link to="/admin" className={`navbar-link ${active('/admin')}`}>
                                    <span className="teacher-icon">⚙️</span>
                                    <span>管理后台</span>
                                </Link>
                            )}

                            <div className="navbar-auth-section">
                                <Link to="/profile" className={`navbar-user-greeting ${active('/profile')}`}
                                    title="个人中心 / 修改密码">
                                    {currentUser.username}
                                    {currentUser.role === 'admin' && <span className="nav-role-tag admin">管理员</span>}
                                    {currentUser.role === 'teacher' && <span className="nav-role-tag teacher">教师</span>}
                                </Link>
                                <button className="btn btn-outline btn-sm" onClick={logout}>退出</button>
                            </div>
                        </>
                    ) : (
                        <div className="navbar-login-wrapper">
                            <Link to="/auth" className={`navbar-link ${active('/auth')}`}>
                                <span className="teacher-icon">🔑</span>
                                <span>登录 / 注册</span>
                            </Link>
                            <div className="navbar-login-tooltip">
                                ✨ 登录后记录您的个性化学习体验
                                <div className="tooltip-arrow" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;

