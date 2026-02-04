import { Link, useLocation } from 'react-router-dom';
import { useVocab } from '../context/VocabContext';
import './Navbar.css';

function Navbar() {
    const location = useLocation();
    const { wordCount } = useVocab();

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <Link to="/" className="navbar-brand">
                    <span className="navbar-logo">📚</span>
                    <span className="navbar-title">AI 阅读小帮手</span>
                </Link>

                <div className="navbar-links">
                    <Link
                        to="/"
                        className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
                    >
                        文章列表
                    </Link>
                    <Link
                        to="/vocabulary"
                        className={`navbar-link vocab-link ${location.pathname === '/vocabulary' ? 'active' : ''}`}
                    >
                        <span className="vocab-icon">📝</span>
                        <span>我的生词库</span>
                        {wordCount > 0 && (
                            <span className="vocab-count">{wordCount}</span>
                        )}
                    </Link>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
