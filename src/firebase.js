import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxtp__JimFxU6zt6LtWi0fNrlio4q67_c",
  authDomain: "reading-buddy-c7041.firebaseapp.com",
  projectId: "reading-buddy-c7041",
  storageBucket: "reading-buddy-c7041.firebasestorage.app",
  messagingSenderId: "761499050727",
  appId: "1:761499050727:web:41ecde77cee60678717842",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Secondary app for admin tasks (creating users without logging out)
export const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
export const secondaryAuth = getAuth(secondaryApp);
