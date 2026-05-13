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
                loaded.push({ ...docSnap.data(), word: docSnap.id });
            });
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
            addedAt: Date.now()
        });
    };

    const removeWord = async (wordText) => {
        if (!userId) return;
        await deleteDoc(doc(db, 'users', userId, 'vocabulary', wordText));
    };

    const isWordSaved = (wordText) => {
        return savedWords.some(w => w.word === wordText);
    };

    const getRandomWords = (count = 1) => {
        const shuffled = [...savedWords].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    };

    const clearAllWords = async () => {
        if (!userId) return;
        for (const word of savedWords) {
            await deleteDoc(doc(db, 'users', userId, 'vocabulary', word.word));
        }
    };

    const value = {
        savedWords,
        addWord,
        removeWord,
        isWordSaved,
        getRandomWords,
        clearAllWords,
        wordCount: savedWords.length
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
