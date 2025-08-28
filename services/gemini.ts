
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, StoryUpdate } from '../types';

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateClasses = async (theme: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `O tema é: "${theme}".`,
            config: {
                systemInstruction: `Você é um criador de mundos de RPG. Baseado no tema fornecido, gere uma lista de 4 classes de personagens que se encaixem perfeitamente nesse universo.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        classes: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Uma lista de 4 nomes de classes de personagens de RPG."
                        }
                    }
                }
            }
        });
        const result = JSON.parse(response.text);
        return result.classes;
    } catch (error) {
        console.error("Error generating classes:", error);
        throw new Error("Failed to generate character classes from AI.");
    }
};

export const generateStoryNode = async (gameState: GameState, action: string, diceRoll: number): Promise<StoryUpdate> => {
    const charactersInfo = gameState.characters.map(c => `${c.name} (Classe: ${c.class}, HP: ${c.hp}/${c.maxHp}, História: ${c.backstory})`).join('; ');
    const systemInstruction = `
        Você é um Mestre de RPG. O tema é "${gameState.theme}". Os heróis são: ${charactersInfo}.
        O inventário contém: ${gameState.inventory.join(', ') || 'nada'}.
        Resumo da história: ${gameState.storySummary}.
        A posição atual no mapa (x,y em percentagem) é (${gameState.map.currentPosition.x}%, ${gameState.map.currentPosition.y}%).

        O jogador realizou uma ação com um resultado de d20. Narre o resultado.
        - 1: Falha Crítica.
        - 2-10: Falha.
        - 11-19: Sucesso.
        - 20: Sucesso Crítico.

        Sua resposta DEVE ser um objeto JSON válido.
        A história é em português do Brasil.
    `;
    const userQuery = `Ação do jogador: "${action}". Rolagem de d20: ${diceRoll}. Gere a narração e todos os outros campos do JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userQuery,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING, description: "Narração vívida do resultado da ação." },
                        image_prompt: { type: Type.STRING, description: "Um prompt curto, em inglês, para gerar uma imagem da cena. Ex: 'fantasy painting of a warrior facing a dragon in a dark cave'." },
                        choices: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: { text: { type: Type.STRING } }
                            },
                            description: "Três sugestões de próximas ações para o jogador."
                        },
                        found_items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de itens encontrados, se houver." },
                        health_changes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    character_name: { type: Type.STRING },
                                    change: { type: Type.INTEGER, description: "Mudança na vida (negativo para dano, positivo para cura)." }
                                }
                            },
                            description: "Lista de mudanças na vida dos personagens."
                        },
                        map_update: {
                            type: Type.OBJECT,
                            properties: {
                                x: { type: Type.NUMBER, description: "Nova coordenada X (0-100)." },
                                y: { type: Type.NUMBER, description: "Nova coordenada Y (0-100)." },
                                location_name: { type: Type.STRING, description: "Nome do novo local." },
                                icon: { type: Type.STRING, description: "Um único emoji para o local." }
                            },
                            description: "Atualização da posição no mapa, se o grupo se moveu."
                        },
                        story_summary: { type: Type.STRING, description: "Um resumo atualizado dos eventos chave da aventura." }
                    }
                }
            }
        });
        
        return JSON.parse(response.text) as StoryUpdate;
    } catch (error) {
        console.error("Error generating story node:", error);
        throw new Error("Failed to generate story from AI.");
    }
};

export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error("No image generated");
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image.");
    }
};
