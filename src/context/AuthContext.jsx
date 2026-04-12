import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const AUTH_KEY = 'ai-reading-buddy-auth';
const USERS_KEY = 'ai-reading-buddy-users';

// Hardcoded admin account - always available
const ADMIN_USER = {
    id: 'admin',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    displayName: '系统管理员'
};

function loadUsers() {
    try {
        const stored = localStorage.getItem(USERS_KEY);
        if (stored) {
            const users = JSON.parse(stored);
            // Always ensure admin is present
            if (!users.find(u => u.id === 'admin')) {
                users.unshift(ADMIN_USER);
            }
            return users;
        }
    } catch { /* fall through */ }
    return [ADMIN_USER];
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(() => {
        try {
            const stored = localStorage.getItem(AUTH_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    });

    const [users, setUsers] = useState(loadUsers);

    useEffect(() => {
        if (currentUser) localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
        else localStorage.removeItem(AUTH_KEY);
    }, [currentUser]);

    useEffect(() => {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }, [users]);

    // Keep currentUser in sync if the user record changes (e.g. password reset)
    useEffect(() => {
        if (currentUser) {
            const updated = users.find(u => u.id === currentUser.id);
            if (updated && JSON.stringify(updated) !== JSON.stringify(currentUser)) {
                setCurrentUser(updated);
            }
        }
    }, [users]);

    /* ── Auth actions ─────────────────────────────────────────── */

    const login = (username, password) => {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) { setCurrentUser(user); return { success: true }; }
        return { success: false, error: '用户名或密码错误' };
    };

    const register = (username, password) => {
        if (users.some(u => u.username === username))
            return { success: false, error: '用户名已被注册' };

        const newUser = {
            id: `student_${Date.now()}`,
            username,
            password,
            role: 'student',
            displayName: username
        };
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
        return { success: true };
    };

    const logout = () => setCurrentUser(null);

    /* ── Self-service password change ────────────────────────── */

    const changePassword = (oldPassword, newPassword) => {
        if (!currentUser) return { success: false, error: '未登录' };
        if (currentUser.password !== oldPassword)
            return { success: false, error: '当前密码不正确' };
        if (!newPassword || newPassword.length < 3)
            return { success: false, error: '新密码至少需要3个字符' };

        const updated = { ...currentUser, password: newPassword };
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
        setCurrentUser(updated);
        return { success: true };
    };

    /* ── Admin-only user management ──────────────────────────── */

    const adminCreateUser = (username, password, role) => {
        if (users.some(u => u.username === username))
            return { success: false, error: '用户名已存在' };
        const newUser = {
            id: `${role}_${Date.now()}`,
            username,
            password,
            role,
            displayName: username
        };
        setUsers(prev => [...prev, newUser]);
        return { success: true };
    };

    const adminDeleteUser = (userId) => {
        if (userId === 'admin') return { success: false, error: '不能删除管理员账号' };
        setUsers(prev => prev.filter(u => u.id !== userId));
        return { success: true };
    };

    const adminResetPassword = (userId, newPassword) => {
        if (!newPassword || newPassword.length < 3)
            return { success: false, error: '密码至少需要3个字符' };
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
        return { success: true };
    };

    /* ── Public article rule: teacher OR admin authored ──────── */
    // Articles with authorId 'teacher' or 'admin' or any user with role teacher/admin are public.
    // We expose a helper consumed by HomePage.
    const isPublicAuthor = (authorId) => {
        const author = users.find(u => u.id === authorId);
        return author ? (author.role === 'teacher' || author.role === 'admin') : false;
    };

    const value = {
        currentUser,
        users,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        isTeacher: currentUser?.role === 'teacher' || currentUser?.role === 'admin',
        login,
        register,
        logout,
        changePassword,
        adminCreateUser,
        adminDeleteUser,
        adminResetPassword,
        isPublicAuthor,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}

export default AuthContext;
