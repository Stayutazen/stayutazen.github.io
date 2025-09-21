import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyAzLgkWdpjaXjmQKe5usO1JNVMeDOOBsmY",
  authDomain: "graph-memorability.firebaseapp.com",
  projectId: "graph-memorability",
  storageBucket: "graph-memorability.firebasestorage.app",
  messagingSenderId: "69574821113",
  appId: "1:69574821113:web:55a4181ce60b7332e4ce28"
};
  
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, signInAnonymously, addDoc, collection };