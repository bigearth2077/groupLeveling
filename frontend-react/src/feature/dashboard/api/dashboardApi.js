// ---------------- Static Mock Data ----------------

const YEAR_VIEW_DATA = [
    { label: 'Jan', fullDate: '2024-01', studyDuration: 85, restDuration: 20, ghostStudyDuration: 70 },
    { label: 'Feb', fullDate: '2024-02', studyDuration: 92, restDuration: 25, ghostStudyDuration: 85 },
    { label: 'Mar', fullDate: '2024-03', studyDuration: 110, restDuration: 30, ghostStudyDuration: 92 },
    { label: 'Apr', fullDate: '2024-04', studyDuration: 75, restDuration: 40, ghostStudyDuration: 110 },
    { label: 'May', fullDate: '2024-05', studyDuration: 105, restDuration: 20, ghostStudyDuration: 75 },
    { label: 'Jun', fullDate: '2024-06', studyDuration: 130, restDuration: 35, ghostStudyDuration: 105 },
    { label: 'Jul', fullDate: '2024-07', studyDuration: 95, restDuration: 25, ghostStudyDuration: 130 },
    { label: 'Aug', fullDate: '2024-08', studyDuration: 115, restDuration: 30, ghostStudyDuration: 95 },
    { label: 'Sep', fullDate: '2024-09', studyDuration: 100, restDuration: 20, ghostStudyDuration: 115 },
    { label: 'Oct', fullDate: '2024-10', studyDuration: 125, restDuration: 25, ghostStudyDuration: 100 },
    { label: 'Nov', fullDate: '2024-11', studyDuration: 140, restDuration: 35, ghostStudyDuration: 125 },
    { label: 'Dec', fullDate: '2024-12', studyDuration: 90, restDuration: 45, ghostStudyDuration: 140 },
  ];
  
  const WEEK_VIEW_DATA = [
    { label: 'Mon', fullDate: '2024-01-29', studyDuration: 320, restDuration: 45, ghostStudyDuration: 280 },
    { label: 'Tue', fullDate: '2024-01-30', studyDuration: 380, restDuration: 60, ghostStudyDuration: 320 },
    { label: 'Wed', fullDate: '2024-01-31', studyDuration: 290, restDuration: 40, ghostStudyDuration: 380 },
    { label: 'Thu', fullDate: '2024-02-01', studyDuration: 410, restDuration: 70, ghostStudyDuration: 290 },
    { label: 'Fri', fullDate: '2024-02-02', studyDuration: 350, restDuration: 50, ghostStudyDuration: 410 },
    { label: 'Sat', fullDate: '2024-02-03', studyDuration: 150, restDuration: 90, ghostStudyDuration: 350 },
    { label: 'Sun', fullDate: '2024-02-04', studyDuration: 180, restDuration: 80, ghostStudyDuration: 150 },
  ];
  
  const MONTH_DETAILS_DATA = [
    { label: 'Week 1', fullDate: '2024-01-W1', studyDuration: 1800, restDuration: 300 },
    { label: 'Week 2', fullDate: '2024-01-W2', studyDuration: 2100, restDuration: 350 },
    { label: 'Week 3', fullDate: '2024-01-W3', studyDuration: 1950, restDuration: 320 },
    { label: 'Week 4', fullDate: '2024-01-W4', studyDuration: 2300, restDuration: 400 },
  ];
  
