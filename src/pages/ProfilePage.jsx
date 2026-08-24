import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVocab } from '../context/VocabContext';
import { useArticles } from '../context/ArticleContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import './ProfilePage.css';

function ProfilePage() {
    const { currentUser, changePassword } = useAuth();
    const { wordCount, masteredCount } = useVocab();
    const { articles } = useArticles();

    const [oldPwd, setOldPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [message, setMessage] = useState(null);
    const [readArticlesCount, setReadArticlesCount] = useState(0);

    const roleLabel = { admin: '管理员', teacher: '教师', student: '学生' };

    // 计算用户自己创作/上传的文章数
    const myArticlesCount = currentUser ? articles.filter(a => a.authorId === currentUser.id).length : 0;

    // 加载已读文章数
    useEffect(() => {
        if (!currentUser?.id) return;
        const fetchReadCount = async () => {
            try {
                const snap = await getDocs(collection(db, 'users', currentUser.id, 'readArticles'));
                setReadArticlesCount(snap.size);
            } catch (err) {
                console.warn('获取阅读历史失败:', err);
            }
        };
        fetchReadCount();
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        if (newPwd !== confirmPwd) {
            setMessage({ type: 'error', text: '两次输入的新密码不一致' });
            return;
        }
        const result = await changePassword(oldPwd, newPwd);
        if (result.success) {
            setMessage({ type: 'success', text: '密码修改成功！' });
            setOldPwd(''); setNewPwd(''); setConfirmPwd('');
        } else {
            setMessage({ type: 'error', text: result.error });
        }
    };

    if (!currentUser) return null;

    const masteredPct = wordCount > 0 ? Math.round((masteredCount / wordCount) * 100) : 0;

    return (
        <div className="profile-page container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">{currentUser.username.charAt(0).toUpperCase()}</div>
                    <div>
                        <h2>{currentUser.username}</h2>
                        <span className={`role-badge role-${currentUser.role}`}>
                            {roleLabel[currentUser.role] || currentUser.role}
                        </span>
                    </div>
                </div>

                {/* 🌟 学习成就概览统计 */}
                <div className="profile-section">
                    <h3>🏆 个人学习成就</h3>
                    <div className="profile-stats-grid">
                        <div className="profile-stat-card">
                            <div className="stat-icon">📖</div>
                            <div className="stat-info">
                                <div className="stat-number">{readArticlesCount} <span className="unit">篇</span></div>
                                <div className="stat-title">阅读文章数</div>
                            </div>
                        </div>

                        <div className="profile-stat-card">
                            <div className="stat-icon">✍️</div>
                            <div className="stat-info">
                                <div className="stat-number">{myArticlesCount} <span className="unit">篇</span></div>
                                <div className="stat-title">我的上传文章</div>
                            </div>
                        </div>

                        <div className="profile-stat-card">
                            <div className="stat-icon">📝</div>
                            <div className="stat-info">
                                <div className="stat-number">{wordCount} <span className="unit">词</span></div>
                                <div className="stat-title">生词总收藏</div>
                            </div>
                        </div>

                        <div className="profile-stat-card">
                            <div className="stat-icon">✅</div>
                            <div className="stat-info">
                                <div className="stat-number">{masteredCount} <span className="unit">词</span></div>
                                <div className="stat-title">已掌握生词</div>
                            </div>
                        </div>
                    </div>

                    {/* 掌握进度条 */}
                    <div className="mastery-progress-box">
                        <div className="mastery-label">
                            <span>生词掌握率</span>
                            <strong>{masteredPct}% ({masteredCount}/{wordCount})</strong>
                        </div>
                        <div className="mastery-bar-bg">
                            <div className="mastery-bar-fill" style={{ width: `${masteredPct}%` }} />
                        </div>
                    </div>
                </div>

                {/* 修改密码区 */}
                <div className="profile-section" style={{ marginTop: '2rem' }}>
                    <h3>🔑 修改密码</h3>
                    {message && (
                        <div className={`profile-msg profile-msg-${message.type}`}>{message.text}</div>
                    )}
                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-group">
                            <label>当前密码</label>
                            <input type="password" className="input" value={oldPwd}
                                onChange={e => setOldPwd(e.target.value)} placeholder="请输入当前密码" required />
                        </div>
                        <div className="form-group">
                            <label>新密码</label>
                            <input type="password" className="input" value={newPwd}
                                onChange={e => setNewPwd(e.target.value)} placeholder="至少3个字符" required />
                        </div>
                        <div className="form-group">
                            <label>确认新密码</label>
                            <input type="password" className="input" value={confirmPwd}
                                onChange={e => setConfirmPwd(e.target.value)} placeholder="再次输入新密码" required />
                        </div>
                        <button type="submit" className="btn btn-primary">保存新密码</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
