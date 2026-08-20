import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaEllipsisV, FaPencilAlt, FaTrash, FaTimes, FaCheck } from 'react-icons/fa';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 3 nuqta menyusi qaysi postda ochiqligini saqlash
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Post tahrirlash uchun modal va matn state'lari
  const [editingPost, setEditingPost] = useState(null);
  const [editCaption, setEditCaption] = useState('');

  useEffect(() => {
    if (currentUser?._id) {
      fetchUserPosts();
    }
    
    // Ekran boshqa joyiga bosilganda ochiq 3-nuqta menyusini yopish
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [currentUser]);

  const fetchUserPosts = async () => {
    try {
      const res = await axios.get(`/posts/user/${currentUser._id}`);
      setPosts(res.data);
    } catch (error) {
      console.error('Ошибка загрузки постов:', error);
    } finally {
      setLoading(false);
    }
  };

  // POSTNI O'CHIRISH
  const handleDeletePost = async (postId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Вы уверены, что хотите удалить этот пост?')) return;

    try {
      await axios.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(post => post._id !== postId));
      setActiveMenuId(null);
    } catch (error) {
      alert('Ошибка при удалении: ' + (error.response?.data?.message || error.message));
    }
  };

  // TAHRIRLASHNI BOSHLASH (MODAL OCHISH)
  const handleStartEdit = (post, e) => {
    if (e) e.stopPropagation();
    setEditingPost(post);
    setEditCaption(post.caption || post.content || '');
    setActiveMenuId(null);
  };

  // TAHRIRNI SAQLASH
  const handleSaveEdit = async () => {
    if (!editingPost) return;
    try {
      const res = await axios.put(`/posts/${editingPost._id}`, { caption: editCaption, content: editCaption });
      setPosts(prev => prev.map(p => p._id === editingPost._id ? { ...p, caption: editCaption, content: editCaption } : p));
      setEditingPost(null);
      setEditCaption('');
    } catch (error) {
      alert('Ошибка при сохранении: ' + (error.response?.data?.message || error.message));
    }
  };

  // 3 NUQTANI BOSGANDA MENYUNI TOGGLE QILISH
  const toggleMenu = (postId, e) => {
    e.stopPropagation();
    setActiveMenuId(prev => prev === postId ? null : postId);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 text-white">
      {/* PROFIL SHAPKASI */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 text-center mb-8 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full border-2 border-accent overflow-hidden mb-3 relative flex items-center justify-center bg-gray-800 text-2xl font-bold">
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            currentUser?.username?.charAt(0).toUpperCase()
          )}
        </div>

        <h2 className="text-xl font-bold flex items-center gap-1">
          @{currentUser?.username}
          <span className="text-blue-500 text-sm">✓</span>
        </h2>
        <p className="text-white/60 text-sm mt-1 max-w-md">
          {currentUser?.bio || 'I make car edits on youtube'}
        </p>

        <div className="flex gap-6 my-4 text-sm font-medium">
          <div><span className="font-bold">{currentUser?.followers?.length || 1}</span> <span className="text-white/50">подписчиков</span></div>
          <div><span className="font-bold">{currentUser?.following?.length || 3}</span> <span className="text-white/50">подписок</span></div>
        </div>

        <button 
          onClick={() => navigate('/settings')}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 py-2 rounded-xl text-sm font-medium transition"
        >
          Редактировать профиль
        </button>
      </div>

      {/* POSTLAR GRIDI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {posts.map((post) => (
          <div 
            key={post._id}
            onClick={() => navigate(`/post/${post._id}`)}
            className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 group cursor-pointer"
          >
            {/* MEDIA PREVIEW */}
            {post.mediaType === 'video' || post.videoUrl || post.mediaUrl?.endsWith('.mp4') ? (
              <video 
                src={post.videoUrl || post.mediaUrl} 
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <img 
                src={post.imageUrl || post.mediaUrl} 
                alt="Post" 
                className="w-full h-full object-cover"
              />
            )}

            {/* OVERLAY VA LIKELAR */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 pointer-events-none">
              <div className="flex items-center gap-1 text-white text-sm font-medium">
                <FaHeart className="text-red-500" />
                <span>{post.likes?.length || 0}</span>
              </div>
            </div>

            {/* 3 NUQTA TUGMASI VA DROPDOWN */}
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={(e) => toggleMenu(post._id, e)}
                className="p-2 bg-black/50 hover:bg-black/80 rounded-full text-white/80 hover:text-white backdrop-blur-md transition"
                title="Опции"
              >
                <FaEllipsisV size={14} />
              </button>

              {/* MENYU DROPDOWN */}
              {activeMenuId === post._id && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-36 bg-gray-900/95 border border-white/15 backdrop-blur-xl rounded-xl shadow-2xl py-1 z-20 overflow-hidden"
                >
                  <button
                    onClick={(e) => handleStartEdit(post, e)}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-2 transition"
                  >
                    <FaPencilAlt size={12} /> Изменить
                  </button>
                  <button
                    onClick={(e) => handleDeletePost(post._id, e)}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition"
                  >
                    <FaTrash size={12} /> Удалить
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* BO'SH STATE */}
      {!loading && posts.length === 0 && (
        <p className="text-center text-white/30 my-10">У вас пока нет публикаций.</p>
      )}

      {/* POST MATNINI TAHRIRLASH MODAL OYNASI */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-white/15 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setEditingPost(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition"
            >
              <FaTimes size={18} />
            </button>

            <h3 className="text-lg font-bold mb-4">Редактировать описание</h3>

            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-white outline-none focus:border-accent text-sm resize-none h-28 mb-4 placeholder:text-white/30"
              placeholder="Введите новое описание..."
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
              >
                <FaCheck size={12} /> Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;