import { useState } from 'react';
import { useArticles } from '../context/ArticleContext';
import { autoDetectVocabulary, analyzeArticleDifficulty } from '../utils/vocabDetector';
import './TeacherPage.css';

// 默认管理员账号
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// 空白文章模板
const EMPTY_ARTICLE = {
    title_cn: '',
    title_en: '',
    level: '初级',
    content: '',
    vocabulary: []
};

// 空白生词模板
const EMPTY_VOCAB = {
    word: '',
    pinyin: '',
    en: '',
    cn: ''
};

function TeacherPage() {
    const { articles, addArticle, updateArticle, deleteArticle, resetToDefault } = useArticles();

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // 编辑状态
    const [editingArticle, setEditingArticle] = useState(null);
    const [formData, setFormData] = useState(EMPTY_ARTICLE);
    const [isCreating, setIsCreating] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            setIsLoggedIn(true);
            setError('');
        } else {
            setError('用户名或密码错误');
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUsername('');
        setPassword('');
        setEditingArticle(null);
        setIsCreating(false);
    };

    // 开始创建新文章
    const handleCreate = () => {
        setFormData(EMPTY_ARTICLE);
        setEditingArticle(null);
        setIsCreating(true);
    };

    // 开始编辑文章
    const handleEdit = (article) => {
        setFormData({
            title_cn: article.title_cn,
            title_en: article.title_en,
            level: article.level,
            content: article.content,
            vocabulary: [...article.vocabulary]
        });
        setEditingArticle(article);
        setIsCreating(false);
    };

    // 取消编辑
    const handleCancel = () => {
        setEditingArticle(null);
        setIsCreating(false);
        setFormData(EMPTY_ARTICLE);
    };

    // 保存文章
    const handleSave = () => {
        if (!formData.title_cn.trim() || !formData.content.trim()) {
            alert('请填写中文标题和内容');
            return;
        }

        if (isCreating) {
            addArticle(formData);
        } else if (editingArticle) {
            updateArticle(editingArticle.id, formData);
        }

        handleCancel();
    };

    // 删除文章
    const handleDelete = (id) => {
        if (confirm('确定要删除这篇文章吗？')) {
            deleteArticle(id);
        }
    };

    // 更新表单字段
    const updateFormField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // 添加生词
    const addVocabWord = () => {
        setFormData(prev => ({
            ...prev,
            vocabulary: [...prev.vocabulary, { ...EMPTY_VOCAB }]
        }));
    };

    // 更新生词
    const updateVocabWord = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            vocabulary: prev.vocabulary.map((v, i) =>
                i === index ? { ...v, [field]: value } : v
            )
        }));
    };

    // 删除生词
    const removeVocabWord = (index) => {
        setFormData(prev => ({
            ...prev,
            vocabulary: prev.vocabulary.filter((_, i) => i !== index)
        }));
    };

    // 自动识别生词
    const handleAutoDetect = () => {
        if (!formData.content.trim()) {
            alert('请先输入文章内容');
            return;
        }

        // 分析文章难度
        const analysis = analyzeArticleDifficulty(formData.content);

        // 如果分析出的难度与选择的不一致，提示用户
        if (analysis.level !== formData.level) {
            const confirmChange = confirm(
                `根据文章内容分析，建议难度等级为「${analysis.level}」\n` +
                `(当前选择: ${formData.level})\n\n` +
                `是否调整为建议等级？`
            );

            if (confirmChange) {
                setFormData(prev => ({ ...prev, level: analysis.level }));
            }
        }

        const detectedVocab = autoDetectVocabulary(formData.content, formData.level);

        if (detectedVocab.length === 0) {
            alert('未能识别到生词，请检查文章内容或手动添加');
            return;
        }

        // 合并已有生词和新识别的生词，避免重复
        const existingWords = new Set(formData.vocabulary.map(v => v.word));
        const newVocab = detectedVocab.filter(v => !existingWords.has(v.word));

        if (newVocab.length === 0) {
            alert('没有发现新的生词');
            return;
        }

        setFormData(prev => ({
            ...prev,
            vocabulary: [...prev.vocabulary, ...newVocab]
        }));

        // 统计有多少词有完整释义
        const withDefinition = newVocab.filter(v => v.pinyin && v.en).length;
        const needsInput = newVocab.length - withDefinition;

        let message = `✅ 成功识别 ${newVocab.length} 个生词！\n`;
        message += `📖 ${withDefinition} 个词已自动填充释义\n`;
        if (needsInput > 0) {
            message += `✏️ ${needsInput} 个词需要手动补充释义`;
        }

        alert(message);
    };

    // 登录页面
    if (!isLoggedIn) {
        return (
            <div className="teacher-page">
                <div className="login-container">
                    <div className="login-card card">
                        <div className="login-header">
                            <span className="login-icon">🔐</span>
                            <h1 className="login-title">教师登录</h1>
                            <p className="login-subtitle">请输入管理员账号密码</p>
                        </div>

                        <form onSubmit={handleLogin} className="login-form">
                            {error && (
                                <div className="login-error">
                                    ⚠️ {error}
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="username" className="form-label">用户名</label>
                                <input
                                    id="username"
                                    type="text"
                                    className="input"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="请输入用户名"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password" className="form-label">密码</label>
                                <input
                                    id="password"
                                    type="password"
                                    className="input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="请输入密码"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary login-btn">
                                登录
                            </button>
                        </form>

                        <div className="login-hint">
                            💡 默认账号: admin / admin123
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 编辑表单
    if (isCreating || editingArticle) {
        return (
            <div className="teacher-page">
                <header className="teacher-header">
                    <h1 className="teacher-title">
                        {isCreating ? '➕ 添加新文章' : '✏️ 编辑文章'}
                    </h1>
                    <button className="btn btn-ghost" onClick={handleCancel}>
                        取消
                    </button>
                </header>

                <div className="article-form card">
                    <div className="form-section">
                        <h3 className="section-title">📝 基本信息</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">中文标题 *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.title_cn}
                                    onChange={(e) => updateFormField('title_cn', e.target.value)}
                                    placeholder="例如：我的家"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">英文标题</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.title_en}
                                    onChange={(e) => updateFormField('title_en', e.target.value)}
                                    placeholder="例如：My Family"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">难度等级</label>
                            <div className="level-selector">
                                {['初级', '中级', '高级'].map(level => (
                                    <button
                                        key={level}
                                        type="button"
                                        className={`level-option ${formData.level === level ? 'active' : ''}`}
                                        onClick={() => updateFormField('level', level)}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">文章内容 *</label>
                            <textarea
                                className="input textarea"
                                value={formData.content}
                                onChange={(e) => updateFormField('content', e.target.value)}
                                placeholder="请输入文章正文..."
                                rows={10}
                            />
                            <span className="char-count">
                                {formData.content.length} 字 · 预计 {Math.ceil(formData.content.length / 100) || 1} 分钟阅读
                            </span>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="section-header">
                            <h3 className="section-title">📚 生词列表</h3>
                            <div className="section-actions">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-primary auto-detect-btn"
                                    onClick={handleAutoDetect}
                                    disabled={!formData.content.trim()}
                                >
                                    🤖 自动识别生词
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-secondary"
                                    onClick={addVocabWord}
                                >
                                    + 手动添加
                                </button>
                            </div>
                        </div>

                        <div className="auto-detect-hint">
                            💡 根据「{formData.level}」难度自动识别生词，识别后可手动编辑补充
                        </div>

                        {formData.vocabulary.length === 0 ? (
                            <div className="empty-vocab">
                                还没有添加生词，点击上方按钮添加
                            </div>
                        ) : (
                            <div className="vocab-list">
                                {formData.vocabulary.map((vocab, index) => (
                                    <div key={index} className="vocab-item">
                                        <div className="vocab-inputs">
                                            <input
                                                type="text"
                                                className="input input-sm"
                                                value={vocab.word}
                                                onChange={(e) => updateVocabWord(index, 'word', e.target.value)}
                                                placeholder="生词"
                                            />
                                            <input
                                                type="text"
                                                className="input input-sm"
                                                value={vocab.pinyin}
                                                onChange={(e) => updateVocabWord(index, 'pinyin', e.target.value)}
                                                placeholder="拼音"
                                            />
                                            <input
                                                type="text"
                                                className="input input-sm"
                                                value={vocab.en}
                                                onChange={(e) => updateVocabWord(index, 'en', e.target.value)}
                                                placeholder="英文释义"
                                            />
                                            <input
                                                type="text"
                                                className="input input-sm"
                                                value={vocab.cn}
                                                onChange={(e) => updateVocabWord(index, 'cn', e.target.value)}
                                                placeholder="中文解释"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-icon btn-ghost remove-vocab"
                                            onClick={() => removeVocabWord(index)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button className="btn btn-ghost" onClick={handleCancel}>
                            取消
                        </button>
                        <button className="btn btn-primary" onClick={handleSave}>
                            💾 保存文章
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 文章列表
    return (
        <div className="teacher-page">
            <header className="teacher-header">
                <div className="header-left">
                    <h1 className="teacher-title">教师后台 👩‍🏫</h1>
                    <span className="article-count">{articles.length} 篇文章</span>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={handleCreate}>
                        ➕ 添加文章
                    </button>
                    <button className="btn btn-ghost" onClick={handleLogout}>
                        退出登录
                    </button>
                </div>
            </header>

            <div className="article-list">
                {articles.map(article => (
                    <div key={article.id} className="article-item card-flat">
                        <div className="article-item-info">
                            <div className="article-item-header">
                                <span className={`badge badge-${article.level === '初级' ? 'beginner' : article.level === '中级' ? 'intermediate' : 'advanced'}`}>
                                    {article.level}
                                </span>
                                <span className="article-item-meta">
                                    {article.characters} 字 · {article.vocabulary.length} 个生词
                                </span>
                            </div>
                            <h3 className="article-item-title">{article.title_cn}</h3>
                            <p className="article-item-subtitle">{article.title_en}</p>
                        </div>
                        <div className="article-item-actions">
                            <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleEdit(article)}
                            >
                                ✏️ 编辑
                            </button>
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => handleDelete(article.id)}
                            >
                                🗑️ 删除
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="teacher-footer">
                <button
                    className="btn btn-ghost"
                    onClick={() => {
                        if (confirm('确定要重置为默认文章吗？所有自定义文章将被删除。')) {
                            resetToDefault();
                        }
                    }}
                >
                    🔄 重置为默认文章
                </button>
            </div>
        </div>
    );
}

export default TeacherPage;
