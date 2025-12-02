
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, MoveType, BirdType } from '../types';
import { BIRD_DATA } from '../constants';

let genAI: GoogleGenAI | null = null;

export const initGemini = () => {
  if (process.env.API_KEY) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
};

export const getAiMove = async (gameState: GameState): Promise<{ moveType: MoveType, birdType: BirdType, rowIndex?: number, side?: 'LEFT' | 'RIGHT' } | null> => {
  if (!genAI) {
    console.warn("Gemini API Key not found");
    return null;
  }

  const aiPlayer = gameState.players.find(p => p.isAi);
  if (!aiPlayer) return null;

  // Simplify state for AI prompt
  const simpleState = {
    myHand: aiPlayer.hand,
    myCollection: aiPlayer.collection,
    opponentCollection: gameState.players.find(p => !p.isAi)?.collection || {},
    rows: gameState.rows,
  };

  const prompt = `
    You are playing Cubirds.
    Current State: ${JSON.stringify(simpleState)}
    
    Rules:
    - You MUST Play ALL cards of one species to the LEFT or RIGHT of a row.
    - If you surround birds of a DIFFERENT species, you capture them.
    - If you don't capture, you draw 2 cards.
    
    Goal: Capture cards that help you complete flocks (sets). Avoid running out of cards too early unless you have a good collection.
    
    Task: Return the best PLAY move. Do not worry about Flocking yet, that happens after.
    
    Respond with JSON:
    {
        "birdType": "Parrot" | ... (string),
        "rowIndex": 0-3,
        "side": "LEFT" | "RIGHT"
    }
  `;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            birdType: { type: Type.STRING },
            rowIndex: { type: Type.INTEGER },
            side: { type: Type.STRING, enum: ['LEFT', 'RIGHT'] }
          },
          required: ['birdType', 'rowIndex', 'side']
        }
      }
    });

    const text = response.text;
    if (text) {
      const result = JSON.parse(text);
      return {
          moveType: MoveType.PLAY,
          birdType: result.birdType,
          rowIndex: result.rowIndex,
          side: result.side
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting AI move:", error);
    return null;
  }
};
