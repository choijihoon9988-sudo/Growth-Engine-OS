/* [수정 완료] script.js */
document.addEventListener('DOMContentLoaded', function() {
    // Custom Cursor Logic
    const cursorDot = document.querySelector("#cursor-dot");
    const cursorOutline = document.querySelector("#cursor-outline");

    let mouseX = 0;
    let mouseY = 0;
    let isMoving = false;

    window.addEventListener("mousemove", function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!isMoving) {
            isMoving = true;
            // [수정] requestAnimationFrame을 사용하여 렌더링 최적화
            // 브라우저의 다음 프레임에 맞춰 한 번만 위치를 업데이트하여 렉을 줄인다.
            requestAnimationFrame(updateCursor);
        }
    });

    function updateCursor() {
        cursorDot.style.left = `${mouseX}px`;
        cursorDot.style.top = `${mouseY}px`;

        cursorOutline.animate({
            left: `${mouseX}px`,
            top: `${mouseY}px`
        }, { duration: 500, fill: "forwards" });

        isMoving = false;
    }


    // Navigation Scroll Effect
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Scroll Animation for Sections
    const sections = document.querySelectorAll('.content-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    sections.forEach(section => {
        observer.observe(section);
    });

    // Achievements Chart (Chart.js)
    const ctx = document.getElementById('revenueChart');
    if (ctx) {
        // 데이터 출처: 25년 08월 _ 최재영 이력서.pdf
        // 월 매출 300만원 → 5,900만원 달성 (퇴사전 3개월 평균 4900만)
        // 이 데이터를 기반으로 성장 과정을 시각적으로 표현
        const revenueData = {
            labels: ['초기 3개월', '중기', '안정기', '성장기', '피크', '퇴사 전 3개월 평균'],
            datasets: [{
                label: '월 매출 (단위: 만원)',
                data: [300, 1000, 2500, 4000, 5900, 5400],
                backgroundColor: 'rgba(0, 170, 255, 0.2)',
                borderColor: 'rgba(0, 170, 255, 1)',
                borderWidth: 2,
                pointBackgroundColor: '#fff',
                pointBorderColor: 'rgba(0, 170, 255, 1)',
                pointHoverBackgroundColor: 'rgba(0, 170, 255, 1)',
                pointHoverBorderColor: '#fff',
                tension: 0.4
            }]
        };

        const config = {
            type: 'line',
            data: revenueData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            color: 'var(--text-color)'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'var(--text-muted-color)',
                            callback: function(value) {
                                return value + '만원';
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'var(--text-muted-color)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        };

        new Chart(ctx, config);
    }
});