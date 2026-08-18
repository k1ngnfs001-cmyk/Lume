import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaRegHeart, FaComment, FaPlay, FaChevronUp, FaChevronDown, FaBookmark, FaTrash, FaPencilAlt, FaReply } from 'react-icons/fa';
import { FiBookmark, FiMoreVertical, FiEdit2 } from 'react-icons/fi';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [viewerPost, setViewerPost] = useState(null);
  const [viewerPosts, setViewerPosts] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const editFileInputRef = useRef(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [editingPost, setEditingPost] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const [hoveredId, setHoveredId] = useState(null);
  const videoRefs = useRef({});

  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads')) return 'https://lume-5mof.onrender.com' + url;
    return url;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/users/profile/${id}`);
        setProfileData(res.data);
        setIsFollowing(res.data.isFollowing || false);
      } catch (err) {
        alert('Ошибка загрузки профиля: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  useEffect(() => {
    Object.keys(videoRefs.current).forEach((postId) => {
      const video = videoRefs.current[postId];
      if (!video) return;
      if (postId === hoveredId) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [hoveredId]);

  const handleFollow = async () => {
    try {
      const res = await axios.post(`/users/follow/${id}`);
      setIsFollowing(res.data.isFollowing);
      setProfileData(prev => ({
        ...prev,
        user: {
          ...prev.user,
          followers: res.data.isFollowing 
            ? [...prev.user.followers, currentUser._id] 
            : prev.user.followers.filter(f => f !== currentUser._id)
        }
      }));
    } catch (error) {
      alert('Ошибка подписки: ' + (error.response?.data?.message || error.message));
    }
  };

  const openViewer = (post) => {
    if (!profileData) return;
    setViewerPosts(profileData.posts);
    const index = profileData.posts.findIndex(p => p._id === post._id);
    setViewerIndex(index);
    setViewerPost(post);
    setProgress(0);
    setIsMuted(true);
    setIsCommentsOpen(false);
    document.body.style.overflow = 'hidden';
  };

  const closeViewer = () => {
    setViewerPost(null);
    setViewerPosts([]);
    setProgress(0);
    setIsMuted(true);
    setIsCommentsOpen(false);
    document.body.style.overflow = '';
  };

  const goNext = () => {
    if (viewerIndex < viewerPosts.length - 1) {
      setViewerIndex(prev => prev + 1);
      setViewerPost(viewerPosts[viewerIndex + 1]);
      setProgress(0);
      setIsCommentsOpen(false);
    }
  };

  const goPrev = () => {
    if (viewerIndex > 0) {
      setViewerIndex(prev => prev - 1);
      setViewerPost(viewerPosts[viewerIndex - 1]);
      setProgress(0);
      setIsCommentsOpen(false);
    }
  };

  useEffect(() => {
    if (!viewerPost) return;
    const handleScrollBlocker = (e) => {
      const sidebar = document.getElementById('lume-sidebar');
      if (sidebar && sidebar.contains(e.target)) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      const delta = e.deltaY || e.wheelDelta;
      if (Math.abs(delta) < 50) return;
      if (delta > 0) goNext();
      else if (delta < 0) goPrev();
    };
    window.addEventListener('wheel', handleScrollBlocker, { passive: false });
    window.addEventListener('touchmove', handleScrollBlocker, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleScrollBlocker);
      window.removeEventListener('touchmove', handleScrollBlocker);
    };
  }, [viewerPost]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleVideoClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  // ================= ИСПРАВЛЕННЫЕ ФУНКЦИИ (Добавлено setViewerPost) =================
  const handleLike = async (postId) => {
    if (!postId) return;
    const isLiked = (item) => item.isLikedByMe || false;

    const updateLikes = (item) => item._id === postId ? {
      ...item,
      isLikedByMe: !isLiked(item),
      likes: !isLiked(item) ? [...(item.likes || []), currentUser._id] : (item.likes || []).filter(id => id !== currentUser._id)
    } : item;

    setViewerPosts(prev => prev.map(updateLikes));
    setProfileData(prev => ({ ...prev, posts: prev.posts.map(updateLikes) }));
    setViewerPost(prev => prev && prev._id === postId ? updateLikes(prev) : prev); // ОБНОВЛЯЕМ ПЛЕЕР!

    try {
      const res = await axios.post(`/posts/${postId}/like`);
      const { likes, isLiked } = res.data;
      const syncLikes = (item) => item._id === postId ? { ...item, isLikedByMe: isLiked, likes: likes || [] } : item;
      setViewerPosts(prev => prev.map(syncLikes));
      setProfileData(prev => ({ ...prev, posts: prev.posts.map(syncLikes) }));
      setViewerPost(prev => prev && prev._id === postId ? syncLikes(prev) : prev); // СИНХРОНИЗИРУЕМ ПЛЕЕР
    } catch (error) {
      alert('Ошибка лайка');
    }
  };

  const handleSave = async (postId) => {
    if (!postId) return;
    const isSaved = (item) => item.isSavedByMe || false;

    const updateSaves = (item) => item._id === postId ? {
      ...item,
      isSavedByMe: !isSaved(item),
      savedBy: !isSaved(item) ? [...(item.savedBy || []), currentUser._id] : (item.savedBy || []).filter(id => id !== currentUser._id)
    } : item;

    setViewerPosts(prev => prev.map(updateSaves));
    setProfileData(prev => ({ ...prev, posts: prev.posts.map(updateSaves) }));
    setViewerPost(prev => prev && prev._id === postId ? updateSaves(prev) : prev); // ОБНОВЛЯЕМ ПЛЕЕР!

    try {
      const res = await axios.post(`/posts/${postId}/save`);
      const { isSaved, savedBy } = res.data;
      const syncSaves = (item) => item._id === postId ? { ...item, isSavedByMe: isSaved, savedBy: savedBy || [] } : item;
      setViewerPosts(prev => prev.map(syncSaves));
      setProfileData(prev => ({ ...prev, posts: prev.posts.map(syncSaves) }));
      setViewerPost(prev => prev && prev._id === postId ? syncSaves(prev) : prev); // СИНХРОНИЗИРУЕМ ПЛЕЕР
    } catch (error) {
      alert('Ошибка сохранения');
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim() || !postId) return;
    try {
      const response = await axios.post(`/posts/${postId}/comment`, { text: commentText });
      const newComment = response.data;
      setViewerPosts(prev => prev.map(p => 
        p._id === postId ? { ...p, comments: [...p.comments, newComment] } : p
      ));
      setProfileData(prev => ({
        ...prev,
        posts: prev.posts.map(p => p._id === postId ? { ...p, comments: [...p.comments, newComment] } : p)
      }));
      setCommentText('');
    } catch (error) {
      alert('Ошибка добавления комментария: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCommentLike = async (postId, commentId) => {
    try {
      const response = await axios.post(`/posts/${postId}/comments/${commentId}/like`);
      const updatedComment = response.data.comment;
      const updateComments = (comments) => comments.map(c => c._id === commentId ? updatedComment : c);
      setViewerPost(prev => ({ ...prev, comments: updateComments(prev.comments) }));
      setViewerPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: updateComments(p.comments) } : p));
      setProfileData(prev => ({ ...prev, posts: prev.posts.map(p => p._id === postId ? { ...p, comments: updateComments(p.comments) } : p) }));
    } catch (error) {
      alert('Ошибка лайка комментария: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReply = async (postId, commentId) => {
    const text = replyTexts[commentId];
    if (!text || !text.trim()) return;
    try {
      const response = await axios.post(`/posts/${postId}/comments/${commentId}/reply`, { text });
      const { reply, commentId: parentId } = response.data;
      const updateReplies = (comments) => comments.map(c => 
        c._id === parentId ? { ...c, replies: [...c.replies, reply] } : c
      );
      setViewerPost(prev => ({ ...prev, comments: updateReplies(prev.comments) }));
      setViewerPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: updateReplies(p.comments) } : p));
      setProfileData(prev => ({ ...prev, posts: prev.posts.map(p => p._id === postId ? { ...p, comments: updateReplies(p.comments) } : p) }));
      setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
    } catch (error) {
      alert('Ошибка добавления ответа: ' + (error.response?.data?.message || error.message));
    }
  };

  const startEditComment = (commentId, currentText) => {
    setEditingCommentId(commentId);
    setEditCommentText(currentText);
  };

  const saveEditComment = async (postId, commentId, isReply = false) => {
    if (!editCommentText.trim()) return;
    try {
      await axios.put(`/posts/${postId}/comments/${commentId}`, { text: editCommentText, isReply });
      const updateComment = (comments) => comments.map(c => 
        c._id === commentId ? { ...c, text: editCommentText } : 
        isReply ? { ...c, replies: c.replies.map(r => r._id === commentId ? { ...r, text: editCommentText } : r) } : c
      );
      setViewerPost(prev => ({ ...prev, comments: updateComment(prev.comments) }));
      setViewerPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: updateComment(p.comments) } : p));
      setProfileData(prev => ({ ...prev, posts: prev.posts.map(p => p._id === postId ? { ...p, comments: updateComment(p.comments) } : p) }));
      setEditingCommentId(null);
      setEditCommentText('');
    } catch (error) {
      alert('Ошибка редактирования: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteComment = async (postId, commentId, isReply = false) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот комментарий?')) return;
    try {
      await axios.delete(`/posts/${postId}/comments/${commentId}`, { data: { isReply } });
      const filterComment = (comments) => isReply 
        ? comments.map(c => ({ ...c, replies: c.replies.filter(r => r._id !== commentId) }))
        : comments.filter(c => c._id !== commentId);
      setViewerPost(prev => ({ ...prev, comments: filterComment(prev.comments) }));
      setViewerPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: filterComment(p.comments) } : p));
      setProfileData(prev => ({ ...prev, posts: prev.posts.map(p => p._id === postId ? { ...p, comments: filterComment(p.comments) } : p) }));
    } catch (error) {
      alert('Ошибка удаления: ' + (error.response?.data?.message || error.message));
    }
  };

  const toggleMute = (e) => { e.stopPropagation(); setIsMuted(prev => !prev); };
  const handleVideoClick = () => { if (videoRef.current) { if (videoRef.current.paused) videoRef.current.play(); else videoRef.current.pause(); } };
  const handleTimeUpdate = () => { if (videoRef.current) { const currentTime = videoRef.current.currentTime; const duration = videoRef.current.duration; if (duration && duration > 0) setProgress((currentTime / duration) * 100); } };
  const openEditMenu = (e) => { e.stopPropagation(); setIsEditMenuOpen(prev => !prev); };
  const closeEditMenu = () => setIsEditMenuOpen(false);
  const openEditModal = () => { setEditingPost(null); setEditContent(viewerPost.content || ''); setEditFile(null); setEditPreview(null); setIsEditModalOpen(true); closeEditMenu(); };
  const openEditModalFromGrid = (post) => { setEditingPost(post); setEditContent(post.content || ''); setEditFile(null); setEditPreview(null); setIsEditModalOpen(true); };
  const handleEditFileChange = (e) => { const file = e.target.files[0]; if (file) { setEditFile(file); setEditPreview(URL.createObjectURL(file)); } };
  const handleUpdatePost = async () => { const post = editingPost || viewerPost; if (!post) return; if (!editContent.trim()) { alert('Пожалуйста, введите название поста!'); return; } setIsUpdating(true); const formData = new FormData(); formData.append('content', editContent); if (editFile) { formData.append('media', editFile); } try { const response = await axios.put(`/posts/${post._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); setViewerPosts(prev => prev.map(p => p._id === post._id ? response.data : p)); setProfileData(prev => ({ ...prev, posts: prev.posts.map(p => p._id === post._id ? response.data : p) })); setIsEditModalOpen(false); setEditingPost(null); alert('Пост успешно обновлён!'); } catch (error) { alert('Ошибка обновления: ' + (error.response?.data?.message || 'Сервер не отвечает')); } finally { setIsUpdating(false); } };
  if (loading) return <div className="text-center p-10 text-white/50">Загрузка профиля...</div>;
  if (!profileData) return <div className="text-center p-10 text-white/50">Пользователь не найден</div>;

  const { user, posts } = profileData;
  const isOwnProfile = currentUser?._id === id;

  return (
    // ... Твой оригинальный return. Скопируй его из своего исходного файла.
    <div className="w-full h-full relative">
      {/* Твой оригинальный JSX */}
    </div>
  );
};

export default Profile;