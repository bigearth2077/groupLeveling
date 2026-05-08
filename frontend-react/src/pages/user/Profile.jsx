import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  MapPin, 
  Calendar, 
  Edit3, 
  Save, 
  Lock, 
  Trophy, 
  Zap,
  Loader2,
  Camera,
  History,
  ArrowLeft,
  ArrowRight,
  Brain,
  Coffee,
  BarChart3,
  Tag,
  Trash2,
  Plus,
  Activity,
  HeartPulse,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { getMe, getUserProfile, updateProfile, changePassword } from '@/feature/user/api';
import { getSessions, getStatsSummary } from '@/feature/study/api';
import { getMyTags, deleteMyTag, addMyTag } from '@/feature/tag/api';
import { getAIHealthReport } from '@/feature/health/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { removeToken } from '@/utils/token';

const PRESET_AVATARS = [
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Willow',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Midnight',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Abby',
  'https://api.dicebear.com/9.x/notionists/svg?seed=Leo',
  'https://api.dicebear.com/9.x/notionists/svg?seed=Molly',
  'https://api.dicebear.com/9.x/micah/svg?seed=Bear'
];

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // '概览' | '历史' | '技能' | '健康' | '设置'
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null); // 等级信息
  
  // 统计数据
  const [summary, setSummary] = useState(null);
  const [statsRange, setStatsRange] = useState('7'); // '7' | '30'

  // 历史数据
  const [sessions, setSessions] = useState([]);
  const [sessionPage, setSessionPage] = useState(1);
  const [hasMoreSessions, setHasMoreSessions] = useState(false);

  // 技能数据
  const [myTags, setMyTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  // 编辑表单状态
  const [formData, setFormData] = useState({
    nickname: '',
    bio: '',
    avatarUrl: ''
  });
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: ''
  });
  const [saving, setSaving] = useState(false);

  // 健康报告
  const [healthReport, setHealthReport] = useState(null);
  const [fetchingReport, setFetchingReport] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // 范围变更时重新获取统计数据
  useEffect(() => {
    if (user) {
      fetchStatsOnly();
    }
  }, [statsRange]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory(sessionPage);
    } else if (activeTab === 'skills') {
      fetchTags();
    } else if (activeTab === 'health' && !healthReport) {
      fetchHealthReport();
    }
  }, [activeTab, sessionPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const me = await getMe();
      if (me) {
        setUser(me);
        setFormData({
          nickname: me.nickname,
          bio: me.bio || '',
          avatarUrl: me.avatarUrl || ''
        });
        
        const profile = await getUserProfile(me.id);
        if (profile) {
          setStats(profile.levelInfo);
        }
        
        // 同时获取标题标签（顶级技能）
        const tags = await getMyTags();
        if (tags) {
          // 按经验值（总分钟数）降序排序
          const sorted = [...tags].sort((a, b) => b.totalMinutes - a.totalMinutes);
          setMyTags(sorted);
        }

        // 初始数据获取
        const sumResp = await getStatsSummary({ range: statsRange });
        if (sumResp) setSummary(sumResp);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsOnly = async () => {
    try {
      const sumResp = await getStatsSummary({ range: statsRange });
      if (sumResp) setSummary(sumResp);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async (page) => {
    try {
      const resp = await getSessions({ page, pageSize: 10 });
      if (resp && resp.items) {
        setSessions(resp.items);
        setHasMoreSessions(resp.items.length === 10);
      } else {
        setSessions([]);
        setHasMoreSessions(false);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const fetchTags = async () => {
    try {
      const tags = await getMyTags();
      if (tags) {
         const sorted = [...tags].sort((a, b) => b.totalMinutes - a.totalMinutes);
         setMyTags(sorted);
      }
    } catch (err) {
      console.error("Failed to fetch tags", err);
    }
  };

  const fetchHealthReport = async () => {
    setFetchingReport(true);
    try {
      const report = await getAIHealthReport();
      setHealthReport(report);
    } catch (err) {
      console.error("Failed to fetch health report", err);
    } finally {
      setFetchingReport(false);
    }
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    try {
      await addMyTag(newTag.trim());
      setNewTag('');
      fetchTags(); // 刷新列表
    } catch (err) {
      alert("Failed to add tag");
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!confirm("Remove this skill? Your stats will be preserved if you add it back later.")) return;
    try {
      await deleteMyTag(tagId);
      setMyTags(prev => prev.filter(t => t.tagId !== tagId));
    } catch (err) {
      alert("Failed to delete tag");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 净化载荷
      const payload = {
        nickname: formData.nickname,
        bio: formData.bio,
        avatarUrl: formData.avatarUrl.trim() === '' ? null : formData.avatarUrl
      };

      await updateProfile(payload);
      
      // 刷新本地用户状态
      const updated = { ...user, ...payload, avatarUrl: payload.avatarUrl || null }; // 特别处理空值
      setUser(updated);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await changePassword(passData);
      alert('Password changed successfully!');
      setPassData({ currentPassword: '', newPassword: '' });
    } catch (error) {
      alert('Failed to change password: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getChartOption = () => {
    if (!summary || !summary.daily) return {};

    const dates = summary.daily.map(d => d.date.slice(5)); // '月-日'
    const values = summary.daily.map(d => d.minutes);

    return {
      title: { 
        text: statsRange === '7' ? '周专注时长 (分钟)' : '月专注时长 (分钟)', 
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#334155' } 
      },
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#94a3b8' } },
        axisLabel: { interval: statsRange === '30' ? 2 : 0 } // 点数过多时跳过标签
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#94a3b8' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      series: [
        {
          data: values,
          type: 'bar',
          itemStyle: { color: '#6366f1', borderRadius: [4, 4, 0, 0] },
          barWidth: statsRange === '30' ? '60%' : '40%'
        }
      ]
    };
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* 头部卡片*/}
      <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/50 border border-slate-100">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10"></div>
        
        <div className="relative flex flex-col md:flex-row gap-8 items-start md:items-end pt-10">
          {/* 头像*/}
          <div className="relative group">
            <div className="h-32 w-32 rounded-3xl bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-slate-300">
               {user?.avatarUrl ? (
                 <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
               ) : (
                 <User size={48} />
               )}
            </div>
          </div>

          {/* 信息*/}
          <div className="flex-1 space-y-2 mb-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold text-slate-800">{user?.nickname}</h1>
              <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                等级 {stats?.level || 0}
              </span>
              
            </div>
            <p className="text-slate-500 max-w-lg">
              {user?.bio || "这个人很懒，什么都没有写。"}
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-400 pt-2">
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                <span>地球</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>2026年1月加入</span>
              </div>
            </div>
          </div>

          {/* 操作*/}
          <div className="flex gap-2 flex-wrap">
             {['overview', 'history', 'health', 'settings'].map(tab => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`px-5 py-2.5 rounded-xl font-bold transition-all capitalize ${
                   activeTab === tab 
                   ? 'bg-slate-900 text-white shadow-lg' 
                   : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                 }`}
               >
                 {tab === 'overview' ? '总览' : 
                  tab === 'history' ? '历史' : 
                  tab === 'health' ? '健康' : <Settings size={18} />}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* 内容标签页*/}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 左列: 统计*/}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Trophy size={18} className="text-yellow-500" />
                当前数据
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50">
                  <div className="text-xs text-slate-400 uppercase font-bold">总经验值</div>
                  <div className="text-2xl font-black text-slate-800">{stats?.currentXP || 0}</div>
                </div>
                <div className="p-4 rounded-2xl bg-orange-50">
                  <div className="text-xs text-orange-400 uppercase font-bold">连续学习</div>
                  <div className="text-2xl font-black text-orange-600 flex items-center gap-1">
                    <Zap size={20} className="fill-current" />
                    {summary?.currentStreak || 0} 天
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 col-span-2">
                  <div className="text-xs text-blue-400 uppercase font-bold">下一等级</div>
                  <div className="flex items-end justify-between">
                     <div className="text-xl font-black text-blue-700">还差 {stats?.nextLevelXP - stats?.currentXP} 经验</div>
                     <div className="text-xs text-blue-500 font-bold">{stats?.progress?.toFixed(1)}%</div>
                  </div>
                  <div className="mt-2 h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${stats?.progress || 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右列: 图表*/}
          <div className="md:col-span-2 space-y-6">
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[350px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={20} className="text-indigo-600" />
                    <h3 className="font-bold text-slate-800">专注趋势</h3>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setStatsRange('7')} 
                      className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", statsRange === '7' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500")}
                    >
                      周
                    </button>
                    <button 
                      onClick={() => setStatsRange('30')} 
                      className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", statsRange === '30' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500")}
                    >
                      月
                    </button>
                  </div>
                </div>

                {summary && summary.daily ? (
                  <ReactECharts option={getChartOption()} style={{ height: '320px' }} />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    暂无活动数据。
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <History size={20} className="text-indigo-600" />
                 学习记录
               </h3>
               <div className="text-xs text-slate-400">第 {sessionPage} 页</div>
            </div>
            
            <div className="divide-y divide-slate-50">
               {sessions.length === 0 ? (
                 <div className="p-12 text-center text-slate-400">暂无记录。开始专注学习吧！</div>
               ) : (
                 sessions.map((sess) => (
                   <div key={sess.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${sess.type === 'learning' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                           {sess.type === 'learning' ? <Brain size={20} /> : <Coffee size={20} />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-700 capitalize">{sess.type === 'learning' ? '专注时间' : '休息时间'}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                             <Calendar size={12} />
                             {formatDate(sess.startTime)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                         <div className="text-right">
                           <div className="text-sm font-bold text-slate-800">{sess.durationMinutes || 0} 分钟</div>
                           <div className="text-xs text-slate-400">时长</div>
                         </div>
                      </div>
                   </div>
                 ))
               )}
            </div>

            <div className="p-4 bg-slate-50 flex justify-center gap-4">
              <Button 
                variant="outline" 
                disabled={sessionPage === 1}
                onClick={() => setSessionPage(p => p - 1)}
                className="rounded-xl border-slate-200"
              >
                <ArrowLeft size={16} className="mr-2" /> 上一页
              </Button>
              <Button 
                variant="outline" 
                disabled={!hasMoreSessions}
                onClick={() => setSessionPage(p => p + 1)}
                className="rounded-xl border-slate-200"
              >
                下一页 <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}


      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-2xl text-slate-800 flex items-center gap-3">
                <HeartPulse size={28} className="text-rose-500" />
                AI 健康与评估报告
              </h3>
              <button 
                onClick={fetchHealthReport}
                disabled={fetchingReport}
                className="px-4 py-2 bg-rose-50 text-rose-600 font-bold text-sm rounded-xl hover:bg-rose-100 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {fetchingReport ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                {fetchingReport ? '分析中...' : '生成新报告'}
              </button>
            </div>

            {fetchingReport && !healthReport ? (
              <div className="flex flex-col items-center justify-center py-20 text-rose-400">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="font-medium animate-pulse">DeepSeek AI 正在分析您的近期数据...</p>
              </div>
            ) : healthReport ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 分数标题*/}
                <div className="flex flex-col md:flex-row gap-8 items-center bg-gradient-to-r from-rose-50 to-orange-50 p-8 rounded-3xl">
                  <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-white shadow-lg border-4 border-rose-100">
                    <span className="text-4xl font-black text-rose-500">{healthReport.overallScore}</span>
                    <span className="absolute bottom-2 text-[10px] font-bold text-slate-400 uppercase">评分</span>
                  </div>
                  <div className="flex-1 space-y-3 text-center md:text-left">
                    <h4 className="text-xl font-bold text-slate-800">您的健康状态</h4>
                    <p className="text-slate-600 leading-relaxed">
                      基于您过去一周的学习时长和每日自评，这是为您生成的个性化评估。
                    </p>
                  </div>
                </div>

                {/* 网格*/}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 洞察*/}
                  <div className="bg-slate-50 p-6 rounded-3xl">
                    <h5 className="font-bold text-indigo-700 flex items-center gap-2 mb-4">
                      <Brain size={18} />
                      核心洞察
                    </h5>
                    <ul className="space-y-3">
                      {healthReport.insights?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 建议*/}
                  <div className="bg-emerald-50 p-6 rounded-3xl">
                    <h5 className="font-bold text-emerald-700 flex items-center gap-2 mb-4">
                      <Coffee size={18} />
                      行动建议
                    </h5>
                    <ul className="space-y-3">
                      {healthReport.advice?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-emerald-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 警告(如有)*/}
                {healthReport.warnings && healthReport.warnings.length > 0 && (
                  <div className="bg-red-50 border border-red-100 p-6 rounded-3xl">
                    <h5 className="font-bold text-red-600 flex items-center gap-2 mb-4">
                      <AlertTriangle size={18} />
                      需要关注
                    </h5>
                    <ul className="space-y-3">
                      {healthReport.warnings.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                <HeartPulse size={48} className="text-slate-300 mb-4" />
                <p>暂无健康报告。</p>
                <p className="text-sm mt-1">提交您的每日自评，过后再来查看吧！</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 编辑资料*/}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Edit3 size={20} className="text-indigo-600" />
              编辑资料
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">昵称</label>
                 <Input 
                   value={formData.nickname} 
                   onChange={e => setFormData({...formData, nickname: e.target.value})}
                   className="rounded-xl"
                 />
               </div>
               
               {/* 头像选择器*/}
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">头像</label>
                 <div className="grid grid-cols-4 gap-2 mb-2">
                    {PRESET_AVATARS.map((url, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setFormData({...formData, avatarUrl: url})}
                        className={cn(
                          "aspect-square rounded-xl cursor-pointer overflow-hidden border-2 transition-all hover:scale-105 bg-slate-50",
                          formData.avatarUrl === url ? "border-indigo-600 ring-2 ring-indigo-100" : "border-transparent hover:border-slate-200"
                        )}
                      >
                        <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                 </div>
                 <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs font-bold">URL</span>
                    <Input 
                      value={formData.avatarUrl} 
                      onChange={e => setFormData({...formData, avatarUrl: e.target.value})}
                      placeholder="或粘贴自定义图片 URL..."
                      className="rounded-xl pl-12 text-xs"
                    />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">简介</label>
                 <textarea 
                   className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                   value={formData.bio}
                   onChange={e => setFormData({...formData, bio: e.target.value})}
                 />
               </div>

               <Button type="submit" disabled={saving} className="w-full rounded-xl bg-slate-900">
                 {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                 保存更改
               </Button>
            </form>
          </div>

          {/* 修改密码*/}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Lock size={20} className="text-indigo-600" />
              账号安全
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">当前密码</label>
                 <Input 
                   type="password"
                   value={passData.currentPassword}
                   onChange={e => setPassData({...passData, currentPassword: e.target.value})}
                   className="rounded-xl"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">新密码</label>
                 <Input 
                   type="password"
                   value={passData.newPassword}
                   onChange={e => setPassData({...passData, newPassword: e.target.value})}
                   className="rounded-xl"
                 />
               </div>
               <Button type="submit" variant="outline" disabled={saving} className="w-full rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50">
                 更新密码
               </Button>
            </form>
          </div>

          {/*危险区域*/}
          <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-sm space-y-6 md:col-span-2 mt-4">
            <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
              <LogOut size={20} />
              危险区域
            </h3>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-red-50 rounded-2xl border border-red-100 gap-4">
              <div>
                <h4 className="font-bold text-red-800">退出登录</h4>
                <p className="text-sm text-red-600/80">在当前设备上退出您的账户。您的数据将被安全保留。</p>
              </div>
              <Button 
                onClick={() => {
                  removeToken();
                  localStorage.removeItem('study-storage');
                  localStorage.removeItem('room-storage');
                  toast.success('已成功登出 👋');
                  navigate('/login', { replace: true });
                }}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl whitespace-nowrap"
              >
                退出登录
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
