import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const VocabContext = createContext();

export function VocabProvider({ children }) {
    const { currentUser } = useAuth();
    const userId = currentUser?.id ?? null;
    const [savedWords, setSavedWords] = useState([]);

    useEffect(() => {
        if (!userId) {
            setSavedWords([]);
            return;
        }
        
        const vocabRef = collection(db, 'users', userId, 'vocabulary');
        const unsubscribe = onSnapshot(vocabRef, (snapshot) => {
            const loaded = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                loaded.push({ ...data, word: docSnap.id, mastered: !!data.mastered });
            });
            // 按添加时间倒序排列（后加入的在最前）
            loaded.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
            setSavedWords(loaded);
        });

        return unsubscribe;
    }, [userId]);

    const addWord = async (word) => {
        if (!userId) return;
        const exists = savedWords.some(w => w.word === word.word);
        if (exists) return;
        
        await setDoc(doc(db, 'users', userId, 'vocabulary', word.word), {
            ...word,
            mastered: false,
            addedAt: Date.now()
        });
    };

    const removeWord = async (wordText) => {
        if (!userId) return;
        await deleteDoc(doc(db, 'users', userId, 'vocabulary', wordText));
    };

    const toggleMastered = async (wordText) => {
        if (!userId) return;
        const wordObj = savedWords.find(w => w.word === wordText);
        if (!wordObj) return;
        const newMastered = !wordObj.mastered;
        await setDoc(doc(db, 'users', userId, 'vocabulary', wordText), {
            ...wordObj,
            mastered: newMastered,
            masteredAt: newMastered ? Date.now() : null
        }, { merge: true });
    };

    const isWordSaved = (wordText) => {
        return savedWords.some(w => w.word === wordText);
    };

    // 默认获取未学会的生词进行复习；如果未学会为空则回退到全部词汇
    const getRandomWords = (count = 1, includeMastered = false) => {
        const unmastered = savedWords.filter(w => !w.mastered);
        const pool = includeMastered ? savedWords : (unmastered.length > 0 ? unmastered : savedWords);
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    };

    const clearAllWords = async () => {
        if (!userId) return;
        for (const word of savedWords) {
            await deleteDoc(doc(db, 'users', userId, 'vocabulary', word.word));
        }
    };

    const unmasteredWords = savedWords.filter(w => !w.mastered);
    const masteredWords = savedWords.filter(w => !!w.mastered);

    const value = {
        savedWords,
        unmasteredWords,
        masteredWords,
        addWord,
        removeWord,
        toggleMastered,
        isWordSaved,
        getRandomWords,
        clearAllWords,
        wordCount: savedWords.length,
        masteredCount: masteredWords.length,
        unmasteredCount: unmasteredWords.length
    };

    return (
        <VocabContext.Provider value={value}>
            {children}
        </VocabContext.Provider>
    );
}

export function useVocab() {
    const context = useContext(VocabContext);
    if (!context) {
        throw new Error('useVocab must be used within a VocabProvider');
    }
    return context;
}

export default VocabContext;
