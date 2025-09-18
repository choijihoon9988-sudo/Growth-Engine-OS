// firebase-config.js

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
// [수정] compat 라이브러리를 사용하므로 firebase.initializeApp()을 그대로 사용합니다.
firebase.initializeApp(firebaseConfig);

// 다른 파일에서 사용할 수 있도록 Firebase 서비스들을 export 합니다.
// [수정] compat 버전에서는 아래와 같이 auth, db를 전역 firebase 객체에서 가져옵니다.
const auth = firebase.auth();
const db = firebase.firestore();

// [수정] 불필요한 닫는 괄호 '}'를 제거하여 문법 오류를 수정했습니다.