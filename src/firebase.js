import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCzttVYqsKwgllCiW7za9hyZsmT08Y_MIA",
  authDomain: "voltcare-b9b5a.firebaseapp.com",
  projectId: "voltcare-b9b5a",
  storageBucket: "voltcare-b9b5a.firebasestorage.app",
  messagingSenderId: "898951143903",
  appId: "1:898951143903:web:91dc90bc758647258aa46a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
