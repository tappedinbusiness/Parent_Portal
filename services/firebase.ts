import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// NOTE: This is an example configuration.
// For a real application, replace with your web app's Firebase configuration.
const firebaseConfig = {
  apiKey: "AIzaSyC...-example",
  authDomain: "ua-parent-forum-ai.firebaseapp.com",
  projectId: "ua-parent-forum-ai",
  storageBucket: "ua-parent-forum-ai.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:a1b2c3d4e5f6a7b8c9d0e1"
};

// Initialize Firebase
if (firebaseConfig.apiKey === "AIzaSyC...-example" || firebaseConfig.projectId === "ua-parent-forum-ai") {
    // This check is now just for the example case, in a real app you'd remove it or keep the original check.
    // We proceed with initialization for this demo.
}

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const firestore = firebase.firestore();