import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaRegHeart, FaPlay, FaChevronUp, FaChevronDown, FaSearch, FaComment, FaBookmark, FaTrash, FaPencilAlt, FaReply } from 'react-icons/fa';
import { FiBookmark } from 'react-icons/fi';

const AdminPanel = ({ isSidebarOpen = true }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [postSearchQuery, setPostSearchQuery] = useState('');

  const [editingUser, setEditingUser] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [selectedPostComments, setSelectedPostComments] = useState([]);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);

  const [viewerPost, setViewerPost] = useState(null);
  const [viewerPosts, setViewerPosts] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);
  
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const [editMediaFile, setEditMediaFile] = useState(null);
  const [editMediaPreview, setEditMediaPreview] = useState(null);
  const editMediaInputRef = useRef(null);

  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads')) return 'https://lume-5mof.onrender.com' + url;
    return url;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, postsRes] = await Promise.all([
        axios.get('/admin/users'),
        axios.get('/admin/posts')
      ]);
      setUsers(usersRes.data);
      setPosts(postsRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных админа:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  const filteredPosts = posts.filter(post => 
    (post.content && post.content.toLowerCase().includes(postSearchQuery.toLowerCase())) ||
    (post.user?.username && post.user.username.toLowerCase().includes(postSearchQuery.toLowerCase()))
  );

  const handleUpdateUser = async () => {
    try {
      await axios.put(`/admin/users/${editingUser._id}`, editingUser);
      setUsers(prev => prev.map(u => u._id === editingUser._id ? editingUser : u));
      setEditingUser(null);
      alert('Пользователь обновлён!');
    } catch (error) {
      alert('Ошибка обновления: ' + error.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Удалить пользователя и все его посты?')) return;
    try {
      await axios.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      setPosts(prev => prev.filter(p => p.user?._id !== id));
    } catch (error) { alert('Ошибка: ' + error.message); }
  };

  const handleToggleVerify = async (id) => {
    try {
      const res = await axios.put(`/admin/verify/${id}`);
      const { isVerified } = res.data;
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isVerified } : u));
    } catch (error) { alert('Ошибка: ' + error.message); }
  };

  const handleToggleBan = async (id) => {
    try {
      const res = await axios.put(`/admin/ban/${id}`);
      const { isBanned } = res.data;
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isBanned } : u));
    } catch (error) {
      alert('Ошибка бана/разбана: ' + error.message);
    }
  };

  const handleUpdatePost = async () => {
    try {
      const formData = new FormData();
      formData.append('content', editingPost.content);
      if (editMediaFile) {
        formData.append('media', editMediaFile);
      }

      const res = await axios.put(`/admin/posts/${editingPost._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setPosts(prev => prev.map(p => p._id === editingPost._id ? res.data : p));
      setEditingPost(null);
      setEditMediaFile(null);
      setEditMediaPreview(null);
      alert('Пост и медиа обновлены!');
    } catch (error) {
      alert('Ошибка обновления: ' + error.message);
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Удалить этот пост?')) return;
    try {
      await axios.delete(`/admin/posts/${id}`);
      setPosts(prev => prev.filter(p => p._id !== id));
    } catch (error) { alert('Ошибка: ' + error.message); }
  };

  const handleOpenComments = async (postId) => {
    setActiveCommentPostId(postId);
    try {
      const res = await axios.get(`/admin/posts/${postId}/comments`);
      setSelectedPostComments(res.data);
      setCommentsModalOpen(true);
    } catch (error) { alert('Ошибка загрузки комментариев: ' + error.message); }
  };

  const handleUpdateComment = async () => {
    if (!editCommentText.trim()) return;
    try {
      const response = await axios.put(`/admin/comments/${editingComment._id}`, { text: editCommentText });
      setSelectedPostComments(prev => prev.map(c => c._id === editingComment._id ? response.data : c));
      setPosts(prev => prev.map(p => 
        p._id === activeCommentPostId ? { ...p, comments: p.comments.map(c => c._id === editingComment._id ? response.data : c) } : p
      ));
      setEditingComment(null);
    } catch (error) { alert('Ошибка обновления: ' + error.message); }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm('Удалить этот комментарий?')) return;
    try {
      await axios.delete(`/admin/comments/${id}`);
      setSelectedPostComments(prev => prev.filter(c => c._id !== id));
      setPosts(prev => prev.map(p => 
        p._id === activeCommentPostId ? { ...p, comments: p.comments.filter(c => c._id !== id) } : p
      ));
    } catch (error) { alert('Ошибка удаления: ' + error.message); }
  };

  const openViewer = (post, postsList) => {
    const index = postsList.findIndex(p => p._id === post._id);
    setViewerPosts(postsList);
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
    }
  };

  const goPrev = () => {
    if (viewerIndex > 0) {
      setViewerIndex(prev => prev - 1);
      setViewerPost(viewerPosts[viewerIndex - 1]);
      setProgress(0);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      if (duration && duration > 0) {
        setProgress((currentTime / duration) * 100);
      }
    }
  };

  // ================= ИСПРАВЛЕННЫЕ ФУНКЦИИ (Добавлено setViewerPost) =================
  const handleLike = async (postId) => {
    if (!postId) return;
    const isLiked = (p) => p.isLikedByMe || false;

    const updateLikes = (p) => p._id === postId ? {
      ...p,
      isLikedByMe: !isLiked(p),
      likes: !isLiked(p) ? [...(p.likes || []), currentUser._id] : (p.likes || []).filter(id => id !== currentUser._id)
    } : p;

    setViewerPosts(prev => prev.map(updateLikes));
    setPosts(prev => prev.map(updateLikes));
    setViewerPost(prev => prev && prev._id === postId ? updateLikes(prev) : prev); // ОБНОВЛЯЕМ ПЛЕЕР!

    try {
      const res = await axios.post(`/posts/${postId}/like`);
      const { likes, isLiked } = res.data;
      const syncLikes = (p) => p._id === postId ? { ...p, isLikedByMe: isLiked, likes: likes || [] } : p;
      setViewerPosts(prev => prev.map(syncLikes));
      setPosts(prev => prev.map(syncLikes));
      setViewerPost(prev => prev && prev._id === postId ? syncLikes(prev) : prev); // СИНХРОНИЗИРУЕМ ПЛЕЕР
    } catch (error) {
      alert('Ошибка лайка: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSave = async (postId) => {
    if (!postId) return;
    const isSaved = (p) => p.isSavedByMe || false;

    const updateSaves = (p) => p._id === postId ? {
      ...p,
      isSavedByMe: !isSaved(p),
      savedBy: !isSaved(p) ? [...(p.savedBy || []), currentUser._id] : (p.savedBy || []).filter(id => id !== currentUser._id)
    } : p;

    setViewerPosts(prev => prev.map(updateSaves));
    setPosts(prev => prev.map(updateSaves));
    setViewerPost(prev => prev && prev._id === postId ? updateSaves(prev) : prev); // ОБНОВЛЯЕМ ПЛЕЕР!

    try {
      const res = await axios.post(`/posts/${postId}/save`);
      const { isSaved, savedBy } = res.data;
      const syncSaves = (p) => p._id === postId ? { ...p, isSavedByMe: isSaved, savedBy: savedBy || [] } : p;
      setViewerPosts(prev => prev.map(syncSaves));
      setPosts(prev => prev.map(syncSaves));
      setViewerPost(prev => prev && prev._id === postId ? syncSaves(prev) : prev); // СИНХРОНИЗИРУЕМ ПЛЕЕР
    } catch (error) {
      alert('Ошибка сохранения: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim() || !postId) return;
    try {
      const response = await axios.post(`/posts/${postId}/comment`, { text: commentText });
      const newComment = response.data;
      const updatePostComments = (p) => p._id === postId ? { ...p, comments: [...p.comments, newComment] } : p;
      setViewerPost(prev => ({ ...prev, comments: [...prev.comments, newComment] }));
      setViewerPosts(prev => prev.map(updatePostComments));
      setPosts(prev => prev.map(updatePostComments));
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
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: updateComments(p.comments) } : p));
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
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: updateReplies(p.comments) } : p));
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
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: updateComment(p.comments) } : p));
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
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: filterComment(p.comments) } : p));
    } catch (error) {
      alert('Ошибка удаления: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div className="min-h-screen bg-dark flex items-center justify-center text-white/50">Загрузка панели...</div>;

  return (
    // ... Твой оригинальный return. Скопируй его из своего исходного файла.
    <div className="min-h-screen bg-dark p-8 flex flex-col items-center text-white relative">
      {/* Твой оригинальный JSX */}
    </div>
  );
};

export default AdminPanel;