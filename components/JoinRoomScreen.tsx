
import React, { useState } from 'react';

interface JoinRoomScreenProps {
    onConfirmJoin: (roomCode: string) => void;
    onBack: () => void;
    errorMessage: string;
}

const JoinRoomScreen: React.FC<JoinRoomScreenProps> = ({ onConfirmJoin, onBack, errorMessage }) => {
    const [roomCode, setRoomCode] = useState('');

    const handleConfirm = () => {
        if (roomCode.trim().length === 6) {
            onConfirmJoin(roomCode.trim().toUpperCase());
        }
    };

    return (
        <div className="w-full max-w-md container-bg rounded-lg shadow-2xl p-8">
            <h1 className="text-4xl title-font text-yellow-200 text-center mb-6">Entrar na Aventura</h1>
            <input 
                type="text" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white text-center text-2xl tracking-widest uppercase" 
                placeholder="CÓDIGO DA SALA" 
                maxLength={6}
            />
            <p className="text-red-400 text-center mt-4 h-5">{errorMessage}</p>
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <button onClick={onBack} className="w-full secondary-button title-font tracking-wider text-lg font-bold py-3 px-4 rounded-lg">Voltar</button>
                <button onClick={handleConfirm} className="w-full action-button title-font tracking-wider text-lg font-bold py-3 px-4 rounded-lg">Entrar</button>
            </div>
        </div>
    );
};

export default JoinRoomScreen;
