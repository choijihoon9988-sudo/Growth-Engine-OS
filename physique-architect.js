document.addEventListener('DOMContentLoaded', function() {
    // --- MOCK DATA & CONFIG ---
    const MOCK_EXERCISE_DB = [
        { name: '벤치프레스', category: '상체' },
        { name: '인클라인 덤벨 프레스', category: '상체' },
        { name: '딥스', category: '상체' },
        { name: '오버헤드 프레스', category: '상체' },
        { name: '사이드 레터럴 레이즈', category: '상체' },
        { name: '데드리프트', category: '등' },
        { name: '바벨 로우', category: '등' },
        { name: '풀업', category: '등' },
        { name: '랫풀다운', category: '등' },
        { name: '시티드 케이블 로우', category: '등' },
        { name: '스쿼트', category: '하체' },
        { name: '레그 프레스', category: '하체' },
        { name: '레그 익스텐션', category: '하체' },
        { name: '레그 컬', category: '하체' },
        { name: '런지', category: '하체' },
    ];

    const MOCK_FOOD_CALORIES = {
        '밥': 300, '공기': 0, '국밥집': 50, '크기': 0,
        '고기': 200, '삼겹살': 330, '닭가슴살': 165,
        '계란': 80, '계란후라이': 100,
        '짜파게티': 610,
        '신라면': 500,
    };

    // --- STATE MANAGEMENT ---
    let state = {
        logs: {}, // { 'YYYY-MM-DD': { weight: 70, goal: 3000, meals:, workouts: } }
        currentDate: new Date().toISOString().split('T')
    };

    // --- DOM ELEMENTS ---
    const calorieChartEl = document.getElementById('calorie-chart');
    const bodyMetricChartEl = document.getElementById('body-metric-chart');
    const consumedEl = document.getElementById('consumed-calories');
    const goalEl = document.getElementById('goal-calories');
    const weightInput = document.getElementById('current-weight-input');
    const goalInput = document.getElementById('calorie-goal-input');
    const mealLogContainer = document.getElementById('meal-log-container');
    const workoutLogContainer = document.getElementById('workout-log-container');
    const alarmSound = document.getElementById('timer-alarm');

    // --- CHARTS ---
    let calorieChart, bodyMetricChart;

    function initCharts() {
        const calorieCtx = calorieChartEl.getContext('2d');
        calorieChart = new Chart(calorieCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: ,
                    backgroundColor: [ 'var(--primary-color)', 'var(--surface-light-color)'],
                    borderWidth: 0,
                    borderRadius: 10,
                }]
            },
            options: {
                responsive: true,
                cutout: '80%',
                plugins: { tooltip: { enabled: false } }
            }
        });

        const bodyMetricCtx = bodyMetricChartEl.getContext('2d');
        bodyMetricChart = new Chart(bodyMetricCtx, {
            type: 'line',
            data: {
                labels:,
                datasets: [
                    {
                        label: '체중 (kg)',
                        data:,
                        borderColor: 'var(--success-color)',
                        yAxisID: 'yWeight',
                    },
                    {
                        label: '섭취 칼로리 (kcal)',
                        data:,
                        borderColor: 'var(--primary-color)',
                        yAxisID: 'yCalories',
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    yWeight: { position: 'left', title: { display: true, text: 'Weight (kg)' } },
                    yCalories: { position: 'right', title: { display: true, text: 'Calories (kcal)' }, grid: { drawOnChartArea: false } }
                }
            }
        });
    }

    // --- DATA PERSISTENCE ---
    function saveData() {
        localStorage.setItem('physiqueArchitectState', JSON.stringify(state));
    }

    function loadData() {
        const savedState = localStorage.getItem('physiqueArchitectState');
        if (savedState) {
            state = JSON.parse(savedState);
        }
        if (!state.logs) {
            state.logs = { weight: '', goal: 3000, meals:, workouts: };
        }
    }

    // --- RENDER FUNCTIONS ---
    function renderAll() {
        renderDashboard();
        renderMeals();
        renderWorkouts();
        updateCharts();
    }

    function renderDashboard() {
        const todayLog = state.logs;
        weightInput.value = todayLog.weight |

| '';
        goalInput.value = todayLog.goal |

| 3000;
        goalEl.textContent = todayLog.goal |

| 3000;
    }

    function renderMeals() {
        mealLogContainer.innerHTML = '';
        state.logs.meals.forEach((meal, index) => {
            const mealCard = document.createElement('div');
            mealCard.className = 'meal-card';
            mealCard.innerHTML = `
                <div class="meal-card-header">
                    <h4>${meal.name}</h4>
                    <span>${meal.calories} kcal</span>
                </div>
                <p class="meal-card-body">${meal.items.join(', ')}</p>
            `;
            mealLogContainer.appendChild(mealCard);
        });
    }

    function renderWorkouts() {
        workoutLogContainer.innerHTML = '';
        state.logs.workouts.forEach((workout, index) => {
            const workoutCard = document.createElement('div');
            workoutCard.className = 'workout-card';
            workoutCard.dataset.index = index;
            workoutCard.innerHTML = `
                <div class="workout-card-header">
                    <h4>${workout.name}</h4>
                    <button class="delete-workout-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="sets-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Set</th>
                                <th>이전 기록</th>
                                <th>무게(kg)</th>
                                <th>횟수</th>
                                <th>완료</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${workout.sets.map((set, setIndex) => `
                                <tr data-set-index="${setIndex}">
                                    <td>${setIndex + 1}</td>
                                    <td>${set.previous}</td>
                                    <td><input type="number" class="weight-input" value="${set.weight}"></td>
                                    <td><input type="number" class="reps-input" value="${set.reps}"></td>
                                    <td><button class="set-complete-btn ${set.completed? 'completed' : ''}">${set.completed? '✔' : '완료'}</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="workout-actions">
                    <button class="add-set-btn">세트 추가</button>
                    <div class="rest-timer" style="display: none;">
                        <span>휴식: <span class="timer-display">60</span>s</span>
                    </div>
                </div>
            `;
            workoutLogContainer.appendChild(workoutCard);
        });
    }

    function updateCharts() {
        // Calorie Chart
        const todayLog = state.logs;
        const totalCalories = todayLog.meals.reduce((sum, meal) => sum + meal.calories, 0);
        consumedEl.textContent = totalCalories;
        const goal = todayLog.goal |

| 3000;
        const remaining = Math.max(0, goal - totalCalories);
        calorieChart.data.datasets.data = [totalCalories, remaining];
        calorieChart.update();

        // Body Metric Chart
        const sortedDates = Object.keys(state.logs).sort().slice(-365); // Last 52 weeks (approx)
        const labels =;
        const weightData =;
        const calorieData =;
        
        // Aggregate by week
        const weeklyData = {};
        sortedDates.forEach(date => {
            const week = getWeekNumber(new Date(date));
            if (!weeklyData[week]) {
                weeklyData[week] = { weights:, calories:, count: 0 };
            }
            const log = state.logs[date];
            if (log.weight) weeklyData[week].weights.push(parseFloat(log.weight));
            const totalCals = log.meals.reduce((sum, meal) => sum + meal.calories, 0);
            if (totalCals > 0) weeklyData[week].calories.push(totalCals);
        });

        Object.keys(weeklyData).sort().forEach(week => {
            labels.push(`Week ${week}`);
            const weekLog = weeklyData[week];
            const avgWeight = weekLog.weights.length? (weekLog.weights.reduce((a, b) => a + b, 0) / weekLog.weights.length).toFixed(1) : null;
            const avgCalories = weekLog.calories.length? Math.round(weekLog.calories.reduce((a, b) => a + b, 0) / weekLog.calories.length) : null;
            weightData.push(avgWeight);
            calorieData.push(avgCalories);
        });

        bodyMetricChart.data.labels = labels;
        bodyMetricChart.data.datasets.data = weightData;
        bodyMetricChart.data.datasets.[1]data = calorieData;
        bodyMetricChart.update();
    }
    
    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
        return d.getUTCFullYear() + '-' + weekNo;
    }


    // --- EVENT HANDLERS & LOGIC ---
    
    // Dashboard Inputs
    weightInput.addEventListener('change', (e) => {
        state.logs.weight = e.target.value;
        saveData();
        updateCharts();
    });
    goalInput.addEventListener('change', (e) => {
        state.logs.goal = parseInt(e.target.value) |

| 3000;
        saveData();
        renderDashboard();
        updateCharts();
    });

    // Tab Navigation
    document.querySelector('.tabs').addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-link')) {
            document.querySelectorAll('.tab-link').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            e.target.classList.add('active');
            document.getElementById(e.target.dataset.tab).classList.add('active');
        }
    });

    // --- MEAL LOGIC ---
    const mealModal = document.getElementById('meal-modal');
    const mealAnalysisResult = document.getElementById('meal-analysis-result');
    const analyzedItemsList = document.getElementById('analyzed-items-list');
    const modalTotalCalories = document.getElementById('modal-total-calories');
    let currentAnalyzedMeal = null;

    document.getElementById('add-meal-btn').addEventListener('click', () => {
        mealModal.style.display = 'block';
        document.getElementById('natural-meal-input').value = '';
        mealAnalysisResult.style.display = 'none';
    });

    document.getElementById('analyze-meal-btn').addEventListener('click', async () => {
        const text = document.getElementById('natural-meal-input').value;
        if (!text) return;
        
        // --- AI SIMULATION ---
        // In a real app, this would be an API call to a backend service.
        // The backend would then call a service like Edamam's NLP API.
        const result = await getCaloriesFromAI(text);
        currentAnalyzedMeal = result;
        
        analyzedItemsList.innerHTML = '';
        result.items.forEach(item => {
            const li = document.createElement('li');
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = item.name;
            
            const qtySelect = document.createElement('select');
            qtySelect.dataset.itemName = item.name;
            for(let i = 1; i <= 10; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `${i} 개/인분`;
                if (i === item.quantity) option.selected = true;
                qtySelect.appendChild(option);
            }
            qtySelect.addEventListener('change', updateModalCalories);

            const calSpan = document.createElement('span');
            calSpan.textContent = `${item.calories * item.quantity} kcal`;
            calSpan.dataset.baseCalories = item.calories;

            li.appendChild(nameSpan);
            li.appendChild(qtySelect);
            li.appendChild(calSpan);
            analyzedItemsList.appendChild(li);
        });

        updateModalCalories();
        mealAnalysisResult.style.display = 'block';
    });

    function updateModalCalories() {
        let total = 0;
        analyzedItemsList.querySelectorAll('li').forEach(li => {
            const select = li.querySelector('select');
            const calSpan = li.querySelector('span:last-child');
            const baseCalories = parseInt(calSpan.dataset.baseCalories);
            const quantity = parseInt(select.value);
            const itemTotal = baseCalories * quantity;
            calSpan.textContent = `${itemTotal} kcal`;
            total += itemTotal;
        });
        modalTotalCalories.textContent = total;
    }

    document.getElementById('confirm-add-meal-btn').addEventListener('click', () => {
        const mealName = document.getElementById('natural-meal-input').value.split(',') |

| '기록된 식사';
        const items =;
        let totalCalories = 0;

        analyzedItemsList.querySelectorAll('li').forEach(li => {
            const name = li.querySelector('span:first-child').textContent;
            const quantity = li.querySelector('select').value;
            const calories = parseInt(li.querySelector('span:last-child').textContent);
            items.push(`${name} x${quantity}`);
            totalCalories += calories;
        });

        state.logs.meals.push({
            name: mealName,
            items: items,
            calories: totalCalories
        });
        
        saveData();
        renderAll();
        mealModal.style.display = 'none';
    });

    async function getCaloriesFromAI(text) {
        // This is a MOCK function. A real implementation would use a server-side call to a nutrition API.
        console.log("Simulating AI analysis for:", text);
        const items =;
        const words = text.replace(/,/g, ' ').split(/\s+/);
        let currentItem = { name: '', quantity: 1, calories: 0 };

        words.forEach(word => {
            const num = parseInt(word);
            if (!isNaN(num) && num < 1000) { // Likely a quantity or part of a measurement
                if (word.includes('g')) {
                    // handle grams if API supports it
                } else {
                    currentItem.quantity = num;
                }
            } else if (MOCK_FOOD_CALORIES[word]) {
                if (currentItem.name) { // Finalize previous item
                    if(currentItem.calories > 0) items.push(currentItem);
                    currentItem = { name: '', quantity: 1, calories: 0 };
                }
                currentItem.name += word + ' ';
                currentItem.calories += MOCK_FOOD_CALORIES[word];
            } else {
                currentItem.name += word + ' ';
            }
        });
        if (currentItem.name && currentItem.calories > 0) {
            currentItem.name = currentItem.name.trim();
            items.push(currentItem);
        }
        
        // Handle cases like "계란 3개"
        const eggMatch = text.match(/계란\s*(\d+)\s*개/);
        if (eggMatch) {
            const existingEgg = items.find(i => i.name.includes('계란'));
            if (existingEgg) existingEgg.quantity = parseInt(eggMatch[1]);
            else items.push({ name: '계란', quantity: parseInt(eggMatch[1]), calories: MOCK_FOOD_CALORIES['계란'] });
        }

        return { items };
    }


    // --- WORKOUT LOGIC ---
    const workoutModal = document.getElementById('workout-modal');
    const workoutSelectionList = document.getElementById('workout-selection-list');

    document.getElementById('add-workout-btn').addEventListener('click', () => {
        renderWorkoutSelection();
        workoutModal.style.display = 'block';
    });
    
    document.querySelector('.workout-categories').addEventListener('click', e => {
        if (e.target.classList.contains('category-btn')) {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderWorkoutSelection(e.target.dataset.category, document.getElementById('workout-search-input').value);
        }
    });

    document.getElementById('workout-search-input').addEventListener('input', e => {
        const activeCategory = document.querySelector('.category-btn.active').dataset.category;
        renderWorkoutSelection(activeCategory, e.target.value);
    });

    function renderWorkoutSelection(category = 'all', searchTerm = '') {
        workoutSelectionList.innerHTML = '';
        MOCK_EXERCISE_DB
           .filter(ex => (category === 'all' |

| ex.category === category) && ex.name.toLowerCase().includes(searchTerm.toLowerCase()))
           .forEach(ex => {
                const li = document.createElement('li');
                li.textContent = ex.name;
                li.dataset.name = ex.name;
                li.addEventListener('click', addWorkoutToLog);
                workoutSelectionList.appendChild(li);
            });
    }

    function addWorkoutToLog(e) {
        const name = e.target.dataset.name;
        state.logs.workouts.push({
            name: name,
            sets: [{ previous: '기록 없음', weight: '', reps: '', completed: false }]
        });
        saveData();
        renderWorkouts();
        workoutModal.style.display = 'none';
    }

    workoutLogContainer.addEventListener('click', e => {
        const target = e.target;
        const workoutCard = target.closest('.workout-card');
        if (!workoutCard) return;
        
        const workoutIndex = parseInt(workoutCard.dataset.index);

        if (target.closest('.delete-workout-btn')) {
            state.logs.workouts.splice(workoutIndex, 1);
        } else if (target.classList.contains('add-set-btn')) {
            state.logs.workouts[workoutIndex].sets.push({ previous: '기록 없음', weight: '', reps: '', completed: false });
        } else if (target.classList.contains('set-complete-btn')) {
            const setIndex = parseInt(target.closest('tr').dataset.setIndex);
            const workout = state.logs.workouts[workoutIndex];
            const set = workout.sets[setIndex];
            set.completed =!set.completed;
            if (set.completed) {
                startRestTimer(workoutCard);
            }
        }
        saveData();
        renderWorkouts();
    });
    
    workoutLogContainer.addEventListener('change', e => {
        const target = e.target;
        const workoutCard = target.closest('.workout-card');
        if (!workoutCard ||!(target.classList.contains('weight-input') |

| target.classList.contains('reps-input'))) return;

        const workoutIndex = parseInt(workoutCard.dataset.index);
        const setIndex = parseInt(target.closest('tr').dataset.setIndex);
        const workout = state.logs.workouts[workoutIndex];
        const set = workout.sets[setIndex];

        if (target.classList.contains('weight-input')) {
            set.weight = target.value;
        } else if (target.classList.contains('reps-input')) {
            set.reps = target.value;
        }
        saveData();
    });

    let restTimerInterval;
    function startRestTimer(workoutCard) {
        const timerEl = workoutCard.querySelector('.rest-timer');
        const timerDisplay = timerEl.querySelector('.timer-display');
        timerEl.style.display = 'block';
        let timeLeft = 60;
        
        clearInterval(restTimerInterval);
        
        restTimerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(restTimerInterval);
                timerEl.style.display = 'none';
                alarmSound.play();
            }
        }, 1000);
    }


    // --- MODAL CLOSE LOGIC ---
    document.querySelectorAll('.modal.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // --- INITIALIZATION ---
    loadData();
    initCharts();
    renderAll();
});