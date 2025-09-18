// firebase-config.js
/// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDJJLSOPg-nExI-nISWbS-NPwIPsiO3-VI",
  authDomain: "growth-engine-9c6ab.firebaseapp.com",
  projectId: "growth-engine-9c6ab",
  storageBucket: "growth-engine-9c6ab.firebasestorage.app",
  messagingSenderId: "90122365916",
  appId: "1:90122365916:web:a41acfdac4699bcd067d19",
  measurementId: "G-T8JC3C73RM"
};

// Firebase 앱 초기화
firebase.initializeApp(firebaseConfig);

// 다른 파일에서 사용할 수 있도록 Firebase 서비스들을 export 합니다.
const auth = firebase.auth();
const db = firebase.firestore();