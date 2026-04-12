import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

function ProfilePage() {
    const { currentUser, changePassword } = useAuth();
    const [oldPwd, setOldPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

    const roleLabel = { admin: '管理员', teacher: '教师', student: '学生' };

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage(null);
        if (newPwd !== confirmPwd) {
            setMessage({ type: 'error', text: '两次输入的新密码不一致' });
            return;
        }
        const result = changePassword(oldPwd, newPwd);
        if (result.success) {
            setMessage({ type: 'success', text: '密码修改成功！' });
            setOldPwd(''); setNewPwd(''); setConfirmPwd('');
        } else {
            setMessage({ type: 'error', text: result.error });
        }
    };

    if (!currentUser) return null;

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

                <div className="profile-section">
                    <h3>修改密码</h3>
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
