import { createContext, useContext, useState, useEffect } from 'react';
import { auth, secondaryAuth, db } from '../firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updatePassword,
    sendPasswordResetEmail,
    EmailAuthProvider,
    reauthenticateWithCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Watch auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Fetch extra user details from firestore
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        setCurrentUser({ id: firebaseUser.uid, ...userDoc.data(), email: firebaseUser.email });
                    } else {
                        // Fallback
                        const fallbackUser = { id: firebaseUser.uid, email: firebaseUser.email, role: 'student', username: firebaseUser.email.split('@')[0] };
                        await setDoc(doc(db, 'users', firebaseUser.uid), fallbackUser);
                        setCurrentUser(fallbackUser);
                    }
                } catch (err) {
                    console.error("获取 Firestore 用户信息失败 (数据库未开启或权限不足):", err);
                    // 本地临时 fallback: 以确保持续未配置数据库时也能试用
                    const mockRole = firebaseUser.email.startsWith("admin@") ? "admin" : "student";
                    setCurrentUser({ id: firebaseUser.uid, email: firebaseUser.email, role: mockRole, username: firebaseUser.email.split('@')[0] });
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const fetchUsers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const usersList = [];
            querySnapshot.forEach(doc => {
                usersList.push({ id: doc.id, ...doc.data() });
            });
            setUsers(usersList);
        } catch (err) {
            // Firestore 权限不足时（未登录）不应崩溃
            console.warn('无法加载用户列表（可能需要登录）', err.code);
        }
    };

    // users 列表用于判断文章作者角色，未登录时同样需要
    // （历史文章没有 authorRole 字段，需要通过 users 列表回退查找）
    useEffect(() => {
        fetchUsers();
    }, []); // 仅在挂载时加载一次即可

    const login = async (email, password) => {
        // 支持真实邮箱登录；对旧账号（原始用户名）保留尾缀兼容
        const resolvedEmail = email.includes('@') ? email : `${email}@readingbuddy.local`;
        try {
            await signInWithEmailAndPassword(auth, resolvedEmail, password);
            return { success: true };
        } catch (error) {
            let msg = '邮箱或密码错误';
            if (error.code === 'auth/user-not-found') msg = '该邮箱未注册';
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = '邮箱或密码错误';
            if (error.code === 'auth/too-many-requests') msg = '登录尝试次数过多，请稍后再试或重置密码';
            return { success: false, error: msg };
        }
    };

    const register = async (email, password, displayName) => {
        if (!email.includes('@')) {
            return { success: false, error: '请输入有效的邮箱地址' };
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const username = displayName || email.split('@')[0];
            await setDoc(doc(db, 'users', user.uid), {
                username,
                email,
                role: 'student',
                displayName: username
            });
            return { success: true };
        } catch (error) {
            let msg = error.message;
            if (error.code === 'auth/email-already-in-use') msg = '该邮箱已被注册，请直接登录';
            if (error.code === 'auth/weak-password') msg = '密码长度至少6位';
            if (error.code === 'auth/invalid-email') msg = '邮箱格式不正确';
            return { success: false, error: msg };
        }
    };

    const resetPassword = async (email) => {
        if (!email.includes('@')) {
            return { success: false, error: '请输入有效的邮箱地址' };
        }
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            let msg = '发送失败，请检查邮箱是否正确';
            if (error.code === 'auth/user-not-found') msg = '该邮箱未注册';
            if (error.code === 'auth/invalid-email') msg = '邮箱格式不正确';
            return { success: false, error: msg };
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    const changePassword = async (oldPassword, newPassword) => {
        if (!auth.currentUser) return { success: false, error: '未登录' };
        try {
            const credential = EmailAuthProvider.credential(auth.currentUser.email, oldPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            return { success: true };
        } catch (error) {
            return { success: false, error: '密码错误或修改失败' };
        }
    };

    const adminCreateUser = async (email, password, role, displayName) => {
        if (!email.includes('@')) {
            return { success: false, error: '请输入有效的邮箱地址' };
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const user = userCredential.user;
            const username = displayName || email.split('@')[0];
            await setDoc(doc(db, 'users', user.uid), {
                username,
                email,
                role,
                displayName: username
            });
            await signOut(secondaryAuth);
            await fetchUsers();
            return { success: true };
        } catch (error) {
            let msg = error.message;
            if (error.code === 'auth/email-already-in-use') msg = '该邮箱已被注册';
            if (error.code === 'auth/weak-password') msg = '密码长度至少6位';
            if (error.code === 'auth/invalid-email') msg = '邮箱格式不正确';
            return { success: false, error: msg };
        }
    };

    const adminDeleteUser = async (userId) => {
        try {
            // Delete the metadata from firestore. The real Auth account remains, but is disassociated.
            await deleteDoc(doc(db, 'users', userId));
            await fetchUsers();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // 管理员代劳发送密码重置邮件（不需要知道旧密码）
    const adminResetPassword = async (userId) => {
        try {
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists()) {
                return { success: false, error: '用户不存在' };
            }
            const userData = userDocSnap.data();
            // 优先使用 Firestore 存储的 email 字段
            const email = userData.email || (userData.username?.includes('@') ? userData.username : `${userData.username}@readingbuddy.local`);
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            let msg = '发送失败，请检查用户邮箱是否正确';
            if (error.code === 'auth/user-not-found') msg = '该用户在 Firebase 中不存在';
            if (error.code === 'auth/invalid-email') msg = '用户邮箱格式不正确';
            return { success: false, error: msg };
        }
    };

    // 判断文章是否是公开作者（教师/管理员）上传的
    const isPublicAuthor = (authorId, authorRole) => {
        // 1️⃣ 文章自带 authorRole 字段（新文章）
        if (authorRole) {
            return authorRole === 'teacher' || authorRole === 'admin';
        }
        // 2️⃣ 旧种子数据：authorId 就是字符串 'teacher'
        if (authorId === 'teacher') return true;
        // 3️⃣ 历史文章：通过 users 列表回退查找
        const author = users.find(u => u.id === authorId);
        if (author) return author.role === 'teacher' || author.role === 'admin';
        // 4️⃣ users 列表为空（未登录且 Firestore 读取失败）→默认隐藏此文章
        return false;
    };

    const value = {
        currentUser,
        users,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.role === 'admin',
        isTeacher: currentUser?.role === 'teacher' || currentUser?.role === 'admin',
        login,
        register,
        resetPassword,
        logout,
        changePassword,
        adminCreateUser,
        adminDeleteUser,
        adminResetPassword,
        isPublicAuthor,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}

export default AuthContext;
