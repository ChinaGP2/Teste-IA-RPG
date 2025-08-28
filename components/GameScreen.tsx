
import React, { useState, useEffect, useRef } from 'react';
import { GameState } from '../types';
import { generateImage } from '../services/gemini';
import CharacterCard from './CharacterCard';
// @ts-ignore
import Tone from 'tone';

interface GameScreenProps {
    gameState: GameState;
    isMyTurn: boolean;
    onPerformAction: (action: string, roll: number) => void;
    onExit: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameState, isMyTurn, onPerformAction, onExit }) => {
    const [action, setAction] = useState('');
    const [diceRoll, setDiceRoll] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [typedStory, setTypedStory] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const storyText = gameState.lastUpdate?.text || '';

    const synth = useRef<any>(null);

    useEffect(() => {
        if (!synth.current) {
            synth.current = new Tone.Synth().toDestination();
        }
    }, []);

    useEffect(() => {
        setTypedStory('');
        let i = 0;
        const typeWriter = () => {
            if (i < storyText.length) {
                setTypedStory(prev => prev + storyText.charAt(i));
                i++;
                setTimeout(typeWriter, 20);
            }
        };
        typeWriter();

        return () => {
            speechSynthesis.cancel();
            setIsSpeaking(false);
        };
    }, [storyText]);
    
    useEffect(() => {
        if (gameState.lastUpdate?.image_prompt && !imageUrl) {
            setIsGeneratingImage(true);
            generateImage(gameState.lastUpdate.image_prompt)
                .then(setImageUrl)
                .catch(err => console.error("Failed to load image", err))
                .finally(() => setIsGeneratingImage(false));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState.lastUpdate?.image_prompt]);

    const handleAction = () => {
        const roll = parseInt(diceRoll, 10);
        if (!action.trim() || isNaN(roll) || roll < 1 || roll > 20) {
            setErrorMessage('Descreva sua ação e insira uma rolagem de d20 válida (1-20).');
            return;
        }
        setErrorMessage('');
        onPerformAction(action, roll);
        setAction('');
        setDiceRoll('');

        if (Tone.context.state !== 'running') {
            Tone.start();
        }
        if (roll >= 11) {
            synth.current.triggerAttackRelease("C4", "8n", Tone.now());
            synth.current.triggerAttackRelease("G4", "8n", Tone.now() + 0.2);
        } else {
            synth.current.triggerAttackRelease("F#2", "8n");
        }
    };
    
    const handleToggleNarration = () => {
        if (isSpeaking) {
            speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }
        if (!storyText) return;
        const utterance = new SpeechSynthesisUtterance(storyText);
        const voices = speechSynthesis.getVoices();
        const ptVoice = voices.find(voice => voice.lang.startsWith('pt'));
        if (ptVoice) utterance.voice = ptVoice;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        speechSynthesis.speak(utterance);
    };

    return (
        <div className="w-full max-w-5xl container-bg rounded-lg shadow-2xl p-8 relative">
            <button onClick={onExit} className="absolute top-4 right-4 text-gray-400 hover:text-white" title="Sair da Sessão">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-grow">
                    <div className="w-full h-64 bg-gray-900/50 rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-gray-700">
                       {isGeneratingImage ? <div className="spinner"></div> : imageUrl ? <img src={imageUrl} alt="Cena da aventura" className="w-full h-full object-cover"/> : <p className="text-yellow-200 title-font">A sua aventura começará em breve...</p>}
                    </div>
                    <div className="relative">
                        <button onClick={handleToggleNarration} className={`absolute top-0 right-0 p-2 rounded-full text-yellow-400 hover:text-yellow-200 narrate-btn ${isSpeaking ? 'speaking' : ''}`} title="Narrar texto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.964 15.964a2 2 0 01-2.828 0l-1.13-1.13a2 2 0 00-2.828 0L7.05 17.05a2 2 0 01-2.828 0L2.828 15.657a2 2 0 010-2.828l1.414-1.414a2 2 0 000-2.828L2.828 7.172a2 2 0 010-2.828l1.414-1.414a2 2 0 012.828 0L9.12 4.98a2 2 0 002.828 0l1.13-1.13a2 2 0 012.828 0l1.414 1.414a2 2 0 010 2.828l-1.414 1.414a2 2 0 000 2.828l1.414 1.414a2 2 0 010 2.828l-1.414 1.414z" /></svg>
                        </button>
                        <div className="mb-4 min-h-[150px] pr-10">
                            <p className="text-xl story-text text-gray-300 leading-relaxed">{typedStory}</p>
                        </div>
                    </div>
                    <div className="divider"></div>
                    <div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-yellow-100 mb-2">Sugestões da IA:</label>
                            <div className="flex flex-wrap gap-2">
                                {gameState.lastUpdate?.choices.map((choice, i) => (
                                    <div key={i} onClick={() => isMyTurn && setAction(choice.text)} className="suggestion-chip text-sky-100 text-sm py-1 px-3 rounded-full">{choice.text}</div>
                                ))}
                            </div>
                        </div>
                        <label htmlFor="action-input" className="block text-sm font-medium text-yellow-100 mb-2">O que você faz?</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input type="text" value={action} onChange={e => setAction(e.target.value)} disabled={!isMyTurn} className="flex-grow bg-gray-800 border border-gray-600 rounded-lg p-2 text-white focus:ring-yellow-400 focus:border-yellow-400" placeholder={isMyTurn ? "É a sua vez de agir!" : `Aguardando a vez de ${gameState.characters[gameState.activeCharacterIndex]?.name}...`} />
                            <input type="number" value={diceRoll} onChange={e => setDiceRoll(e.target.value)} disabled={!isMyTurn} className="bg-gray-800 border border-gray-600 rounded-lg p-2 text-white w-full sm:w-28 text-center" placeholder="d20" min="1" max="20" />
                            <button onClick={handleAction} disabled={!isMyTurn} className="action-button font-bold py-2 px-6 rounded-lg w-full sm:w-auto">Agir!</button>
                        </div>
                        <p className="text-red-400 text-center mt-2 h-5">{errorMessage}</p>
                        <p className="text-xs text-gray-500 text-center mt-2">O progresso é guardado automaticamente após cada ação.</p>
                    </div>
                </div>
                <div className="w-full lg:w-80 flex-shrink-0">
                    <h2 className="title-font text-2xl text-yellow-200 mb-4">Comitiva</h2>
                    <div className="space-y-4 mb-6">
                        {gameState.characters.map((char, index) => (
                            <CharacterCard key={char.playerId + char.name} character={char} isActive={index === gameState.activeCharacterIndex} />
                        ))}
                    </div>
                    <div className="divider"></div>
                    <h2 className="title-font text-2xl text-yellow-200 mb-4">Inventário</h2>
                    <div className="space-y-2 mb-6">
                        {gameState.inventory.length > 0 ? gameState.inventory.map((item, i) => (
                            <div key={i} className="inventory-item text-gray-300 p-2 rounded">{item}</div>
                        )) : <p className="text-gray-500 italic">A bolsa está vazia.</p>}
                    </div>
                    <div className="divider"></div>
                    <h2 className="title-font text-2xl text-yellow-200 mb-4">Mapa do Mundo</h2>
                    <div className="map-container">
                        <div className="fog-of-war" style={{ WebkitMaskPosition: `${gameState.map.currentPosition.x}% ${gameState.map.currentPosition.y}%`, maskPosition: `${gameState.map.currentPosition.x}% ${gameState.map.currentPosition.y}%`}}></div>
                        <div>
                            {gameState.map.locations.map((loc, i) => (
                                <div key={i} className="map-marker" style={{ left: `${loc.x}%`, top: `${loc.y}%` }} title={loc.location_name}>{loc.icon || '📍'}</div>
                            ))}
                             <div className="map-marker player-marker" style={{ left: `${gameState.map.currentPosition.x}%`, top: `${gameState.map.currentPosition.y}%` }} title="Sua Posição">⚔️</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameScreen;
