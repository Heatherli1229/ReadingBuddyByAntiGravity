import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminPage.css';

const ROLE_LABELS = { admin: '管理员', teacher: '教师', student: '学生' };

function AdminPage() {
    const { currentUser, users, isAdmin, adminCreateUser, adminDeleteUser, adminResetPassword } = useAuth();
    const navigate = useNavigate();

    // Redirect non-admins
    if (!isAdmin) {
        navigate('/');
        return null;
    }

    // Create user form state
    const [form, setForm] = useState({ username: '', password: '', role: 'student' });
    const [createMsg, setCreateMsg] = useState(null);

    // Reset-password dialog state
    const [resetTarget, setResetTarget] = useState(null);   // user object
    const [resetPwd, setResetPwd] = useState('');
    const [resetMsg, setResetMsg] = useState(null);

    /* ── Create user ──────────────────────────── */
    const handleCreate = (e) => {
        e.preventDefault();
        setCreateMsg(null);
        if (!form.username.trim() || !form.password) {
            setCreateMsg({ type: 'error', text: '用户名和密码不能为空' });
            return;
        }
        const result = adminCreateUser(form.username.trim(), form.password, form.role);
        if (result.success) {
            setCreateMsg({ type: 'success', text: `账号「${form.username}」创建成功！` });
            setForm({ username: '', password: '', role: 'student' });
        } else {
            setCreateMsg({ type: 'error', text: result.error });
        }
    };

    /* ── Delete user ──────────────────────────── */
    const handleDelete = (user) => {
        if (!window.confirm(`确定要删除用户「${user.username}」吗？此操作不可撤销。`)) return;
        adminDeleteUser(user.id);
    };

    /* ── Reset password ───────────────────────── */
    const handleResetSubmit = (e) => {
        e.preventDefault();
        setResetMsg(null);
        const result = adminResetPassword(resetTarget.id, resetPwd);
        if (result.success) {
            setResetMsg({ type: 'success', text: '密码已重置！' });
            setResetPwd('');
            setTimeout(() => { setResetTarget(null); setResetMsg(null); }, 1500);
        } else {
            setResetMsg({ type: 'error', text: result.error });
        }
    };

    // Sort: admin first, then teachers, then students; alphabetically within each group
    const sorted = [...users].sort((a, b) => {
        const order = { admin: 0, teacher: 1, student: 2 };
        return (order[a.role] ?? 3) - (order[b.role] ?? 3) || a.username.localeCompare(b.username);
    });

    return (
        <div className="admin-page container">
            <h1 className="admin-title">👤 用户管理</h1>

            {/* ── User list ───────────────────────────── */}
            <div className="admin-card">
                <h2>用户列表 <span className="user-count">共 {sorted.length} 位</span></h2>
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>用户名</th>
                            <th>角色</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map(u => (
                            <tr key={u.id} className={u.id === currentUser.id ? 'current-user-row' : ''}>
                                <td>
                                    <span className="username-cell">{u.username}</span>
                                    {u.id === currentUser.id && <span className="self-tag">（当前）</span>}
                                </td>
                                <td>
                                    <span className={`role-badge role-${u.role}`}>
                                        {ROLE_LABELS[u.role] ?? u.role}
                                    </span>
                                </td>
                                <td>
                                    {u.id !== 'admin' ? (
                                        <div className="action-row">
                                            <button
                                                className="btn btn-sm btn-outline"
                                                onClick={() => { setResetTarget(u); setResetPwd(''); setResetMsg(null); }}
                                            >
                                                🔑 重置密码
                                            </button>
                                            <button
                                                className="btn btn-sm btn-ghost btn-danger"
                                                onClick={() => handleDelete(u)}
                                            >
                                                🗑️ 删除
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="protected-tag">受保护</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Create user ─────────────────────────── */}
            <div className="admin-card">
                <h2>新建账号</h2>
                {createMsg && (
                    <div className={`admin-msg admin-msg-${createMsg.type}`}>{createMsg.text}</div>
                )}
                <form onSubmit={handleCreate} className="create-form">
                    <div className="form-group">
                        <label>用户名</label>
                        <input className="input" type="text" value={form.username}
                            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                            placeholder="请输入用户名" />
                    </div>
                    <div className="form-group">
                        <label>初始密码</label>
                        <input className="input" type="text" value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            placeholder="请输入初始密码" />
                    </div>
                    <div className="form-group">
                        <label>账号角色</label>
                        <div className="role-selector">
                            {['teacher', 'student'].map(r => (
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

            {/* ── Reset password modal ─────────────────── */}
            {resetTarget && (
                <div className="modal-overlay" onClick={() => setResetTarget(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <h3>重置密码 — {resetTarget.username}</h3>
                        {resetMsg && (
                            <div className={`admin-msg admin-msg-${resetMsg.type}`}>{resetMsg.text}</div>
                        )}
                        <form onSubmit={handleResetSubmit}>
                            <div className="form-group">
                                <label>新密码</label>
                                <input className="input" type="text" value={resetPwd}
                                    onChange={e => setResetPwd(e.target.value)}
                                    placeholder="至少3个字符" autoFocus />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost"
                                    onClick={() => setResetTarget(null)}>取消</button>
                                <button type="submit" className="btn btn-primary">确认重置</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPage;
