import React, { createContext, useContext, useState } from 'react';

const AIContext = createContext();

export const AIProvider = ({ children }) => {
    const [isAIOpen, setIsAIOpen] = useState(false);

    const toggleAI = () => setIsAIOpen(prev => !prev);
    const closeAI = () => setIsAIOpen(false);
    const openAI = () => setIsAIOpen(true);

    return (
        <AIContext.Provider value={{ isAIOpen, toggleAI, closeAI, openAI }}>
            {children}
        </AIContext.Provider>
    );
};

export const useAI = () => {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
};
