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
  Clock,
  ArrowLeft,
  ArrowRight,
  Coffee,
  Brain
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { getMe, getUserProfile, updateProfile, changePassword } from '@/feature/user/api';
import { getSessions, getStatsSummary } from '@/feature/study/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history' | 'settings'
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null); // LevelInfo
  
  // Data for tabs
  const [summary, setSummary] = useState(null); // Weekly stats
  const [sessions, setSessions] = useState([]); // History list
  const [sessionPage, setSessionPage] = useState(1);
  const [hasMoreSessions, setHasMoreSessions] = useState(false);

  // Edit Form State
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory(sessionPage);
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
        
        // Fetch extended profile for stats
        const profile = await getUserProfile(me.id);
        if (profile) {
          setStats(profile.levelInfo);
        }

        // Fetch Summary for Overview
        const sumResp = await getStatsSummary({ range: '7' });
        if (sumResp) {
          setSummary(sumResp);
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(formData);
      const updated = { ...user, ...formData };
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

    const dates = summary.daily.map(d => d.date.slice(5)); // 'MM-DD'
    const values = summary.daily.map(d => d.minutes);

    return {
      title: { text: 'Weekly Focus (Minutes)', textStyle: { fontSize: 14, fontWeight: 'bold', color: '#334155' } },
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#94a3b8' } }
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
          barWidth: '40%'
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
      
      {/* Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/50 border border-slate-100">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10"></div>
        
        <div className="relative flex flex-col md:flex-row gap-8 items-start md:items-end pt-10">
          {/* Avatar */}
          <div className="relative group">
            <div className="h-32 w-32 rounded-3xl bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-slate-300">
               {user?.avatarUrl ? (
                 <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
               ) : (
                 <User size={48} />
               )}
            </div>
            {activeTab === 'settings' && (
              <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold">
                <Camera size={24} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-2 mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-slate-800">{user?.nickname}</h1>
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                Lvl {stats?.level || 0}
              </span>
            </div>
            <p className="text-slate-500 max-w-lg">
              {user?.bio || "This user prefers to keep an air of mystery about them."}
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-400 pt-2">
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                <span>Earth</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>Joined Jan 2026</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
             {['overview', 'history', 'settings'].map(tab => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`px-5 py-2.5 rounded-xl font-bold transition-all capitalize ${
                   activeTab === tab 
                   ? 'bg-slate-900 text-white shadow-lg' 
                   : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                 }`}
               >
                 {tab === 'settings' ? <Settings size={18} /> : tab}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Col: Stats */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Trophy size={18} className="text-yellow-500" />
                Current Stats
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50">
                  <div className="text-xs text-slate-400 uppercase font-bold">Total XP</div>
                  <div className="text-2xl font-black text-slate-800">{stats?.currentXP || 0}</div>
                </div>
                <div className="p-4 rounded-2xl bg-orange-50">
                  <div className="text-xs text-orange-400 uppercase font-bold">Streak</div>
                  <div className="text-2xl font-black text-orange-600 flex items-center gap-1">
                    <Zap size={20} className="fill-current" />
                    {summary?.currentStreak || 0}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 col-span-2">
                  <div className="text-xs text-blue-400 uppercase font-bold">Next Level</div>
                  <div className="flex items-end justify-between">
                     <div className="text-xl font-black text-blue-700">{stats?.nextLevelXP - stats?.currentXP} XP left</div>
                     <div className="text-xs text-blue-500 font-bold">{stats?.progress?.toFixed(1)}%</div>
                  </div>
                  <div className="mt-2 h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${stats?.progress || 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Charts */}
          <div className="md:col-span-2 space-y-6">
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[350px]">
                {summary && summary.daily ? (
                  <ReactECharts option={getChartOption()} style={{ height: '320px' }} />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    No activity data available yet.
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
                 Session History
               </h3>
               <div className="text-xs text-slate-400">Page {sessionPage}</div>
            </div>
            
            <div className="divide-y divide-slate-50">
               {sessions.length === 0 ? (
                 <div className="p-12 text-center text-slate-400">No sessions found. Start focusing!</div>
               ) : (
                 sessions.map((sess) => (
                   <div key={sess.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${sess.type === 'learning' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                           {sess.type === 'learning' ? <Brain size={20} /> : <Coffee size={20} />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-700 capitalize">{sess.type === 'learning' ? 'Focus Session' : 'Break'}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                             <Calendar size={12} />
                             {formatDate(sess.startTime)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                         <div className="text-right">
                           <div className="text-sm font-bold text-slate-800">{sess.durationMinutes || 0} min</div>
                           <div className="text-xs text-slate-400">Duration</div>
                         </div>
                         {/* Optional: Add tag here if available */}
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
                <ArrowLeft size={16} className="mr-2" /> Previous
              </Button>
              <Button 
                variant="outline" 
                disabled={!hasMoreSessions}
                onClick={() => setSessionPage(p => p + 1)}
                className="rounded-xl border-slate-200"
              >
                Next <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Edit Profile */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Edit3 size={20} className="text-indigo-600" />
              Edit Profile
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Nickname</label>
                 <Input 
                   value={formData.nickname} 
                   onChange={e => setFormData({...formData, nickname: e.target.value})}
                   className="rounded-xl"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Bio</label>
                 <textarea 
                   className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                   value={formData.bio}
                   onChange={e => setFormData({...formData, bio: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Avatar URL</label>
                 <Input 
                   value={formData.avatarUrl} 
                   onChange={e => setFormData({...formData, avatarUrl: e.target.value})}
                   placeholder="https://..."
                   className="rounded-xl"
                 />
               </div>
               <Button type="submit" disabled={saving} className="w-full rounded-xl bg-slate-900">
                 {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                 Save Changes
               </Button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Lock size={20} className="text-indigo-600" />
              Security
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Current Password</label>
                 <Input 
                   type="password"
                   value={passData.currentPassword}
                   onChange={e => setPassData({...passData, currentPassword: e.target.value})}
                   className="rounded-xl"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">New Password</label>
                 <Input 
                   type="password"
                   value={passData.newPassword}
                   onChange={e => setPassData({...passData, newPassword: e.target.value})}
                   className="rounded-xl"
                 />
               </div>
               <Button type="submit" variant="outline" disabled={saving} className="w-full rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50">
                 Update Password
               </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
