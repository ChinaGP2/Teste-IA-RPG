
import React, { useState } from 'react';
import { GameState } from '../types';

interface CharacterCreationScreenProps {
    gameState: GameState;
    onConfirmCharacter: (name: string, pClass: string, backstory: string) => void;
}

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ gameState, onConfirmCharacter }) => {
    const [name, setName] = useState('');
    const [pClass, setPClass] = useState(gameState.generatedClasses[0] || '');
    const [backstory, setBackstory] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleConfirm = () => {
        if (!name.trim() || !backstory.trim() || !pClass) {
            setErrorMessage('Por favor, preencha todos os campos.');
            return;
        }
        setErrorMessage('');
        onConfirmCharacter(name, pClass, backstory);
        if (gameState.isSolo) {
            setName('');
            setBackstory('');
            setPClass(gameState.generatedClasses[0] || '');
        }
    };

    const titleText = gameState.isSolo 
        ? `Crie o Herói ${gameState.characters.length + 1} de ${gameState.playerLimit}`
        : 'Crie o seu Herói';

    const buttonText = gameState.isSolo && (gameState.characters.length + 1 >= gameState.playerLimit)
        ? 'Confirmar e Iniciar Aventura'
        : 'Confirmar Herói';


    return (
        <div className="w-full max-w-2xl container-bg rounded-lg shadow-2xl p-8">
            <h1 className="text-4xl title-font text-yellow-200 text-center mb-6">{titleText}</h1>
            <div className="p-4 border border-yellow-200/20 rounded-lg space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do Herói" className="w-full sm:flex-grow bg-gray-800 border border-gray-600 rounded-lg p-2 text-white focus:ring-yellow-400 focus:border-yellow-400" />
                    <select value={pClass} onChange={(e) => setPClass(e.target.value)} className="w-full sm:w-48 bg-gray-800 border border-gray-600 rounded-lg p-2 text-white focus:ring-yellow-400 focus:border-yellow-400">
                        {gameState.generatedClasses.length > 0 ? (
                            gameState.generatedClasses.map(c => <option key={c} value={c}>{c}</option>)
                        ) : (
                            <option>Aguardando classes...</option>
                        )}
                    </select>
                </div>
                <textarea value={backstory} onChange={(e) => setBackstory(e.target.value)} placeholder="Uma breve história do herói..." className="w-full mt-2 bg-gray-800 border border-gray-600 rounded-lg p-2 text-white text-sm focus:ring-yellow-400 focus:border-yellow-400" rows={3}></textarea>
            </div>
            <p className="text-red-400 text-center my-4 h-5">{errorMessage}</p>
            <button onClick={handleConfirm} className="w-full action-button title-font tracking-wider text-lg font-bold py-3 px-4 rounded-lg">{buttonText}</button>
        </div>
    );
};

export default CharacterCreationScreen;
