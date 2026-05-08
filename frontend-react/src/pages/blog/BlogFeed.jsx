import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBlogs } from '@/feature/blog/api';
import { Search, Plus, Heart, Bookmark, Clock, TrendingUp, Tag, User } from 'lucide-react';

const BlogFeed = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('latest');
  const [loading, setLoading] = useState(true);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBlogs({ page, pageSize: 12, search, sort });
      setBlogs(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, sort]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBlogs();
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
    return d.toLocaleDateString('zh-CN');
  };

  const getQualityBadge = (quality) => {
    if (!quality) return null;
    const map = {
      basic: { text: '📝 基础', cls: 'bg-slate-100 text-slate-600' },
      good: { text: '⭐ 优质', cls: 'bg-amber-50 text-amber-600' },
      excellent: { text: '🏆 精华', cls: 'bg-gradient-to-r from-violet-50 to-purple-50 text-purple-600' },
    };
    const badge = map[quality];
    if (!badge) return null;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badge.cls}`}>
        {badge.text}
      </span>
    );
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/*页眉*/}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">博客广场</h1>
          <p className="text-slate-500 mt-1">分享学习经验，记录成长历程</p>
        </div>
        <button
          onClick={() => navigate('/blogs/new')}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-sm hover:shadow-md hover:bg-blue-500 transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          写博客
        </button>
      </div>

      {/*筛选器*/}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索博客标题或内容..."
            className="w-full pl-9 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all shadow-sm"
          />
        </form>
        <div className="flex gap-2">
          <button
            onClick={() => { setSort('latest'); setPage(1); }}
            className={`flex items-center gap-1.5 px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm ${
              sort === 'latest'
                ? 'bg-blue-50 text-blue-700 border-transparent'
                : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Clock size={16} /> 最新
          </button>
          <button
            onClick={() => { setSort('popular'); setPage(1); }}
            className={`flex items-center gap-1.5 px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm ${
              sort === 'popular'
                ? 'bg-blue-50 text-blue-700 border-transparent'
                : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <TrendingUp size={16} /> 热门
          </button>
        </div>
      </div>

      {/*博客卡片网格*/}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-slate-100/60 p-6 animate-pulse shadow-sm">
              <div className="h-4 bg-slate-100 rounded-full w-3/4 mb-3" />
              <div className="h-3 bg-slate-50 rounded-full w-full mb-2" />
              <div className="h-3 bg-slate-50 rounded-full w-2/3 mb-4" />
              <div className="h-3 bg-slate-50 rounded-full w-1/3" />
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-slate-500 font-medium">还没有博客，成为第一个分享者吧！</p>
          <button
            onClick={() => navigate('/blogs/new')}
            className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors"
          >
            写第一篇
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <article
              key={blog.id}
              onClick={() => navigate(`/blog/${blog.id}`)}
              className="group bg-white rounded-[2rem] border border-slate-100/60 p-6 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all duration-300 hover:-translate-y-0.5 shadow-sm"
            >
              {/*质量徽章 + 标签*/}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {getQualityBadge(blog.aiQuality)}
                {blog.tags?.slice(0, 3).map((tag) => (
                  <span key={tag.id} className="flex items-center gap-0.5 px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full text-xs font-medium">
                    <Tag size={10} />
                    {tag.name}
                  </span>
                ))}
              </div>

              {/*标题*/}
              <h2 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                {blog.title}
              </h2>

              {/*摘要*/}
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                {blog.summary || blog.content?.slice(0, 100) + '...'}
              </p>

              {/*页脚*/}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {blog.author?.avatarUrl ? (
                    <img src={blog.author.avatarUrl} className="w-6 h-6 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                      <User size={12} className="text-blue-500" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-500">{blog.author?.nickname}</span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{formatDate(blog.createdAt)}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Heart size={12} /> {blog.likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark size={12} /> {blog.bookmarkCount}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/*分页*/}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-5 py-2.5 rounded-2xl bg-white border border-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            上一页
          </button>
          <span className="px-4 py-2.5 text-sm font-bold text-slate-500 flex items-center">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-5 py-2.5 rounded-2xl bg-white border border-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default BlogFeed;
