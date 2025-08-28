
import React, { useState } from 'react';
import { GameState } from '../types';
import { generateClasses } from '../services/gemini';

interface SetupScreenProps {
    isSolo: boolean;
    onConfirmSetup: (theme: string, playerLimit: number) => void;
    onUpdateClasses: (classes: string[]) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ isSolo, onConfirmSetup, onUpdateClasses }) => {
    const [theme, setTheme] = useState('');
    const [playerLimit, setPlayerLimit] = useState(isSolo ? 1 : 3);
    const [errorMessage, setErrorMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [classesGenerated, setClassesGenerated] = useState(false);

    const handleGenerateClasses = async () => {
        if (!theme.trim()) {
            setErrorMessage('Por favor, insira um tema primeiro.');
            return;
        }
        setErrorMessage('');
        setIsGenerating(true);
        try {
            const classes = await generateClasses(theme);
            onUpdateClasses(classes);
            setClassesGenerated(true);
        } catch (error) {
            console.error(error);
            setErrorMessage('Não foi possível gerar as classes. Tente outro tema.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirm = () => {
        if (!theme.trim() || !classesGenerated) {
            setErrorMessage('Por favor, insira um tema e gere as classes.');
            return;
        }
        onConfirmSetup(theme, playerLimit);
    };

    return (
        <div className="w-full max-w-2xl container-bg rounded-lg shadow-2xl p-8">
            <h1 className="text-4xl title-font text-yellow-200 text-center mb-6">
                {isSolo ? 'Crie a sua Aventura a Solo' : 'Criar Aventura Multijogador'}
            </h1>
            <div className="mb-4">
                <label htmlFor="theme-input" className="block text-sm font-medium text-yellow-100 mb-2">O tema da vossa jornada:</label>
                <div className="flex gap-4">
                    <input type="text" id="theme-input" value={theme} onChange={(e) => setTheme(e.target.value)} className="flex-grow bg-gray-800 border border-gray-600 rounded-lg p-2 text-white focus:ring-yellow-400 focus:border-yellow-400" placeholder="Ex: 'Piratas em busca da fonte da juventude'..." />
                    <button onClick={handleGenerateClasses} disabled={isGenerating} className="secondary-button font-bold py-2 px-4 rounded-lg">
                        {isGenerating ? 'Gerando...' : 'Gerar Classes'}
                    </button>
                </div>
            </div>
            <div className="mb-4">
                <label htmlFor="player-limit" className="block text-sm font-medium text-yellow-100 mb-2">
                    {isSolo ? 'Tamanho da Comitiva:' : 'Limite de jogadores:'}
                </label>
                <select id="player-limit" value={playerLimit} onChange={(e) => setPlayerLimit(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white focus:ring-yellow-400 focus:border-yellow-400">
                    {isSolo ? (
                        <>
                            <option value="1">1 Herói</option>
                            <option value="2">2 Heróis</option>
                            <option value="3">3 Heróis</option>
                            <option value="4">4 Heróis</option>
                        </>
                    ) : (
                        <>
                            <option value="2">2 Jogadores</option>
                            <option value="3">3 Jogadores</option>
                            <option value="4">4 Jogadores</option>
                            <option value="5">5 Jogadores</option>
                            <option value="6">6 Jogadores</option>
                            <option value="7">7 Jogadores</option>
                            <option value="8">8 Jogadores</option>
                        </>
                    )}
                </select>
            </div>
            <div className="divider"></div>
            <p className="text-red-400 text-center mb-4 h-5">{errorMessage}</p>
            <button onClick={handleConfirm} className="w-full action-button title-font tracking-wider text-lg font-bold py-3 px-4 rounded-lg">Confirmar Tema e Classes</button>
        </div>
    );
};

export default SetupScreen;
