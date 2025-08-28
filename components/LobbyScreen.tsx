
import React from 'react';
import { GameState } from '../types';

interface LobbyScreenProps {
    gameState: GameState;
    roomCode: string;
    isHost: boolean;
    onStartGame: () => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ gameState, roomCode, isHost, onStartGame }) => {
    return (
        <div className="w-full max-w-md container-bg rounded-lg shadow-2xl p-8 text-center">
            <h2 className="text-2xl title-font text-yellow-200">Código da Sala:</h2>
            <p className="text-5xl font-bold tracking-widest my-4 bg-gray-900/50 p-4 rounded-lg">{roomCode}</p>
            <p className="text-yellow-100">Partilhe este código com os seus amigos.</p>
            <div className="divider"></div>
            <h3 className="text-xl title-font text-yellow-200">Comitiva Formada: {gameState.characters.length} / {gameState.playerLimit}</h3>
            <div className="my-4 text-left space-y-2">
                {gameState.characters.map(char => (
                    <div key={char.playerId} className="inventory-item p-2">
                        <p className="font-bold">{char.name} <span className="text-gray-400 font-normal">- {char.class}</span></p>
                    </div>
                ))}
            </div>
            {isHost ? (
                <button onClick={onStartGame} className="mt-4 action-button title-font tracking-wider text-lg font-bold py-3 px-4 rounded-lg">Iniciar Aventura</button>
            ) : (
                <p className="text-gray-400 italic">Aguardando o Mestre iniciar a aventura...</p>
            )}
        </div>
    );
};

export default LobbyScreen;
