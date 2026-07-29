import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useArticles } from '../context/ArticleContext';
import './AdminPage.css';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const ROLE_LABELS = { admin: '管理员', teacher: '教师', student: '学生' };
const TABS = [
    { id: 'dashboard', label: '仪表板', icon: '📊' },
    { id: 'users',     label: '用户管理', icon: '👥' },
    { id: 'articles',  label: '文章管理', icon: '📚' },
];

function AdminPage() {
    const { currentUser, users, isAdmin, adminCreateUser, adminDeleteUser, adminResetPassword, adminUpdateUserRole } = useAuth();
    const { articles, deleteArticle } = useArticles();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [userStats, setUserStats] = useState({});
    const [resetPwd, setResetPwd] = useState('');

    // ── Form states ────────────────────────────
    const [form, setForm] = useState({ email: '', displayName: '', password: '', role: 'student' });
    const [createMsg, setCreateMsg] = useState(null);
    const [resetTarget, setResetTarget] = useState(null);
    const [resetMsg, setResetMsg] = useState(null);

    // ── Article filter states ──────────────────
    const [filterAuthor, setFilterAuthor] = useState('all');
    const [filterLevel, setFilterLevel] = useState('all');

    // ── Load vocab stats for all users ────────
    useEffect(() => {
        if (!isAdmin) return;
        const loadStats = async () => {
            const statsMap = {};
            for (const user of users) {
                try {
                    const snap = await getDocs(collection(db, 'users', user.id, 'vocabulary'));
                    statsMap[user.id] = { vocabCount: snap.size };
                } catch (e) {
                    statsMap[user.id] = { vocabCount: 0 };
                }
            }
            setUserStats(statsMap);
        };
        if (users.length > 0) loadStats();
    }, [users, isAdmin]);

    // ── Redirect non-admins ────────────────────
    useEffect(() => {
        if (!isAdmin) navigate('/');
    }, [isAdmin, navigate]);

    // ── Derived data ───────────────────────────
    const uniqueAuthors = useMemo(() => {
        const ids = new Set(articles.map(a => a.authorId));
        return Array.from(ids).map(id => {
            const u = users.find(x => x.id === id);
            return { id, name: u ? (u.displayName || u.username) : id };
        });
    }, [articles, users]);

    const filteredArticles = useMemo(() =>
        articles.filter(art => {
            const okAuthor = filterAuthor === 'all' || art.authorId === filterAuthor;
            const okLevel  = filterLevel  === 'all' || art.level    === filterLevel;
            return okAuthor && okLevel;
        }),
    [articles, filterAuthor, filterLevel]);

    const sorted = useMemo(() =>
        [...users].sort((a, b) => {
            const order = { admin: 0, teacher: 1, student: 2 };
            return (order[a.role] ?? 3) - (order[b.role] ?? 3) || a.username.localeCompare(b.username);
        }),
    [users]);

    // ── Dashboard derived analytics ───────────
    const difficultyCounts = useMemo(() => {
        const counts = { '入门级': 0, '初级': 0, '中级': 0, '高级': 0 };
        articles.forEach(a => {
            if (counts[a.level] !== undefined) {
                counts[a.level]++;
            }
        });
        return counts;
    }, [articles]);

    const topArticles = useMemo(() => {
        return [...articles]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5);
    }, [articles]);

    const topStudents = useMemo(() => {
        return users
            .filter(u => u.role === 'student')
            .map(u => ({
                ...u,
                vocabCount: userStats[u.id]?.vocabCount || 0
            }))
            .sort((a, b) => b.vocabCount - a.vocabCount)
            .slice(0, 5);
    }, [users, userStats]);

    const totalVocab = Object.values(userStats).reduce((s, v) => s + (v.vocabCount || 0), 0);

    if (!isAdmin) return null;

    // ── Handlers ───────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateMsg(null);
        if (!form.email.trim() || !form.password) {
            setCreateMsg({ type: 'error', text: '邮箱和密码不能为空' });
            return;
        }
        const result = await adminCreateUser(form.email.trim(), form.password, form.role, form.displayName.trim());
        if (result.success) {
            setCreateMsg({ type: 'success', text: `账号「${form.displayName.trim() || form.email.split('@')[0]}」创建成功！` });
            setForm({ email: '', displayName: '', password: '', role: 'student' });
        } else {
            setCreateMsg({ type: 'error', text: result.error });
        }
    };

    const handleDelete = (user) => {
        if (!window.confirm(`确定要删除用户「${user.username}」吗？此操作不可撤销。`)) return;
        adminDeleteUser(user.id);
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setResetMsg(null);
        const result = await adminResetPassword(resetTarget.id);
        if (result.success) {
            const email = resetTarget.email || `${resetTarget.username}@readingbuddy.local`;
            setResetMsg({ type: 'success', text: `密码重置邮件已发送至「${email}」` });
            setTimeout(() => { setResetTarget(null); setResetMsg(null); }, 3000);
        } else {
            setResetMsg({ type: 'error', text: result.error });
        }
    };

    // ── Tab panels ─────────────────────────────
    const renderDashboard = () => {
        const maxVocabInTop = topStudents.length > 0 ? Math.max(...topStudents.map(s => s.vocabCount), 1) : 1;

        return (
            <>
                {/* Summary stats cards */}
                <div className="admin-stats-grid">
                    <div className="admin-stat-card" style={{ '--accent': 'var(--color-primary)' }}>
                        <div className="stat-label">总文章数</div>
                        <div className="stat-value">{articles.length}<span className="stat-unit">篇</span></div>
                    </div>
                    <div className="admin-stat-card" style={{ '--accent': 'var(--color-secondary)' }}>
                        <div className="stat-label">总注册账号</div>
                        <div className="stat-value">{users.length}<span className="stat-unit">位</span></div>
                    </div>
                    <div className="admin-stat-card" style={{ '--accent': 'var(--color-warning)' }}>
                        <div className="stat-label">学生生词总量</div>
                        <div className="stat-value">{totalVocab}<span className="stat-unit">个</span></div>
                    </div>
                    <div className="admin-stat-card" style={{ '--accent': '#10b981' }}>
                        <div className="stat-label">教师人数</div>
                        <div className="stat-value">{users.filter(u => u.role === 'teacher').length}<span className="stat-unit">位</span></div>
                    </div>
                </div>

                {/* Dashboard layout grid */}
                <div className="dashboard-grid">
                    {/* Left Column */}
                    <div className="dashboard-col">
                        {/* 1. 文章难度分布统计 */}
                        <div className="admin-card">
                            <h2>📊 文章难度分布统计</h2>
                            <div className="difficulty-dist-list">
                                {[
                                    { level: '入门级', color: '#10b981' },
                                    { level: '初级', color: '#3b82f6' },
                                    { level: '中级', color: '#f59e0b' },
                                    { level: '高级', color: '#ef4444' },
                                ].map(({ level, color }) => {
                                    const count = difficultyCounts[level] || 0;
                                    const pct = articles.length > 0 ? Math.round((count / articles.length) * 100) : 0;
                                    return (
                                        <div key={level} className="dist-item">
                                            <div className="dist-header">
                                                <span className="dist-level" style={{ color }}>{level}</span>
                                                <span className="dist-count">{count} 篇 ({pct}%)</span>
                                            </div>
                                            <div className="dist-bar-bg">
                                                <div
                                                    className="dist-bar-fill"
                                                    style={{ width: `${pct}%`, backgroundColor: color }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. 热门阅读榜单 Top 5 */}
                        <div className="admin-card">
                            <h2>🔥 热门阅读文章 Top 5</h2>
                            {topArticles.length === 0 ? (
                                <p style={{ color: 'var(--color-gray-500)' }}>暂无文章数据</p>
                            ) : (
                                <div className="top-articles-list">
                                    {topArticles.map((art, idx) => {
                                        const author = users.find(u => u.id === art.authorId);
                                        const authorName = author ? (author.displayName || author.username) : (art.authorId === 'teacher' ? '系统管理员' : art.authorId);
                                        return (
                                            <div key={art.id} className="top-article-item" onClick={() => navigate(`/read/${art.id}`)}>
                                                <div className={`rank-badge rank-${idx + 1}`}>{idx + 1}</div>
                                                <div className="top-article-info">
                                                    <div className="top-article-title">{art.title_cn}</div>
                                                    <div className="top-article-meta">
                                                        <span className={`role-badge role-${art.level === '高级' ? 'admin' : art.level === '中级' ? 'teacher' : 'student'}`}>{art.level}</span>
                                                        <span>• 作者: {authorName}</span>
                                                    </div>
                                                </div>
                                                <div className="top-article-views">
                                                    👁️ {art.views || 0} 次阅读
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="dashboard-col">
                        {/* 3. 学生生词积累榜 Top 5 */}
                        <div className="admin-card">
                            <h2>🏆 学生生词积累榜 Top 5</h2>
                            {topStudents.length === 0 ? (
                                <p style={{ color: 'var(--color-gray-500)' }}>暂无学生生词数据</p>
                            ) : (
                                <div className="top-students-list">
                                    {topStudents.map((student, idx) => {
                                        const rankIcons = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                                        const pct = maxVocabInTop > 0 ? Math.round((student.vocabCount / maxVocabInTop) * 100) : 0;
                                        return (
                                            <div key={student.id} className="top-student-item">
                                                <div className="student-rank">{rankIcons[idx] || `${idx + 1}`}</div>
                                                <div className="student-info">
                                                    <div className="student-name">
                                                        {student.displayName || student.username}
                                                        <span className="student-email">({student.email || student.username})</span>
                                                    </div>
                                                    <div className="student-bar-bg">
                                                        <div className="student-bar-fill" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                                <div className="student-count">
                                                    <strong>{student.vocabCount}</strong> <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>词</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Pinyin info card */}
                        <div className="admin-card">
                            <h2>🔤 拼音与工具状态
                                <span className="user-count" style={{ marginLeft: '0.75rem' }}>本地运行</span>
                            </h2>
                            <p style={{ color: 'var(--color-gray-500)', fontSize: '0.9rem', lineHeight: '1.7' }}>
                                ✅ 拼音引擎由 <strong>pinyin-pro</strong> 本地驱动，离线即用。<br/>
                                ✅ 教师在添加或识别文章生词时，所有汉字拼音均自动生成。<br/>
                                ℹ️ 英文与中文释义由本地词库（CEDICT）与 AI 离线/在线模型自动辅助匹配。
                            </p>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const renderUsers = () => (
        <>
            {/* User list */}
            <div className="admin-card">
                <h2>用户列表 <span className="user-count">共 {sorted.length} 位</span></h2>
                <div style={{ overflowX: 'auto' }}>
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>显示名</th>
                                <th>登录邮箱</th>
                                <th>角色</th>
                                <th style={{ textAlign: 'center' }}>上传文章数</th>
                                <th style={{ textAlign: 'center' }}>生词数</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map(u => {
                                const stats = userStats[u.id] || { vocabCount: 0 };
                                const uploadedCount = articles.filter(a => a.authorId === u.id).length;
                                return (
                                    <tr key={u.id} className={u.id === currentUser.id ? 'current-user-row' : ''}>
                                        <td>
                                            <span className="username-cell">{u.displayName || u.username}</span>
                                            {u.id === currentUser.id && <span className="self-tag">（当前）</span>}
                                        </td>
                                        <td>
                                            <span className="email-cell">{u.email || `${u.username}@readingbuddy.local`}</span>
                                        </td>
                                        <td>
                                            <span className={`role-badge role-${u.role}`}>
                                                {ROLE_LABELS[u.role] ?? u.role}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '1rem' }}>
                                            {u.role === 'admin' ? '—' : uploadedCount}
                                        </td>
                                        <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '1rem' }}>
                                            {u.role === 'student' ? stats.vocabCount : '—'}
                                        </td>
                                        <td>
                                            {u.id !== 'admin' ? (
                                                <div className="action-row">
                                                    <button className="btn btn-sm btn-outline"
                                                        onClick={() => { setResetTarget(u); setResetPwd(''); setResetMsg(null); }}>
                                                        🔑 重置密码
                                                    </button>
                                                    <button className="btn btn-sm btn-ghost btn-danger"
                                                        onClick={() => handleDelete(u)}>
                                                        🗑️ 删除
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="protected-tag">受保护</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create user */}
            <div className="admin-card">
                <h2>新建账号</h2>
                {createMsg && (
                    <div className={`admin-msg admin-msg-${createMsg.type}`}>{createMsg.text}</div>
                )}
                <form onSubmit={handleCreate} className="create-form">
                    <div className="form-group">
                        <label>登录邮箱 <span className="form-required">*</span></label>
                        <input className="input" type="email" value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            placeholder="请输入邮箱地址" />
                    </div>
                    <div className="form-group">
                        <label>显示名 <span className="form-hint">（选填，默认取邮箱前缀）</span></label>
                        <input className="input" type="text" value={form.displayName}
                            onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                            placeholder="请输入显示名" />
                    </div>
                    <div className="form-group">
                        <label>初始密码 <span className="form-required">*</span></label>
                        <input className="input" type="text" value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            placeholder="至少6位" />
                    </div>
                        <div className="form-group">
                            <label>账号角色</label>
                            <div className="role-selector">
                                {['teacher', 'student', 'admin'].map(r => (
                                    <button key={r} type="button"
                                        className={`role-option ${form.role === r ? 'active' : ''}`}
                                        onClick={() => setForm(f => ({ ...f, role: r }))}>
                                        {ROLE_LABELS[r]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    <button type="submit" className="btn btn-primary">创建账号</button>
                </form>
            </div>
        </>
    );

    const renderArticles = () => (
        <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '1.25rem' }}>
                <h2 style={{ margin: 0 }}>
                    全局文章
                    <span className="user-count" style={{ marginLeft: '0.5rem' }}>
                        {filteredArticles.length === articles.length
                            ? `共 ${articles.length} 篇`
                            : `${filteredArticles.length} / ${articles.length} 篇`}
                    </span>
                </h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <select className="input" style={{ width: 'auto', padding: '4px 10px', height: '36px', minWidth: '140px' }}
                        value={filterAuthor} onChange={e => setFilterAuthor(e.target.value)}>
                        <option value="all">🔍 全部创建人</option>
                        {uniqueAuthors.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                    <select className="input" style={{ width: 'auto', padding: '4px 10px', height: '36px', minWidth: '130px' }}
                        value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
                        <option value="all">📶 全部难度</option>
                        <option value="入门级">入门级</option>
                        <option value="初级">初级</option>
                        <option value="中级">中级</option>
                        <option value="高级">高级</option>
                    </select>
                </div>
            </div>

            {filteredArticles.length === 0 ? (
                <p style={{ color: 'var(--color-gray-500)', padding: '1rem 0' }}>没有符合筛选条件的文章。</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>文章标题</th>
                                <th>难度</th>
                                <th>字数</th>
                                <th style={{ textAlign: 'center' }}>阅读量</th>
                                <th>创建人</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredArticles.map(art => {
                                const author = users.find(u => u.id === art.authorId);
                                const authorName = author
                                    ? (author.displayName || author.username)
                                    : (art.authorId === 'teacher' ? '系统管理员' : art.authorId);
                                const authorRole = author
                                    ? (ROLE_LABELS[author.role] || author.role)
                                    : '未知';
                                return (
                                    <tr key={art.id}>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span className="username-cell" style={{ fontWeight: 600 }}>{art.title_cn}</span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-400)' }}>{art.title_en}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge role-${art.level === '高级' ? 'admin' : art.level === '中级' ? 'teacher' : 'student'}`}>
                                                {art.level}
                                            </span>
                                        </td>
                                        <td>{art.characters}字</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <strong>{art.views || 0}</strong>
                                        </td>
                                        <td>
                                            <span className="email-cell">{authorName}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', marginLeft: '4px' }}>({authorRole})</span>
                                        </td>
                                        <td>
                                            <div className="action-row">
                                                <button className="btn btn-sm btn-outline"
                                                    onClick={() => navigate(`/read/${art.id}`)}>
                                                    👁️ 查看
                                                </button>
                                                <button className="btn btn-sm btn-ghost btn-danger"
                                                    onClick={async () => {
                                                        if (window.confirm(`确定要删除文章《${art.title_cn}》吗？该操作不可撤销。`)) {
                                                            await deleteArticle(art.id);
                                                        }
                                                    }}>
                                                    🗑️ 删除
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <div className="admin-page container">
            <h1 className="admin-title">⚙️ 管理后台</h1>

            {/* ── Tab bar ─────────────────────────────── */}
            <div className="admin-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── Tab content ──────────────────────────── */}
            <div className="admin-tab-content">
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'users'     && renderUsers()}
                {activeTab === 'articles'  && renderArticles()}
            </div>

            {/* ── Reset password modal ─────────────────── */}
            {resetTarget && (
                <div className="modal-overlay" onClick={() => setResetTarget(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <h3>🔑 重置密码 — {resetTarget.displayName || resetTarget.username}</h3>
                        <p className="reset-email-note">
                            将向该用户的注册邮箱发送密码重置链接：<br/>
                            <strong>{resetTarget.email || `${resetTarget.username}@readingbuddy.local`}</strong>
                        </p>
                        {resetMsg && (
                            <div className={`admin-msg admin-msg-${resetMsg.type}`}>{resetMsg.text}</div>
                        )}
                        <form onSubmit={handleResetSubmit}>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost"
                                    onClick={() => setResetTarget(null)}>取消</button>
                                <button type="submit" className="btn btn-primary">📧 发送重置邮件</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPage;
