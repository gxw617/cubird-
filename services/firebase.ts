
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get, child, update, remove } from "firebase/database";
import { GameState } from "../types";

// Firebase Config - Must be set in Environment Variables (e.g. .env.local or Vercel)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase only if config is present
let db: any;
try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
} catch (e) {
    console.warn("Firebase config missing or invalid. Online play will not work.");
}

export const createRoom = async (roomId: string, initialState: GameState): Promise<boolean> => {
    if (!db) return false;
    try {
        await set(ref(db, 'rooms/' + roomId), {
            gameState: initialState,
            createdAt: Date.now(),
            players: {
                0: 'Host (Waiting...)', // Placeholder
            }
        });
        return true;
    } catch (e) {
        console.error("Error creating room:", e);
        return false;
    }
};

export const joinRoom = async (roomId: string): Promise<{ success: boolean; gameState?: GameState }> => {
    if (!db) return { success: false };
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, `rooms/${roomId}`));
        if (snapshot.exists()) {
            const data = snapshot.val();
            return { success: true, gameState: data.gameState };
        } else {
            return { success: false };
        }
    } catch (e) {
        console.error("Error joining room:", e);
        return { success: false };
    }
};

export const subscribeToRoom = (roomId: string, onUpdate: (state: GameState) => void) => {
    if (!db) return () => {};
    const roomRef = ref(db, 'rooms/' + roomId + '/gameState');
    const unsubscribe = onValue(roomRef, (snapshot) => {
        const state = snapshot.val();
        if (state) {
            onUpdate(state);
        }
    });
    return unsubscribe;
};

export const updateGameState = async (roomId: string, newState: GameState) => {
    if (!db) return;
    try {
        await set(ref(db, 'rooms/' + roomId + '/gameState'), newState);
    } catch (e) {
        console.error("Error updating game state:", e);
    }
};

export const cleanupRoom = async (roomId: string) => {
    if (!db) return;
    // Optional: Delete room when finished to save space
    // await remove(ref(db, 'rooms/' + roomId));
};
