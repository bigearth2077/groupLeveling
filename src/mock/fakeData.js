// 假数据文件，后端未开发时临时使用
export const quarterMonths = ["6月", "7月", "8月"]
export const quarterData = [20, 25, 30] // 小时

export const yearMonths = [
  "1月","2月","3月","4月","5月","6月",
  "7月","8月","9月","10月","11月","12月"
]
export const yearData = [10,15,20,25,30,35,28,32,40,45,50,55] // 小时

export const weekDays = ["周一","周二","周三","周四","周五","周六","周日"]
export const weekData = [2, 2.5, 3, 1.8, 4, 5, 1] // 小时

export const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
export const todayData = Array.from({ length: 24 }, () => Math.floor(Math.random() * 60)) // 分钟