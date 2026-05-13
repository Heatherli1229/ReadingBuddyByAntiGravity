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
    const [form, setForm] = useState({ email: '', displayName: '', password: '', role: 'student' });
    const [createMsg, setCreateMsg] = useState(null);

    // Reset-password dialog state
    const [resetTarget, setResetTarget] = useState(null);
    const [resetMsg, setResetMsg] = useState(null);

    /* ── Create user ──────────────────────────── */
    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateMsg(null);
        if (!form.email.trim() || !form.password) {
            setCreateMsg({ type: 'error', text: '邮箱和密码不能为空' });
            return;
        }
        if (!form.email.includes('@')) {
            setCreateMsg({ type: 'error', text: '请输入有效的邮箱地址' });
            return;
        }
        const result = await adminCreateUser(form.email.trim(), form.password, form.role, form.displayName.trim());
        if (result.success) {
            const label = form.displayName.trim() || form.email.split('@')[0];
            setCreateMsg({ type: 'success', text: `账号「${label}」创建成功！` });
            setForm({ email: '', displayName: '', password: '', role: 'student' });
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
    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setResetMsg(null);
        const result = await adminResetPassword(resetTarget.id);
        if (result.success) {
            const email = resetTarget.email || `${resetTarget.username}@readingbuddy.local`;
            setResetMsg({ type: 'success', text: `密码重置邮件已发送至「${email}」，请通知用户查收件筒。` });
            setTimeout(() => { setResetTarget(null); setResetMsg(null); }, 3000);
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
                            <th>显示名</th>
                            <th>登录邮箱</th>
                            <th>角色</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map(u => (
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
