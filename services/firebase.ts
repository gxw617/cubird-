import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, get, child, update, remove } from "firebase/database";
import { GameState } from "../types";

// Firebase Config - Hardcoded to ensure connection works immediately
const firebaseConfig = {
  apiKey: "AIzaSyDJ6R9oSVOjUZvjXfvTzdHTQI6jYqYWf8Q",
  authDomain: "cubirds-aeeac.firebaseapp.com",
  databaseURL: "https://cubirds-aeeac-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "cubirds-aeeac",
  storageBucket: "cubirds-aeeac.firebasestorage.app",
  messagingSenderId: "602317579938",
  appId: "1:602317579938:web:70b21208029f012ccb59fb"
};

let db: any = null;

try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("Firebase initialized successfully with provided config");
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

export const createRoom = async (roomId: string, initialState: GameState): Promise<boolean> => {
    if (!db) {
        console.error("Cannot create room: Firebase not initialized.");
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
        console.error("Cannot join room: Firebase not initialized.");
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

export const subscribeToRoom = (roomId: string, onUpdate: (state: GameState | null) => void) => {
    if (!db) return () => {};
    const roomRef = ref(db, 'rooms/' + roomId + '/gameState');
    const unsubscribe = onValue(roomRef, (snapshot) => {
        // If snapshot doesn't exist, room was deleted
        if (snapshot.exists()) {
            onUpdate(snapshot.val());
        } else {
            onUpdate(null); // Signal deletion
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

export const deleteRoom = async (roomId: string) => {
    if (!db) return;
    try {
        await remove(ref(db, 'rooms/' + roomId));
    } catch (e) {
        console.error("Error deleting room:", e);
    }
};

export const cleanupRoom = async (roomId: string) => {
    // Alias for deleteRoom if needed, but keeping separate for clarity
    await deleteRoom(roomId);
};