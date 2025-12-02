
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get, child, update, remove } from "firebase/database";
import { GameState } from "../types";

// Firebase Config - Must be set in Environment Variables (e.g. .env.local or Vercel)
// We use '|| ""' to ensure they are strings, preventing undefined issues
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "",
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || ""
};

let db: any = null;

// Helper: Check if critical config keys are present
const isConfigValid = () => {
    return (
        firebaseConfig.apiKey.length > 0 &&
        firebaseConfig.projectId.length > 0 &&
        firebaseConfig.databaseURL.length > 0
    );
};

if (isConfigValid()) {
    try {
        const app = initializeApp(firebaseConfig);
        db = getDatabase(app);
        console.log("Firebase initialized successfully");
    } catch (e) {
        console.warn("Firebase config appeared valid but initialization failed:", e);
    }
} else {
    // Graceful fallback: Don't crash, just disable online features
    console.warn("Firebase configuration missing or incomplete. Online features are disabled.");
    // Log missing keys for debugging (checking length to avoid logging secrets)
    const missing = Object.entries(firebaseConfig)
        .filter(([_, val]) => !val || val.length === 0)
        .map(([key]) => key);
    if (missing.length > 0) {
        console.debug("Missing env vars:", missing.join(", "));
    }
}

export const createRoom = async (roomId: string, initialState: GameState): Promise<boolean> => {
    if (!db) {
        console.error("Cannot create room: Firebase is not configured.");
        return false;
    }
    try {
        await set(ref(db, 'rooms/' + roomId), {
            gameState: initialState,
            createdAt: Date.now(),
            players: {
                0: 'Host (Waiting...)', 
            }
        });
        return true;
    } catch (e) {
        console.error("Error creating room:", e);
        return false;
    }
};

export const joinRoom = async (roomId: string): Promise<{ success: boolean; gameState?: GameState }> => {
    if (!db) {
        console.error("Cannot join room: Firebase is not configured.");
        return { success: false };
    }
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
    // Optional: Delete room when finished
    // await remove(ref(db, 'rooms/' + roomId));
};
