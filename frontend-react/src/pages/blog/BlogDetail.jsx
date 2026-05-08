import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBlog, likeBlog, unlikeBlog, bookmarkBlog, unbookmarkBlog, deleteBlog } from '@/feature/blog/api';
import { ArrowLeft, Heart, Bookmark, Tag, Clock, Edit, Trash2, User, Sparkles } from 'lucide-react';

const BlogDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUserId = localStorage.getItem('userId') || '';

  useEffect(() => {
    setLoading(true);
    getBlog(id)
      .then((data) => setBlog(data))
      .catch(() => navigate('/blogs'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleLike = async () => {
    if (!blog) return;
    try {
      if (blog.liked) {
        await unlikeBlog(blog.id);
        setBlog({ ...blog, liked: false, likeCount: blog.likeCount - 1 });
      } else {
        await likeBlog(blog.id);
        setBlog({ ...blog, liked: true, likeCount: blog.likeCount + 1 });
      }
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleBookmark = async () => {
    if (!blog) return;
    try {
      if (blog.bookmarked) {
        await unbookmarkBlog(blog.id);
        setBlog({ ...blog, bookmarked: false, bookmarkCount: blog.bookmarkCount - 1 });
      } else {
        await bookmarkBlog(blog.id);
        setBlog({ ...blog, bookmarked: true, bookmarkCount: blog.bookmarkCount + 1 });
      }
    } catch (err) {
      console.error('Bookmark failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这篇博客吗？此操作不可撤销。')) return;
    try {
      await deleteBlog(blog.id);
      navigate('/blogs');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getQualityInfo = (quality) => {
    const map = {
      basic: { text: '📝 基础', cls: 'bg-slate-100 text-slate-600', desc: 'AI 评定为基础级内容' },
      good: { text: '⭐ 优质', cls: 'bg-amber-50 text-amber-600', desc: 'AI 评定为优质内容' },
      excellent: { text: '🏆 精华', cls: 'bg-gradient-to-r from-violet-50 to-purple-50 text-purple-600', desc: 'AI 评定为精华级内容' },
    };
    return map[quality] || null;
  };

  // 简单的 Markdown 渲染
  const renderContent = (text, format) => {
    if (format === 'richtext') {
      return <div className="whitespace-pre-wrap">{text}</div>;
    }
    // Markdown 基础渲染
    let html = text
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto my-4 text-sm font-mono"><code>$2</code></pre>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-6 mb-2 text-slate-800">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3 text-slate-800">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-slate-800">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-sm font-mono">$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-indigo-200 pl-4 my-3 text-slate-600 italic">$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li class="ml-5 list-disc text-slate-600">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-5 list-decimal text-slate-600">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-4 text-slate-600 leading-relaxed">')
      .replace(/\n/g, '<br/>');
    return (
      <div
        className="prose prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: `<p class="mb-4 text-slate-600 leading-relaxed">${html}</p>` }}
      />
    );
  };

  if (loading || !blog) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-8" />
        <div className="h-10 bg-slate-200 rounded w-3/4 mb-6" />
        <div className="h-4 bg-slate-100 rounded w-full mb-3" />
        <div className="h-4 bg-slate-100 rounded w-full mb-3" />
        <div className="h-4 bg-slate-100 rounded w-2/3 mb-3" />
      </div>
    );
  }

  const isOwner = blog.userId === currentUserId;
  const qualityInfo = getQualityInfo(blog.aiQuality);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 返回 */}
      <button
        onClick={() => navigate('/blogs')}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 font-medium text-sm mb-8 transition-colors"
      >
        <ArrowLeft size={16} /> 返回广场
      </button>

      {/* AI标签 + 质量 */}
      {(blog.tags?.length > 0 || qualityInfo) && (
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {qualityInfo && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${qualityInfo.cls}`}>
              {qualityInfo.text}
            </span>
          )}
          {blog.tags?.map((tag) => (
            <span key={tag.id} className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-500 rounded-full text-xs font-medium border border-slate-100">
              <Tag size={10} />
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* 标题 */}
      <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-4 leading-tight">
        {blog.title}
      </h1>

      {/* 作者 + 元信息 */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {blog.author?.avatarUrl ? (
            <img src={blog.author.avatarUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
          )}
          <div>
            <p className="font-bold text-slate-700 text-sm">{blog.author?.nickname}</p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock size={11} />
              <span>{formatDate(blog.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* 所有者操作 */}
        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/blogs/${blog.id}/edit`)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              <Edit size={12} /> 编辑
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
            >
              <Trash2 size={12} /> 删除
            </button>
          </div>
        )}
      </div>

      {/* AI分析横幅 */}
      {blog.summary && (
        <div className="mb-8 p-4 bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 border border-indigo-100 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-indigo-500" />
            <span className="text-xs font-bold text-indigo-600">AI 分析结果</span>
          </div>
          <p className="text-sm text-slate-600 mb-2">{blog.summary}</p>
          {blog.aiXpPerTag !== undefined && blog.aiXpPerTag !== null && blog.tags?.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-indigo-500 font-medium">
              <span>获得 {blog.aiXpPerTag} XP × {blog.tags.length} 标签 = {blog.aiXpPerTag * blog.tags.length} 总 XP</span>
            </div>
          )}
        </div>
      )}

      {/* 内容 */}
      <article className="mb-10">
        {renderContent(blog.content, blog.format)}
      </article>

      {/* 互动栏 */}
      <div className="sticky bottom-6 flex justify-center">
        <div className="flex items-center gap-2 p-2 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-lg">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              blog.liked
                ? 'bg-red-50 text-red-500 border border-red-200'
                : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <Heart size={16} fill={blog.liked ? 'currentColor' : 'none'} />
            {blog.likeCount}
          </button>
          <button
            onClick={handleBookmark}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              blog.bookmarked
                ? 'bg-amber-50 text-amber-500 border border-amber-200'
                : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-amber-50 hover:text-amber-500'
            }`}
          >
            <Bookmark size={16} fill={blog.bookmarked ? 'currentColor' : 'none'} />
            {blog.bookmarkCount}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
