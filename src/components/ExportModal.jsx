import { useState } from 'react';
import { exportToCSV, printVocabList } from '../utils/exportVocab';
import './ExportModal.css';

function ExportModal({ words, onClose }) {
    const [selectedFormat, setSelectedFormat] = useState('csv');
    const [selectedHsk, setSelectedHsk] = useState('all');

    // 过滤词汇
    const filteredWords = words.filter(w => {
        if (selectedHsk === 'all') return true;
        const level = w.hskLevel || '1';
        return level === selectedHsk;
    });

    const handleExport = () => {
        if (filteredWords.length === 0) {
            alert('没有选中的生词可以导出');
            return;
        }

        const timestamp = new Date().toISOString().slice(0, 10);
        
        switch (selectedFormat) {
            case 'csv':
                exportToCSV(filteredWords, `生词本_${selectedHsk}_${timestamp}.csv`);
                break;
            case 'print':
                printVocabList(filteredWords, `我的生词本 (${filteredWords.length}词)`);
                break;
            default:
                exportToCSV(filteredWords);
        }

        onClose();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="export-modal animate-slideUp">
                <div className="export-modal-header">
                    <h2>导出生词本 📥</h2>
                    <button className="close-btn" onClick={onClose} aria-label="关闭">✕</button>
                </div>

                <div className="export-modal-body">
                    {/* HSK 筛选 */}
                    <div className="export-section">
                        <label className="export-label">选择要导出的生词范围</label>
                        <div className="hsk-filter-chips">
                            <button
                                className={`chip ${selectedHsk === 'all' ? 'active' : ''}`}
                                onClick={() => setSelectedHsk('all')}
                            >
                                全部 ({words.length})
                            </button>
                            {['1', '2', '3', '4', '5', '6', '7-9', 'Non-HSK'].map(level => {
                                const count = words.filter(w => (w.hskLevel || '1') === level).length;
                                if (count === 0) return null;
                                return (
                                    <button
                                        key={level}
                                        className={`chip ${selectedHsk === level ? 'active' : ''}`}
                                        onClick={() => setSelectedHsk(level)}
                                    >
                                        {level === 'Non-HSK' ? 'Non-HSK' : `HSK ${level}`} ({count})
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 格式选择 */}
                    <div className="export-section">
                        <label className="export-label">选择导出格式</label>
                        <div className="format-options">
                            <label className={`format-card ${selectedFormat === 'csv' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="exportFormat"
                                    value="csv"
                                    checked={selectedFormat === 'csv'}
                                    onChange={(e) => setSelectedFormat(e.target.value)}
                                />
                                <div className="format-icon">📊</div>
                                <div className="format-info">
                                    <div className="format-name">Excel / CSV 格式</div>
                                    <div className="format-desc">包含生词、拼音、英文释义及 HSK 等级，适合 Excel、Numbers 打开</div>
                                </div>
                            </label>

                            <label className={`format-card ${selectedFormat === 'print' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="exportFormat"
                                    value="print"
                                    checked={selectedFormat === 'print'}
                                    onChange={(e) => setSelectedFormat(e.target.value)}
                                />
                                <div className="format-icon">🖨️</div>
                                <div className="format-info">
                                    <div className="format-name">PDF / 打印清单</div>
                                    <div className="format-desc">生成精美的生词清单网页，可在线预览并打印或直接保存为 PDF</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="export-modal-footer">
                    <div className="export-summary">
                        准备导出 <strong>{filteredWords.length}</strong> 个生词
                    </div>
                    <div className="export-actions">
                        <button className="btn btn-ghost" onClick={onClose}>
                            取消
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleExport}
                            disabled={filteredWords.length === 0}
                        >
                            {selectedFormat === 'print' ? '🖨️ 打开打印预览' : '📥 确认导出'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ExportModal;
