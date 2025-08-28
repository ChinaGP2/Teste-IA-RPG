
import React from 'react';

interface EntryScreenProps {
    onSoloPlay: () => void;
    onCreateRoom: () => void;
    onJoinRoom: () => void;
    authStatus: string;
    isAuthReady: boolean;
}

const EntryScreen: React.FC<EntryScreenProps> = ({ onSoloPlay, onCreateRoom, onJoinRoom, authStatus, isAuthReady }) => {
    return (
        <div className="w-full max-w-md container-bg rounded-lg shadow-2xl p-8 text-center">
            <h1 className="text-5xl title-font text-yellow-200 mb-8">Crónicas da IA</h1>
            <div className="space-y-4">
                <button 
                    onClick={onSoloPlay} 
                    className="w-full action-button title-font tracking-wider text-lg font-bold py-3 px-4 rounded-lg"
                    disabled={!isAuthReady}
                >
                    Jogar a Solo
                </button>
                <button 
                    onClick={onCreateRoom}
                    className="w-full secondary-button title-font tracking-wider text-lg font-bold py-3 px-4 rounded-lg"
                    disabled={!isAuthReady}
                >
                    Criar Sala Multijogador
                </button>
                <button 
                    onClick={onJoinRoom}
                    className="w-full secondary-button title-font tracking-wider text-lg font-bold py-3 px-4 rounded-lg"
                    disabled={!isAuthReady}
                >
                    Entrar numa Sala
                </button>
            </div>
            <p className="text-gray-400 mt-4 text-sm h-10">{authStatus}</p>
        </div>
    );
};

export default EntryScreen;
