import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createBlog, getBlog, updateBlog } from '@/feature/blog/api';
import { ArrowLeft, Send, Save, Type, Code } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const BlogEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // 有 id 时为编辑模式
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [format, setFormat] = useState('markdown'); // 'markdown' | 'richtext'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tiptap 编辑器设置
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  // 编辑模式：加载已有博客
  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      getBlog(id)
        .then((blog) => {
          setTitle(blog.title);
          setContent(blog.content);
          setFormat(blog.format || 'markdown');
          if (blog.format === 'richtext' && editor) {
            editor.commands.setContent(blog.content);
          }
        })
        .catch(() => navigate('/blogs'))
        .finally(() => setLoading(false));
    }
  }, [id, isEditing, navigate]);

  const handlePublish = async () => {
    if (!title.trim()) return alert('请输入标题');
    if (!content.trim()) return alert('请输入内容');

    setSaving(true);
    try {
      if (isEditing) {
        await updateBlog(id, { title, content, format, status: 'published' });
      } else {
        await createBlog({ title, content, format, status: 'published' });
      }
      navigate('/blogs');
    } catch (err) {
      console.error('Failed to save blog:', err);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) return alert('请输入标题');

    setSaving(true);
    try {
      if (isEditing) {
        await updateBlog(id, { title, content, format, status: 'draft' });
      } else {
        await createBlog({ title, content, format, status: 'draft' });
      }
      navigate('/blogs');
    } catch (err) {
      console.error('Failed to save draft:', err);
    } finally {
      setSaving(false);
    }
  };

  const wordCount = content ? content.replace(/<[^>]*>?/gm, '').length : 0;

  // 渲染 Tiptap 工具栏
  const MenuBar = () => {
    if (!editor) return null;
    return (
      <div className="flex items-center gap-2 p-2 border-b border-slate-200 bg-slate-50 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('bold') ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-200'}`}
        >
          加粗
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('italic') ? 'bg-indigo-100 text-indigo-700 italic' : 'text-slate-600 hover:bg-slate-200'}`}
        >
          斜体
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-200'}`}
        >
          标题2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-200'}`}
        >
          标题3
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('bulletList') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
        >
          无序列表
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('orderedList') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
        >
          有序列表
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('codeBlock') ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
        >
          代码块
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/blogs')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors"
        >
          <ArrowLeft size={16} /> 返回
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Save size={14} /> 存草稿
          </button>
          <button
            onClick={handlePublish}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-50 active:scale-95"
          >
            <Send size={14} /> {isEditing ? '更新发布' : '发布'}
          </button>
        </div>
      </div>

      {/* 标题 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="输入文章标题..."
        className="w-full text-3xl font-black text-slate-800 placeholder-slate-300 border-none outline-none mb-6 bg-transparent"
      />

      {/* 编辑器模式标签 + 预览切换 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setFormat('markdown')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              format === 'markdown'
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-600'
            }`}
          >
            <Code size={12} /> Markdown
          </button>
          <button
            onClick={() => setFormat('richtext')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              format === 'richtext'
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-600'
            }`}
          >
            <Type size={12} /> 富文本
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${wordCount >= 200 ? 'text-emerald-500' : 'text-slate-400'}`}>
            {wordCount} 字 {wordCount < 200 && '(≥200 字触发 AI 分析)'}
          </span>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" data-color-mode="light">
        {format === 'markdown' ? (
          <MDEditor
            value={content}
            onChange={setContent}
            height={500}
            preview="edit"
            className="w-full !border-none"
          />
        ) : (
          <div className="flex flex-col min-h-[500px]">
            <MenuBar />
            <EditorContent editor={editor} className="p-4 prose max-w-none flex-1 focus:outline-none" />
          </div>
        )}
      </div>

      {/* AI 信息横幅 */}
      {wordCount >= 200 && (
        <div className="mt-4 px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl">
          <p className="text-xs font-medium text-indigo-600">
            ✨ 发布后 AI 将自动分析内容，提取技能标签并评估 XP 奖励
          </p>
        </div>
      )}
    </div>
  );
};

export default BlogEditor;
