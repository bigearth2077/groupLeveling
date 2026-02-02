/**
 * @typedef {Object} RhythmMetric
 * @property {string} label - 时间标签 (e.g., "Jan", "Mon", "08:00")
 * @property {string} fullDate - 完整日期/ID (用于点击交互)
 * @property {number} studyDuration - 专注时长
 * @property {number} restDuration - 休息时长
 * @property {number} [ghostStudyDuration] - 幽灵数据 (同比)
 * @property {number} [ghostRestDuration] - 幽灵数据 (同比)
 */

/**
 * @typedef {Object} DashboardData
 * @property {RhythmMetric[]} yearView - 月模式数据 (12个月)
 * @property {RhythmMetric[]} weekView - 周模式数据 (7天)
 * @property {Object.<string, RhythmMetric[]>} monthDetails - 月份详情 (Key: 月份ID -> 4周数据)
 * @property {Object.<string, RhythmMetric[]>} dayDetails - 日详情 (Key: 日期ID -> 24小时数据)
 */

export const Types = {}; 
