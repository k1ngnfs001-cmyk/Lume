import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaChevronUp, FaChevronDown, FaBookmark, FaPlay, FaTrash, FaPencilAlt, FaReply } from 'react-icons/fa';
import { FiBookmark, FiMoreVertical, FiEdit2 } from 'react-icons/fi';

const ReelsFeed = ({ feedType = 'global' }) => {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const editFileInputRef = useRef(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [replyTexts, setReplyTexts] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads')) return 'https://lume-5mof.onrender.com' + url;
    return url;
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const endpoint = feedType === 'following' ? '/posts/following' : '/posts';
        const res = await axios.get(endpoint);
        setPosts(res.data);
      } catch (error) {
        alert('Ошибка загрузки ленты: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [feedType]); // <--- Убрал location.key, чтобы при переключении постов лента не перезагружалась

  useEffect(() => {
    setProgress(0);
    setIsPlaying(true);
  }, [currentIndex]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, currentIndex]);

  // ===== ИСПРАВЛЕННЫЕ ФУНКЦИИ (Добавлена защита от быстрых нажатий) =====
  const handleLike = async (postId) => {
    if (!postId || isUpdating) return;
    setIsUpdating(true);
    const isLiked = (post) => post.isLikedByMe || false;

    setPosts(prev => prev.map(p => 
      p._id === postId ? { 
        ...p, 
        isLikedByMe: !isLiked(p), 
        likes: !isLiked(p) ? [...(p.likes || []), user._id] : (p.likes || []).filter(id => id !== user._id) 
      } : p
    ));

    try {
      const res = await axios.post(`/posts/${postId}/like`);
      const { likes, isLiked } = res.data;
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, isLikedByMe: isLiked, likes: likes || [] } : p));
    } catch (error) {
      alert('Ошибка лайка: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSave = async (postId) => {
    if (!postId || isUpdating) return;
    setIsUpdating(true);
    const isSaved = (post) => post.isSavedByMe || false;

    setPosts(prev => prev.map(p => 
      p._id === postId ? { 
        ...p, 
        isSavedByMe: !isSaved(p), 
        savedBy: !isSaved(p) ? [...(p.savedBy || []), user._id] : (p.savedBy || []).filter(id => id !== user._id) 
      } : p
    ));

    try {
      const res = await axios.post(`/posts/${postId}/save`);
      const { isSaved, savedBy } = res.data;
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, isSavedByMe: isSaved, savedBy: savedBy || [] } : p));
    } catch (error) {
      alert('Ошибка сохранения: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFollow = async (targetUserId) => {
    if (!user || !targetUserId || targetUserId === user._id) return;
    try {
      const response = await axios.post(`/users/follow/${targetUserId}`);
      const { isFollowing } = response.data;
      setUser(prev => {
        if (!prev) return prev;
        const currentFollowing = prev.following || [];
        const newFollowing = isFollowing
          ? [...currentFollowing, targetUserId]
          : currentFollowing.filter(id => id !== targetUserId);
        const updatedUser = { ...prev, following: newFollowing };
        localStorage.setItem('lumeUser', JSON.stringify(updatedUser));
        return updatedUser;
      });
    } catch (error) {
      alert('Ошибка подписки: ' + (error.response?.data?.message || error.message));
    }
  };

  const toggleMute = (e) => { e.stopPropagation(); setIsMuted(prev => !prev); };
  const handleVideoClick = () => { if (videoRef.current) { if (videoRef.current.paused) videoRef.current.play(); else videoRef.current.pause(); } };
  const handleTimeUpdate = () => { if (videoRef.current) { const currentTime = videoRef.current.currentTime; const duration = videoRef.current.duration; if (duration && duration > 0) setProgress((currentTime / duration) * 100); } };
  const openEditMenu = (e) => { e.stopPropagation(); setIsEditMenuOpen(prev => !prev); };
  const closeEditMenu = () => setIsEditMenuOpen(false);
  const openEditModal = () => { const post = posts[currentIndex]; setEditContent(post.content || ''); setEditFile(null); setEditPreview(null); setIsEditModalOpen(true); closeEditMenu(); };
  const handleEditFileChange = (e) => { const file = e.target.files[0]; if (file) { setEditFile(file); setEditPreview(URL.createObjectURL(file)); } };
  const handleUpdatePost = async () => { const post = posts[currentIndex]; if (!post) return; if (!editContent.trim()) { alert('Пожалуйста, введите название поста!'); return; } setIsUpdating(true); const formData = new FormData(); formData.append('content', editContent); if (editFile) formData.append('media', editFile); try { const response = await axios.put(`/posts/${post._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); setPosts(prev => prev.map(p => p._id === post._id ? response.data : p)); setIsEditModalOpen(false); alert('Пост успешно обновлён!'); } catch (error) { alert('Ошибка обновления: ' + (error.response?.data?.message || 'Сервер не отвечает')); } finally { setIsUpdating(false); } };
  const handleAddComment = async (postId) => { if (!commentText.trim() || !postId) return; try { const response = await axios.post(`/posts/${postId}/comment`, { text: commentText }); const newComment = response.data; setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: [...p.comments, newComment] } : p)); setCommentText(''); } catch (error) { alert('Ошибка добавления комментария: ' + (error.response?.data?.message || error.message)); } };
  const handleCommentLike = async (postId, commentId) => { try { const response = await axios.post(`/posts/${postId}/comments/${commentId}/like`); const updatedComment = response.data.comment; setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: p.comments.map(c => c._id === commentId ? updatedComment : c) } : p)); } catch (error) { alert('Ошибка лайка комментария: ' + (error.response?.data?.message || error.message)); } };
  const handleReply = async (postId, commentId) => { const text = replyTexts[commentId]; if (!text || !text.trim()) return; try { const response = await axios.post(`/posts/${postId}/comments/${commentId}/reply`, { text }); const { reply, commentId: parentId } = response.data; setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: p.comments.map(c => c._id === parentId ? { ...c, replies: [...c.replies, reply] } : c) } : p)); setReplyTexts(prev => ({ ...prev, [commentId]: '' })); } catch (error) { alert('Ошибка добавления ответа: ' + (error.response?.data?.message || error.message)); } };
  const startEditComment = (commentId, currentText) => { setEditingCommentId(commentId); setEditCommentText(currentText); };
  const saveEditComment = async (postId, commentId, isReply = false) => { if (!editCommentText.trim()) return; try { await axios.put(`/posts/${postId}/comments/${commentId}`, { text: editCommentText, isReply }); setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: isReply ? p.comments.map(c => ({ ...c, replies: c.replies.map(r => r._id === commentId ? { ...r, text: editCommentText } : r) })) : p.comments.map(c => c._id === commentId ? { ...c, text: editCommentText } : c) } : p)); setEditingCommentId(null); setEditCommentText(''); } catch (error) { alert('Ошибка редактирования: ' + (error.response?.data?.message || error.message)); } };
  const deleteComment = async (postId, commentId, isReply = false) => { if (!window.confirm('Вы уверены, что хотите удалить этот комментарий?')) return; try { await axios.delete(`/posts/${postId}/comments/${commentId}`, { data: { isReply } }); setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: isReply ? p.comments.map(c => ({ ...c, replies: c.replies.filter(r => r._id !== commentId) })) : p.comments.filter(c => c._id !== commentId) } : p)); } catch (error) { alert('Ошибка удаления: ' + (error.response?.data?.message || error.message)); } };
  const goToNext = useCallback(() => { if (currentIndex < posts.length - 1) setCurrentIndex(prev => prev + 1); }, [currentIndex, posts.length]);
  const goToPrev = useCallback(() => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); }, [currentIndex]);

  useEffect(() => {
    const handleGlobalScroll = (e) => {
      const sidebar = document.getElementById('lume-sidebar'); if (sidebar && sidebar.contains(e.target)) return; if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; const delta = e.deltaY; if (Math.abs(delta) < 30) return; let shouldSwitch = false; if (delta > 0 && currentIndex < posts.length - 1) shouldSwitch = true; else if (delta < 0 && currentIndex > 0) shouldSwitch = true; if (shouldSwitch) { e.preventDefault(); if (delta > 0) goToNext(); else if (delta < 0) goToPrev(); } };
    window.addEventListener('wheel', handleGlobalScroll, { passive: false });
    return () => window.removeEventListener('wheel', handleGlobalScroll);
  }, [currentIndex, posts.length, goToNext, goToPrev]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; if (e.key === 'ArrowDown') { e.preventDefault(); goToNext(); } else if (e.key === 'ArrowUp') { e.preventDefault(); goToPrev(); } else if (e.key === ' ') { e.preventDefault(); handleVideoClick(); } };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  if (loading) return <div className="w-full h-screen flex items-center justify-center bg-[#0a0a0a] text-white/50">Lume загружается...</div>;
  if (posts.length === 0) return <div className="w-full h-screen flex items-center justify-center bg-[#0a0a0a] text-white/50">Лента пуста...</div>;

  const post = posts[currentIndex];
  const isLiked = post.isLikedByMe || (post.likes && post.likes.includes(user?._id));
  const isSaved = post.isSavedByMe || (post.savedBy && post.savedBy.includes(user?._id));
  const isFollowingAuthor = user?.following?.map(id => id.toString()).includes(post.user?._id.toString());
  const canEdit = user && user._id === post.user?._id;

  return (
    // ... Весь твой JSX return остаётся без изменений. Копируй его из своего исходного файла.
    // Я оставлю его здесь сокращённым, но ты можешь просто вставить свой оригинальный return
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a0a] flex flex-row items-center justify-center">
      {/* Твой оригинальный JSX плеера */}
    </div>
  );
};

export default ReelsFeed;