const DAY_DETAILS_STATIC = [
    { label: '00:00', studyDuration: 0, restDuration: 0 },
    { label: '01:00', studyDuration: 0, restDuration: 0 },
    { label: '02:00', studyDuration: 0, restDuration: 0 },
    { label: '03:00', studyDuration: 0, restDuration: 0 },
    { label: '04:00', studyDuration: 0, restDuration: 0 },
    { label: '05:00', studyDuration: 0, restDuration: 0 },
    { label: '06:00', studyDuration: 10, restDuration: 0 },
    { label: '07:00', studyDuration: 45, restDuration: 5 },
    { label: '08:00', studyDuration: 50, restDuration: 10 },
    { label: '09:00', studyDuration: 45, restDuration: 15 },
    { label: '10:00', studyDuration: 60, restDuration: 0 },
    { label: '11:00', studyDuration: 30, restDuration: 30 },
    { label: '12:00', studyDuration: 10, restDuration: 50 },
    { label: '13:00', studyDuration: 45, restDuration: 15 },
    { label: '14:00', studyDuration: 55, restDuration: 5 },
    { label: '15:00', studyDuration: 50, restDuration: 10 },
    { label: '16:00', studyDuration: 40, restDuration: 20 },
    { label: '17:00', studyDuration: 35, restDuration: 25 },
    { label: '18:00', studyDuration: 20, restDuration: 40 },
    { label: '19:00', studyDuration: 15, restDuration: 10 },
    { label: '20:00', studyDuration: 30, restDuration: 5 },
    { label: '21:00', studyDuration: 20, restDuration: 10 },
    { label: '22:00', studyDuration: 0, restDuration: 0 },
    { label: '23:00', studyDuration: 0, restDuration: 0 },
];

/**
 * 此时我们不需要复杂的日期逻辑，只返回一个静态的 31 天数组用于演示日历
 */
export const getStaticCalendarData = (monthLabel) => {
    // Simple hash to make data look different per month
    const seed = monthLabel ? monthLabel.charCodeAt(0) : 0;
    
    return Array.from({ length: 30 }).map((_, i) => ({
        day: i + 1,
        fullDate: `2024-MockDev-${i + 1}`,
        studyDuration: Math.floor(Math.random() * (120 + seed % 50)), 
        restDuration: Math.floor(Math.random() * 30),
    }));
};

export const MOCK_DASHBOARD_DATA = {
    yearView: YEAR_VIEW_DATA,
    weekView: WEEK_VIEW_DATA,
    monthDetails: {
      'DEFAULT': MONTH_DETAILS_DATA
    },
    dayDetails: {
      'DEFAULT': DAY_DETAILS_STATIC
    }
  };
  
/**
 * 模拟 API 调用获取数据
 * @returns {Promise<import('../types/types').DashboardData>}
 */
export const fetchDashboardData = async () => {
    // Simulate network delay
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(MOCK_DASHBOARD_DATA);
        }, 300);
    });
};

/**
 * 模拟钻取详情 API
 * GET /api/dashboard/details
 * @param {'month' | 'day'} type - 钻取类型
 * @param {string} date - 日期 ID (e.g. "2024-01" or "2024-01-29")
 */
export const fetchDashboardDetails = async (type, date) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simple hash seed based on date string
            // 确保同一个 date 总是生成相同的 seed
            const seed = date ? date.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
            
            if (type === 'month') {
                // Return ~30 days for calendar
                const days = Array.from({ length: 30 }).map((_, i) => ({
                    day: i + 1,
                    fullDate: `${date}-${i + 1}`,
                    // Deterministic variation: (seed + index) based math
                    studyDuration: (seed + i * 13) % 120, 
                    restDuration: (seed + i * 7) % 30,
                }));
                
                resolve({
                    type: 'month',
                    date: date,
                    items: days
                });
            } else {
                // Return 24 hours for chart
                const hours = Array.from({ length: 24 }).map((_, i) => {
                    // Deterministic Curve
                    // Peak around 10am (index 10) and 3pm (index 15)
                    const base = (i > 8 && i < 22) ? 40 : 5;
                    // Variation based on seed
                    const variation = (seed % 15) * (i % 2 === 0 ? 1 : -1);
                    const randomLike = ((seed * (i + 1)) % 20); 
                    
                    return {
                        label: `${i}:00`,
                        studyDuration: Math.max(0, base + randomLike + variation),
                        restDuration: (seed * i) % 15
                    };
                });

                resolve({
                    type: 'day',
                    date: date,
                    items: hours
                });
            }
        }, 400); 
    });
};
