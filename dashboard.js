/* [수정 완료] dashboard.js */

document.addEventListener('DOMContentLoaded', () => {
    // ... (이전 코드는 동일) ...

    async function updateAllKRProgress() {
        // [수정] N+1 조회 문제를 해결하기 위한 로직 변경
        // 1. 모든 KR과 Initiative를 한 번에 가져온다.
        const krSnapshot = await dbRefs.keyResults.get();
        const initiativesSnapshot = await dbRefs.initiatives.get();

        // 2. Initiative 데이터를 KR ID를 기준으로 그룹화하여 계산하기 쉽게 만든다.
        const initiativesByKR = {};
        initiativesSnapshot.forEach(doc => {
            const initiative = doc.data();
            if (!initiativesByKR[initiative.keyResultId]) {
                initiativesByKR[initiative.keyResultId] = { total: 0, completed: 0 };
            }
            initiativesByKR[initiative.keyResultId].total++;
            if (initiative.completed) {
                initiativesByKR[initiative.keyResultId].completed++;
            }
        });

        // 3. 각 KR을 순회하며 미리 계산된 데이터로 UI를 업데이트한다. (DB 조회 없음)
        for (const krDoc of krSnapshot.docs) {
            const krId = krDoc.id;
            const progressData = initiativesByKR[krId];
            let progress = 0;
            
            if (progressData && progressData.total > 0) {
                progress = (progressData.completed / progressData.total) * 100;
            }
            
            const krElement = document.querySelector(`.kr-item[data-krid="${krId}"]`);
            if (krElement) {
                krElement.querySelector('.kr-progress-text').textContent = `${Math.round(progress)}%`;
                krElement.querySelector('.progress-bar-fill').style.width = `${progress}%`;
            }
        }
    }
    
    // ... (나머지 코드는 동일) ...
});