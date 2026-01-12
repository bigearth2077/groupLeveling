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
  Plus
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { getMe, getUserProfile, updateProfile, changePassword } from '@/feature/user/api';
import { getSessions, getStatsSummary } from '@/feature/study/api';
import { getMyTags, deleteMyTag, addMyTag } from '@/feature/tag/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'history' | 'skills' | 'settings'
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null); // LevelInfo
  
  // Stats Data
  const [summary, setSummary] = useState(null);
  const [statsRange, setStatsRange] = useState('7'); // '7' | '30'

  // History Data
  const [sessions, setSessions] = useState([]);
  const [sessionPage, setSessionPage] = useState(1);
  const [hasMoreSessions, setHasMoreSessions] = useState(false);

  // Skills Data
  const [myTags, setMyTags] = useState([]);
  const [newTag, setNewTag] = useState('');

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

  // Re-fetch stats when range changes
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
        
        // Also fetch tags for the header (Top Skills)
        const tags = await getMyTags();
        if (tags) {
          // Sort by XP (TotalMinutes) desc
          const sorted = [...tags].sort((a, b) => b.totalMinutes - a.totalMinutes);
          setMyTags(sorted);
        }

        // Initial stats fetch
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

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    try {
      await addMyTag(newTag.trim());
      setNewTag('');
      fetchTags(); // Refresh list
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
      // Sanitize payload
      const payload = {
        nickname: formData.nickname,
        bio: formData.bio,
        avatarUrl: formData.avatarUrl.trim() === '' ? null : formData.avatarUrl
      };

      await updateProfile(payload);
      
      // Refresh local user state
      const updated = { ...user, ...payload, avatarUrl: payload.avatarUrl || null }; // handle null specifically
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
      title: { 
        text: statsRange === '7' ? 'Weekly Focus (Minutes)' : 'Monthly Focus (Minutes)', 
        textStyle: { fontSize: 14, fontWeight: 'bold', color: '#334155' } 
      },
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#94a3b8' } },
        axisLabel: { interval: statsRange === '30' ? 2 : 0 } // Skip labels if many points
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
          </div>

          {/* Info */}
          <div className="flex-1 space-y-2 mb-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold text-slate-800">{user?.nickname}</h1>
              <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                Lvl {stats?.level || 0}
              </span>
              
              {/* Top Tags Badges */}
              {myTags.slice(0, 3).map(tag => (
                <span key={tag.tagId} className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">
                  {tag.tagName} Lv.{tag.levelInfo?.level || 0}
                </span>
              ))}
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
             {['overview', 'history', 'skills', 'settings'].map(tab => (
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={20} className="text-indigo-600" />
                    <h3 className="font-bold text-slate-800">Focus Trends</h3>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setStatsRange('7')} 
                      className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", statsRange === '7' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500")}
                    >
                      Week
                    </button>
                    <button 
                      onClick={() => setStatsRange('30')} 
                      className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", statsRange === '30' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500")}
                    >
                      Month
                    </button>
                  </div>
                </div>

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

      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Tag size={20} className="text-indigo-600" />
                My Skills & Tags
              </h3>
              <form onSubmit={handleAddTag} className="flex gap-2">
                <Input 
                  placeholder="New skill..." 
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  className="h-9 w-40 text-sm rounded-xl"
                />
                <Button type="submit" size="sm" className="rounded-xl bg-slate-900 h-9">
                  <Plus size={16} className="mr-1" /> Add
                </Button>
              </form>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myTags.map(tag => (
                <div key={tag.tagId} className="relative group p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all">
                   <div className="flex justify-between items-start mb-3 pl-2">
                      <div className="font-bold text-slate-800 text-lg capitalize">{tag.tagName}</div>
                      <div className="px-2 py-1 bg-white rounded-lg text-xs font-bold text-indigo-600 shadow-sm border border-indigo-50">
                        Lv. {tag.levelInfo?.level || 0}
                      </div>
                   </div>
                   
                   <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-400 font-medium">
                        <span>Progress</span>
                        <span>{tag.levelInfo?.currentXP || 0} min</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${tag.levelInfo?.progress || 0}%` }}></div>
                      </div>
                   </div>

                   {/* Delete Button moved to Top-Left */}
                   <button 
                     onClick={() => handleDeleteTag(tag.tagId)}
                     className="absolute top-2 left-2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 rounded-full hover:bg-white"
                     title="Remove Skill"
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
              ))}

              {/* Empty State */}
              {myTags.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border-dashed border-2 border-slate-200">
                  <p>No skills tracked yet.</p>
                  <p className="text-xs mt-1">Add a skill above or start a focus session with a tag.</p>
                </div>
              )}
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
               
               {/* Avatar Selector */}
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Avatar</label>
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
                      placeholder="Or paste a custom image URL..."
                      className="rounded-xl pl-12 text-xs"
                    />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Bio</label>
                 <textarea 
                   className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                   value={formData.bio}
                   onChange={e => setFormData({...formData, bio: e.target.value})}
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
