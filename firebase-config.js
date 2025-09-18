// firebase-config.js

// [주석] 이 파일은 다른 스크립트에서 firebase 서비스를 사용하기 전에
// Firebase 앱을 초기화하는 역할을 한다.

// v7.20.0 이후 버전의 Firebase JS SDK의 경우, measurementId는 선택 사항.
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
// 이 코드를 통해 dashboard.html에서 로드한 Firebase 라이브러리가 활성화된다.
firebase.initializeApp(firebaseConfig);

// 다른 파일(dashboard.js 등)에서 `firebase.auth()`나 `firebase.firestore()` 같은
// 전역 `firebase` 객체를 통해 서비스에 접근할 수 있다.
const auth = firebase.auth();
const db = firebase.firestore();

// [수정] 파일 끝에 있던 불필요한 닫는 중괄호 '}'를 제거하여 구문 오류를 해결했다.