
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import { Unsubscribe } from 'firebase/firestore';

import { Screen, GameState, Character } from './types';
import { LOADING_PHRASES } from './constants';
import * as firebase from './services/firebase';
import * as gemini from './services/gemini';

import EntryScreen from './components/EntryScreen';
import JoinRoomScreen from './components/JoinRoomScreen';
import SetupScreen from './components/SetupScreen';
import CharacterCreationScreen from './components/CharacterCreationScreen';
import LobbyScreen from './components/LobbyScreen';
import GameScreen from './components/GameScreen';
import LoadingOverlay from './components/LoadingOverlay';

const App: React.FC = () => {
    const [screen, setScreen] = useState<Screen>('entry');
    const [authStatus, setAuthStatus] = useState('A ligar ao servidor...');
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('');
    const [joinErrorMessage, setJoinErrorMessage] = useState('');
    
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);

    useEffect(() => {
        let unsubscribe: Unsubscribe | null = null;
        
        firebase.onAuthChange(async (user) => {
            if (user) {
                setCurrentUser(user);
                setAuthStatus('Ligado!');
                setIsAuthReady(true);
                setTimeout(() => setAuthStatus(''), 2000);
            } else {
                try {
                    await firebase.signIn();
                } catch (error) {
                    console.error("Authentication failed:", error);
                    setAuthStatus('Erro de ligação. Verifique a configuração.');
                }
            }
        });

        if (roomCode) {
            unsubscribe = firebase.listenToRoom(roomCode, (data) => {
                if (data) {
                    setGameState(data as GameState);
                    // Determine current screen based on game state
                    if (data.status === 'playing') {
                        setScreen('game');
                    } else if (data.status === 'setup') {
                        setScreen('setup');
                    } else if (data.status === 'solo_character_creation' && data.isSolo) {
                         setScreen('character_creation');
                    } else if (data.status === 'lobby') {
                        const myChar = data.characters.find((c: Character) => c.playerId === currentUser?.uid);
                        if (!myChar && !data.isSolo) {
                            setScreen('character_creation');
                        } else {
                            setScreen('lobby');
                        }
                    }
                } else {
                    alert("A sala de jogo já não existe. A regressar ao menu principal.");
                    handleExit();
                }
            });
        }
        
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
        
    }, [roomCode, currentUser?.uid]);
    
    const showLoading = (show: boolean) => {
        if (show) {
            const randomIndex = Math.floor(Math.random() * LOADING_PHRASES.length);
            setLoadingText(LOADING_PHRASES[randomIndex]);
        }
        setIsLoading(show);
    };

    const handleCreateRoom = async (isSolo: boolean) => {
        if (!currentUser) return;
        const newRoomCode = await firebase.createRoom(currentUser.uid, isSolo);
        setRoomCode(newRoomCode);
        setScreen(isSolo ? 'setup' : 'setup');
    };

    const handleJoinRoom = async (code: string) => {
        setJoinErrorMessage('');
        const roomExists = await firebase.checkRoomExists(code);
        if (roomExists) {
            setRoomCode(code);
        } else {
            setJoinErrorMessage('Sala não encontrada.');
        }
    };
    
    const handleConfirmSetup = async (theme: string, playerLimit: number) => {
        if (!roomCode || !gameState) return;
        const newStatus = gameState.isSolo ? 'solo_character_creation' : 'lobby';
        await firebase.updateRoom(roomCode, { theme, playerLimit, status: newStatus });
    };

    const handleUpdateClasses = async (classes: string[]) => {
        if (!roomCode) return;
        await firebase.updateRoom(roomCode, { generatedClasses: classes });
    };

    const handleConfirmCharacter = async (name: string, pClass: string, backstory: string) => {
        if (!roomCode || !gameState || !currentUser) return;
        const newCharacter: Omit<Character, 'hp' | 'maxHp'> = { name, class: pClass, backstory, playerId: currentUser.uid };
        
        if (gameState.isSolo && gameState.characters.length + 1 >= gameState.playerLimit) {
            await firebase.addCharacterToRoom(roomCode, newCharacter);
            await firebase.updateRoom(roomCode, { status: 'playing' });
            await performAction("A aventura começa.", Math.floor(Math.random() * 20) + 1);
        } else {
            await firebase.addCharacterToRoom(roomCode, newCharacter);
        }
    };

    const handleStartGame = async () => {
        if (!roomCode || !gameState) return;
        if (gameState.characters.length < gameState.playerLimit && !gameState.isSolo) {
            alert('Aguarde que todos os jogadores criem os seus personagens.');
            return;
        }
        await firebase.updateRoom(roomCode, { status: 'playing' });
        await performAction("A aventura começa.", Math.floor(Math.random() * 20) + 1);
    };

    const performAction = useCallback(async (action: string, roll: number) => {
        if (!roomCode || !gameState) return;
        showLoading(true);
        try {
            const updateData = await gemini.generateStoryNode(gameState, action, roll);
            
            const newGameState = { ...gameState };
            if (updateData.found_items) newGameState.inventory.push(...updateData.found_items);
            if (updateData.health_changes) {
                updateData.health_changes.forEach(change => {
                    const char = newGameState.characters.find(c => c.name === change.character_name);
                    if (char) char.hp = Math.max(0, Math.min(char.maxHp, char.hp + change.change));
                });
            }
            if (updateData.map_update) {
                newGameState.map.currentPosition = { x: updateData.map_update.x, y: updateData.map_update.y };
                const existingLocation = newGameState.map.locations.find(loc => loc.x === updateData.map_update.x && loc.y === updateData.map_update.y);
                if (!existingLocation) {
                    newGameState.map.locations.push({ ...updateData.map_update });
                }
            }
            newGameState.storySummary = updateData.story_summary || newGameState.storySummary;
            newGameState.lastUpdate = updateData;
            newGameState.activeCharacterIndex = (newGameState.activeCharacterIndex + 1) % newGameState.characters.length;

            await firebase.updateRoom(roomCode, newGameState);

        } catch (error) {
            console.error("Error performing action:", error);
            alert("Oh, não! Os ventos da magia parecem instáveis. Tente novamente.");
        } finally {
            showLoading(false);
        }
    }, [roomCode, gameState]);

    const handleExit = () => {
        setRoomCode(null);
        setGameState(null);
        setScreen('entry');
    };

    const isMyTurn = useMemo(() => {
        if (!gameState || !currentUser || gameState.status !== 'playing') return false;
        if (gameState.isSolo) return true;
        const activeCharacter = gameState.characters[gameState.activeCharacterIndex];
        return activeCharacter?.playerId === currentUser.uid;
    }, [gameState, currentUser]);

    const renderContent = () => {
        switch (screen) {
            case 'entry':
                return <EntryScreen 
                    onSoloPlay={() => handleCreateRoom(true)} 
                    onCreateRoom={() => handleCreateRoom(false)}
                    onJoinRoom={() => setScreen('join')}
                    authStatus={authStatus}
                    isAuthReady={isAuthReady}
                />;
            case 'join':
                return <JoinRoomScreen
                    onConfirmJoin={handleJoinRoom}
                    onBack={() => setScreen('entry')}
                    errorMessage={joinErrorMessage}
                />;
            case 'setup':
                if (gameState) return <SetupScreen 
                    isSolo={gameState.isSolo}
                    onConfirmSetup={handleConfirmSetup}
                    onUpdateClasses={handleUpdateClasses}
                />;
                return null;
            case 'character_creation':
                 if (gameState) return <CharacterCreationScreen
                    gameState={gameState}
                    onConfirmCharacter={handleConfirmCharacter}
                />;
                return null;
            case 'lobby':
                if (gameState && roomCode && currentUser) return <LobbyScreen
                    gameState={gameState}
                    roomCode={roomCode}
                    isHost={gameState.hostId === currentUser.uid}
                    onStartGame={handleStartGame}
                />;
                return null;
            case 'game':
                if (gameState) return <GameScreen
                    gameState={gameState}
                    isMyTurn={isMyTurn}
                    onPerformAction={performAction}
                    onExit={handleExit}
                />;
                return null;
            default:
                return <div>Error: Unknown screen</div>;
        }
    };

    return (
        <>
            {isLoading && <LoadingOverlay text={loadingText} />}
            {renderContent()}
        </>
    );
};

export default App;
