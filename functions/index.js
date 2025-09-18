const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

// .env 파일을 사용하기 위한 설정
require("dotenv").config({ path: '.env.local' });

admin.initializeApp();
const db = admin.firestore();

// .env 파일에서 제미나이 API 키를 가져옴
const GEMINI_API_KEY = process.env.GEMINI_KEY;

exports.generateSummary = functions.region("asia-northeast3")
    .firestore.document("users/{userId}/writings/{writingId}")
    .onWrite(async (change, context) => {
        if (!change.after.exists) {
            return null;
        }

        const data = change.after.data();
        const content = data.content;

        if (data.summary || !content || content.length < 50) {
            return null;
        }

        if (change.before.exists && content === change.before.data().content) {
            return null;
        }
        
        if (!GEMINI_API_KEY) {
             console.error("제미나이 API 키가 설정되지 않았습니다.");
             return change.after.ref.update({ summary: "오류: API 키 없음" });
        }

        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
            const requestData = {
                contents: [{
                    parts: [{
                        text: `${content}\n\n---\n위 텍스트의 핵심 내용을 한국어로 한 문장 요약:`
                    }]
                }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 100,
                }
            };

            const response = await axios.post(apiUrl, requestData, {
                headers: { "Content-Type": "application/json" }
            });

            if (response.data.candidates && response.data.candidates.length > 0) {
                const summary = response.data.candidates[0].content.parts[0].text.trim();
                return change.after.ref.update({ summary: summary });
            } else {
                return change.after.ref.update({ summary: "요약 생성 불가" });
            }

        } catch (error) {
            console.error("제미나이 API 호출 실패:", error.response ? error.response.data : error.message);
            return change.after.ref.update({ summary: "요약 생성 실패" });
        }
    });