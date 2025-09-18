// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소
    const loginScreen = document.getElementById('login-screen');
    const mainContent = document.querySelector('.main-content');
    const sidebar = document.querySelector('.sidebar');
    const loginForm = document.getElementById('login-form');
    const userEmailDisplay = document.getElementById('user-email');
    const logoutButton = document.getElementById('logout-button');
    // [수정] 구글 로그인 버튼 요소 추가
    const googleLoginButton = document.getElementById('google-login-btn');

    let currentUser = null;
    let dbRefs = {};
    let unsubscribeListeners = [];
    let charts = {};

    // --- 인증 ---
    auth.onAuthStateChanged(user => {
        if (user) {
            // 사용자가 로그인된 경우
            currentUser = user;
            loginScreen.classList.remove('active');
            sidebar.style.display = 'flex';
            document.querySelector('#today-view').classList.add('active');
            userEmailDisplay.textContent = user.email;
            initializeDashboard();
        } else {
            // 사용자가 로그아웃된 경우
            currentUser = null;
            sidebar.style.display = 'none';
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            loginScreen.classList.add('active');
            cleanupListeners();
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm['login-email'].value;
        const password = loginForm['login-password'].value;
        auth.signInWithEmailAndPassword(email, password)
            .catch(error => {
                document.getElementById('login-error').textContent = error.message;
            });
    });

    logoutButton.addEventListener('click', () => auth.signOut());

    // [수정] 구글 로그인 버튼 클릭 이벤트 리스너 추가
    googleLoginButton.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then((result) => {
                // 로그인이 성공하면 onAuthStateChanged가 자동으로 처리하므로 별도 작업 불필요
                console.log('Google 로그인 성공:', result.user);
            })
            .catch((error) => {
                // 에러 처리
                console.error('Google 로그인 에러:', error);
                document.getElementById('login-error').textContent = error.message;
            });
    });


    function initializeDashboard() {
        if (!currentUser) return;
        
        const userDoc = db.collection('users').doc(currentUser.uid);
        dbRefs = {
            user: userDoc,
            objectives: userDoc.collection('objectives'),
            keyResults: userDoc.collection('keyResults'),
            initiatives: userDoc.collection('initiatives'),
            habits: userDoc.collection('habits'),
            dailyLogs: userDoc.collection('dailyLogs'),
            salesDebriefs: userDoc.collection('salesDebriefs'),
            physiqueLogs: userDoc.collection('physiqueLogs'),
        };
        
        setupInitialData();
        initTabs();
        initTodayView();
        initOkrOverview();
        initSalesAnalyzer();
        initPhysiqueArchitect();
        updatePlayerStatus();
    }

    function cleanupListeners() {
        unsubscribeListeners.forEach(unsubscribe => unsubscribe());
        unsubscribeListeners = [];
        Object.values(charts).forEach(chart => chart.destroy());
        charts = {};
    }

    // --- 초기 데이터 설정 ---
    async function setupInitialData() {
        const userSnapshot = await dbRefs.user.get();
        if (!userSnapshot.exists) {
            await dbRefs.user.set({ 
                level: 1, 
                xp: 0,
                displayName: currentUser.displayName, // 구글 로그인 시 이름 저장
                email: currentUser.email // 이메일 저장
            }, { merge: true });
        }

        const objectivesSnapshot = await dbRefs.objectives.get();
        if (objectivesSnapshot.empty) {
            const batch = db.batch();
            const salesObjRef = dbRefs.objectives.doc();
            batch.set(salesObjRef, { title: '최고 수준의 세일즈 성과와 전문가적 숙련도 달성', icon: 'fa-chart-line' });

            const physiqueObjRef = dbRefs.objectives.doc();
            batch.set(physiqueObjRef, { title: '강력하고 회복탄력성 있는 신체 구축', icon: 'fa-dumbbell' });
            
            // 샘플 KR 및 습관 추가
            const salesKr1 = dbRefs.keyResults.doc();
            batch.set(salesKr1, { objectiveId: salesObjRef.id, title: '상담 전환율 65% 달성', startValue: 55, targetValue: 65, unit: '%' });
            const salesKr2 = dbRefs.keyResults.doc();
            batch.set(salesKr2, { objectiveId: salesObjRef.id, title: '월평균 매출 5,900만원 달성', startValue: 4900, targetValue: 5900, unit: '만원' });

            const physiqueKr1 = dbRefs.keyResults.doc();
            batch.set(physiqueKr1, { objectiveId: physiqueObjRef.id, title: '체중 51kg으로 증량', startValue: 46, targetValue: 51, unit: 'kg' });
            
            batch.set(dbRefs.habits.doc(), { title: '아침 운동', streak: 0, lastCompleted: null });
            batch.set(dbRefs.habits.doc(), { title: '목표 칼로리 섭취', streak: 0, lastCompleted: null });
            batch.set(dbRefs.habits.doc(), { title: '저녁 회고', streak: 0, lastCompleted: null });

            await batch.commit();
        }
    }

    // --- 탭 기능 ---
    function initTabs() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
                document.getElementById(item.dataset.tab).classList.add('active');
            });
        });
    }

    // --- 플레이어 상태 및 게임화 ---
    const XP_PER_ACTION = 10;
    const XP_STREAK_BONUS = 5;
    const XP_RESTART_BONUS = 25;
    const LEVELS = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7000, 10000]; // 레벨별 필요 XP

    async function addXp(amount) {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(dbRefs.user);
            const newXp = (userDoc.data().xp || 0) + amount;
            transaction.update(dbRefs.user, { xp: newXp });
        });
    }

    function updatePlayerStatus() {
        const unsubscribe = dbRefs.user.onSnapshot(doc => {
            const data = doc.data();
            if (!data) return;
            const currentLevel = data.level || 1;
            const currentXp = data.xp || 0;
            
            let level = 1;
            while (level < LEVELS.length && currentXp >= LEVELS[level]) {
                level++;
            }

            if (level !== currentLevel) {
                dbRefs.user.update({ level: level });
            }

            const xpForCurrentLevel = LEVELS[level - 1];
            const xpForNextLevel = LEVELS[level] || Infinity;
            const xpInLevel = currentXp - xpForCurrentLevel;
            const xpNeeded = xpForNextLevel - xpForCurrentLevel;

            document.getElementById('player-level').textContent = level;
            document.getElementById('player-xp').textContent = xpInLevel;
            document.getElementById('xp-to-next-level').textContent = xpNeeded;
            document.getElementById('xp-bar-fill').style.width = `${(xpInLevel / xpNeeded) * 100}%`;
        });
        unsubscribeListeners.push(unsubscribe);
    }

    // --- Today 뷰 ---
    function initTodayView() {
        renderConsistencyHeatmap();
        renderHabits();
        renderInitiatives();
        loadKeyResultsForSelect();

        const initiativeForm = document.getElementById('initiative-form');
        initiativeForm.addEventListener('submit', e => {
            e.preventDefault();
            const input = document.getElementById('initiative-input');
            const krSelect = document.getElementById('initiative-kr-link');
            const text = input.value.trim();
            if (text && krSelect.value) {
                dbRefs.initiatives.add({
                    text: text,
                    completed: false,
                    createdAt: new Date(),
                    keyResultId: krSelect.value
                });
                input.value = '';
            }
        });
    }

    async function renderConsistencyHeatmap() {
        const container = document.getElementById('heatmap-container');
        container.innerHTML = '';
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 370); // 약 53주

        const logsSnapshot = await dbRefs.dailyLogs.where('date', '>=', startDate).get();
        const logs = {};
        logsSnapshot.forEach(doc => {
            logs[doc.id] = doc.data().consistencyScore;
        });

        for (let i = 0; i < 371; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateString = date.toISOString().split('T')[0];
            
            const day = document.createElement('div');
            day.className = 'heatmap-day';
            day.title = dateString;
            const score = logs[dateString] || 0;
            let level = 0;
            if (score > 0) level = 1;
            if (score >= 0.4) level = 2;
            if (score >= 0.7) level = 3;
            if (score >= 1.0) level = 4;
            day.dataset.level = level;
            container.appendChild(day);
        }
    }

    function renderHabits() {
        const unsubscribe = dbRefs.habits.onSnapshot(snapshot => {
            const list = document.getElementById('habit-list');
            list.innerHTML = '';
            snapshot.forEach(doc => {
                const habit = doc.data();
                const li = document.createElement('li');
                const todayStr = new Date().toDateString();
                const isCompletedToday = habit.lastCompleted && habit.lastCompleted.toDate().toDateString() === todayStr;
                
                li.className = isCompletedToday ? 'completed' : '';
                li.innerHTML = `
                    <input type="checkbox" ${isCompletedToday ? 'checked' : ''}>
                    <span>${habit.title} (Streak: ${habit.streak || 0})</span>
                `;
                li.querySelector('input').addEventListener('change', () => toggleHabit(doc.id, habit, isCompletedToday));
                list.appendChild(li);
            });
        });
        unsubscribeListeners.push(unsubscribe);
    }
    
    async function toggleHabit(id, habitData, isCompletedToday) {
        if (isCompletedToday) return; // 한 번 체크하면 해제 불가

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const lastCompletedDate = habitData.lastCompleted ? habitData.lastCompleted.toDate() : null;
        let newStreak = habitData.streak || 0;
        let xpGained = XP_PER_ACTION;

        if (lastCompletedDate && lastCompletedDate.toDateString() === yesterday.toDateString()) {
            newStreak++;
            xpGained += XP_STREAK_BONUS * newStreak;
        } else if (lastCompletedDate) { // 연속 실패
            newStreak = 1;
            xpGained += XP_RESTART_BONUS;
        } else { // 최초 실행
            newStreak = 1;
        }

        await dbRefs.habits.doc(id).update({
            streak: newStreak,
            lastCompleted: firebase.firestore.Timestamp.fromDate(today)
        });
        await addXp(xpGained);
        await updateDailyLog();
    }

    function renderInitiatives() {
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const endOfToday = new Date(today.setHours(23, 59, 59, 999));

        const unsubscribe = dbRefs.initiatives
           .where('createdAt', '>=', startOfToday)
           .where('createdAt', '<=', endOfToday)
           .onSnapshot(async snapshot => {
                const list = document.getElementById('initiative-list');
                list.innerHTML = '';
                const krDocs = await dbRefs.keyResults.get();
                const krMap = new Map(krDocs.docs.map(doc => [doc.id, doc.data().title]));

                snapshot.forEach(doc => {
                    const initiative = doc.data();
                    const li = document.createElement('li');
                    li.className = initiative.completed ? 'completed' : '';
                    const krTitle = krMap.get(initiative.keyResultId) || 'N/A';
                    li.innerHTML = `
                        <input type="checkbox" ${initiative.completed ? 'checked' : ''}>
                        <span>${initiative.text}</span>
                        <span class="kr-badge">${krTitle.substring(0, 15)}...</span>
                    `;
                    li.querySelector('input').addEventListener('change', () => toggleInitiative(doc.id, initiative.completed));
                    list.appendChild(li);
                });
            });
        unsubscribeListeners.push(unsubscribe);
    }

    async function toggleInitiative(id, currentStatus) {
        await dbRefs.initiatives.doc(id).update({ completed: !currentStatus });
        if (!currentStatus) { // 완료되지 않은 상태에서 완료로 변경 시
            await addXp(XP_PER_ACTION);
            await updateDailyLog();
        }
        await updateAllKRProgress();
    }

    async function updateDailyLog() {
        const todayStr = new Date().toISOString().split('T')[0];
        const habitsSnapshot = await dbRefs.habits.get();
        let completedHabits = 0;
        habitsSnapshot.forEach(doc => {
            const habit = doc.data();
            if (habit.lastCompleted && habit.lastCompleted.toDate().toISOString().split('T')[0] === todayStr) {
                completedHabits++;
            }
        });
        const consistencyScore = habitsSnapshot.size > 0 ? completedHabits / habitsSnapshot.size : 0;
        await dbRefs.dailyLogs.doc(todayStr).set({
            date: new Date(todayStr),
            consistencyScore: consistencyScore
        }, { merge: true });
        renderConsistencyHeatmap(); // 업데이트 후 히트맵 다시 렌더링
    }

    async function loadKeyResultsForSelect() {
        const krSelect = document.getElementById('initiative-kr-link');
        const snapshot = await dbRefs.keyResults.get();
        krSelect.innerHTML = '<option value="">-- 핵심 결과 연결 --</option>';
        snapshot.forEach(doc => {
            const kr = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = kr.title;
            krSelect.appendChild(option);
        });
    }

    // --- OKR 개요 ---
    async function initOkrOverview() {
        const objectivesSnapshot = await dbRefs.objectives.get();
        const keyResultsSnapshot = await dbRefs.keyResults.get();
        
        const objectives = objectivesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const keyResultsByObjective = {};
        keyResultsSnapshot.forEach(doc => {
            const kr = { id: doc.id, ...doc.data() };
            if (!keyResultsByObjective[kr.objectiveId]) {
                keyResultsByObjective[kr.objectiveId] = [];
            }
            keyResultsByObjective[kr.objectiveId].push(kr);
        });

        const container = document.getElementById('okr-container');
        container.innerHTML = '';
        for (const obj of objectives) {
            const card = document.createElement('div');
            card.className = 'objective-card';
            let krsHtml = '';
            if (keyResultsByObjective[obj.id]) {
                for (const kr of keyResultsByObjective[obj.id]) {
                    krsHtml += `
                        <div class="kr-item" data-krid="${kr.id}">
                            <div class="kr-title">
                                <span>${kr.title}</span>
                                <span class="kr-progress-text">0%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-bar-fill" style="width: 0%;"></div>
                            </div>
                        </div>
                    `;
                }
            }
            card.innerHTML = `<h3 class="objective-title"><i class="fas ${obj.icon}"></i> ${obj.title}</h3>${krsHtml}`;
            container.appendChild(card);
        }
        await updateAllKRProgress();
    }

    async function updateAllKRProgress() {
        const krSnapshot = await dbRefs.keyResults.get();
        for (const krDoc of krSnapshot.docs) {
            const kr = { id: krDoc.id, ...krDoc.data() };
            const initiativesSnapshot = await dbRefs.initiatives.where('keyResultId', '==', kr.id).get();
            
            let progress = 0;
            if (initiativesSnapshot.size > 0) {
                const completedCount = initiativesSnapshot.docs.filter(doc => doc.data().completed).length;
                progress = (completedCount / initiativesSnapshot.size) * 100;
            }
            
            const krElement = document.querySelector(`.kr-item[data-krid="${kr.id}"]`);
            if (krElement) {
                krElement.querySelector('.kr-progress-text').textContent = `${Math.round(progress)}%`;
                krElement.querySelector('.progress-bar-fill').style.width = `${progress}%`;
            }
        }
    }

    // --- 분석기 ---
    function initSalesAnalyzer() {
        const debriefForm = document.getElementById('debrief-form');
        debriefForm.addEventListener('submit', e => {
            e.preventDefault();
            dbRefs.salesDebriefs.add({
                date: new Date(debriefForm['debrief-date'].value),
                summary: debriefForm['debrief-summary'].value,
                result: debriefForm['debrief-result'].value,
                authenticityScore: parseInt(debriefForm['debrief-authenticity'].value),
                notes: debriefForm['debrief-notes'].value,
            });
            debriefForm.reset();
        });
        renderSalesChart();
    }

    function initPhysiqueArchitect() {
        const logForm = document.getElementById('physique-log-form');
        logForm.addEventListener('submit', e => {
            e.preventDefault();
            dbRefs.physiqueLogs.add({
                date: new Date(logForm['physique-date'].value),
                weight: parseFloat(logForm['physique-weight'].value),
                calories: parseInt(logForm['physique-calories'].value),
                workout: logForm['physique-workout'].value,
            });
            logForm.reset();
        });
        renderPhysiqueChart();
    }

    function renderSalesChart() {
        const unsubscribe = dbRefs.salesDebriefs.orderBy('date', 'asc').onSnapshot(snapshot => {
            const labels = [];
            const conversionRates = [];
            const authenticityScores = [];
            
            let total = 0;
            let contracts = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                labels.push(data.date.toDate());
                total++;
                if (data.result === 'contract') contracts++;
                conversionRates.push((contracts / total) * 100);
                authenticityScores.push(data.authenticityScore);
            });

            const ctx = document.getElementById('sales-kpi-chart').getContext('2d');
            if (charts.sales) charts.sales.destroy();
            charts.sales = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: '누적 전환율',
                            data: conversionRates,
                            borderColor: 'rgba(0, 170, 255, 1)',
                            backgroundColor: 'rgba(0, 170, 255, 0.2)',
                            fill: true,
                            yAxisID: 'y'
                        },
                        {
                            label: '진정성 점수 (1-5)',
                            data: authenticityScores,
                            borderColor: 'rgba(255, 161, 0, 1)',
                            backgroundColor: 'rgba(255, 161, 0, 0.2)',
                            fill: false,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    scales: {
                        x: { type: 'time', time: { unit: 'day' } },
                        y: { position: 'left', min: 0, max: 100 },
                        y1: { position: 'right', min: 1, max: 5, grid: { drawOnChartArea: false } }
                    }
                }
            });
        });
        unsubscribeListeners.push(unsubscribe);
    }

    function renderPhysiqueChart() {
        const unsubscribe = dbRefs.physiqueLogs.orderBy('date', 'asc').onSnapshot(snapshot => {
            const labels = snapshot.docs.map(doc => doc.data().date.toDate());
            const weights = snapshot.docs.map(doc => doc.data().weight);
            const calories = snapshot.docs.map(doc => doc.data().calories);

            const ctx = document.getElementById('physique-chart').getContext('2d');
            if (charts.physique) charts.physique.destroy();
            charts.physique = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: '체중 (kg)',
                            data: weights,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: false,
                            yAxisID: 'y'
                        },
                        {
                            label: '섭취 칼로리 (kcal)',
                            data: calories,
                            borderColor: 'rgba(255, 99, 132, 1)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            fill: false,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    scales: {
                        x: { type: 'time', time: { unit: 'day' } },
                        y: { position: 'left' },
                        y1: { position: 'right', grid: { drawOnChartArea: false } }
                    }
                }
            });
        });
        unsubscribeListeners.push(unsubscribe);
    }
});