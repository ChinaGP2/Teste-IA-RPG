
import React from 'react';
import { Character } from '../types';

interface CharacterCardProps {
    character: Character;
    isActive: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, isActive }) => {
    const healthPercentage = (character.hp / character.maxHp) * 100;
    const isDowned = character.hp <= 0;

    const cardClasses = `p-2 rounded character-card ${isDowned ? 'downed' : ''} ${isActive ? 'active-turn' : ''}`;

    return (
        <div className={cardClasses}>
            <div className="flex justify-between items-center">
                <p className="font-bold text-lg text-yellow-100">{character.name}</p>
                <p className="text-sm text-gray-300">{character.hp} / {character.maxHp}</p>
            </div>
            <p className="text-sm text-gray-400 mb-1">{character.class}</p>
            <div className="health-bar-background w-full h-2">
                <div className="health-bar-foreground" style={{ width: `${healthPercentage}%` }}></div>
            </div>
        </div>
    );
};

export default CharacterCard;
