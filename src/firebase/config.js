
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyATqnHscMegdI0IwENown7yCyU0hPRkkLQ",
  authDomain: "applytrack-app.firebaseapp.com",
  projectId: "applytrack-app",
  storageBucket: "applytrack-app.firebasestorage.app",
  messagingSenderId: "204317158337",
  appId: "1:204317158337:web:324615c381becf99159d40",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
