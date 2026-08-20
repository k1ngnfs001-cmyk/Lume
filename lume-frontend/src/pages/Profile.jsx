import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { FaHeart, FaEllipsisV, FaPencilAlt, FaTrash, FaTimes, FaCheck, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { postId: urlPostId } = useParams();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Grid'dagi 3 nuqta menyusi uchun
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Tanlangan post modali (ikkinchi rasmdagi to'liq ko'rinish)
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalMenuOpen, setModalMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Tahrirlash modali state'lari
  const [editingPost, setEditingPost] = useState(null);
  const [editCaption, setEditCaption] = useState('');

  useEffect(() => {
    if (currentUser?._id) {
      fetchUserPosts();
    }
  }, [currentUser]);

  // URL'da postId bo'lsa yoki post bosilsa modalni ochish
  useEffect(() => {
    if (urlPostId && posts.length > 0) {
      const found = posts.find(p => p._id === urlPostId);
      if (found) setSelectedPost(found);
    }
  }, [urlPostId, posts]);

  // Ekran bo'ylab bosilganda menyularni yopish (closest orqali to'g'rilandi)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.menu-container')) {
        setActiveMenuId(null);
        setModalMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  // POSTNI O'CHIRISH (Ham grid'dan, ham modal ichidan ishlaydi)
  const handleDeletePost = async (postId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Вы уверены, что хотите удалить этот пост?')) return;

    try {
      await axios.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(post => post._id !== postId));
      setActiveMenuId(null);
      setModalMenuOpen(false);
      if (selectedPost?._id === postId) {
        setSelectedPost(null);
        navigate('/profile');
      }
    } catch (error) {
      alert('Ошибка при удалении: ' + (error.response?.data?.message || error.message));
    }
  };

  // TAHRIRLASHNI BOSHLASH
  const handleStartEdit = (post, e) => {
    if (e) e.stopPropagation();
    setEditingPost(post);
    setEditCaption(post.caption || post.content || '');
    setActiveMenuId(null);
    setModalMenuOpen(false);
  };

  // TAHRIRNI SAQLASH
  const handleSaveEdit = async () => {
    if (!editingPost) return;
    try {
      const res = await axios.put(`/posts/${editingPost._id}`, { caption: editCaption, content: editCaption });
      const updatedData = { ...editingPost, caption: editCaption, content: editCaption };
      
      setPosts(prev => prev.map(p => p._id === editingPost._id ? updatedData : p));
      if (selectedPost?._id === editingPost._id) {
        setSelectedPost(updatedData);
      }
      
      setEditingPost(null);
      setEditCaption('');
    } catch (error) {
      alert('Ошибка при сохранении: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 text-white relative">
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
            onClick={() => { setSelectedPost(post); navigate(`/profile/${post._id}`); }}
            className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 group cursor-pointer"
          >
            {/* MEDIA PREVIEW */}
            {post.mediaType === 'video' || post.videoUrl || post.mediaUrl?.endsWith('.mp4') ? (
              <video src={post.videoUrl || post.mediaUrl} className="w-full h-full object-cover" muted />
            ) : (
              <img src={post.imageUrl || post.mediaUrl} alt="Post" className="w-full h-full object-cover" />
            )}

            {/* LIKELAR */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 pointer-events-none">
              <div className="flex items-center gap-1 text-white text-sm font-medium">
                <FaHeart className="text-red-500" />
                <span>{post.likes?.length || 0}</span>
              </div>
            </div>

            {/* GRID 3-NUQTA TUGMASI */}
            <div className="absolute top-3 right-3 z-20 menu-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(prev => prev === post._id ? null : post._id);
                }}
                className="p-2 bg-black/60 hover:bg-black/90 rounded-full text-white backdrop-blur-md transition"
              >
                <FaEllipsisV size={13} />
              </button>

              {/* GRID DROPDOWN MENU */}
              {activeMenuId === post._id && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-36 bg-gray-900/95 border border-white/15 backdrop-blur-xl rounded-xl shadow-2xl py-1 z-30"
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

      {!loading && posts.length === 0 && (
        <p className="text-center text-white/30 my-10">У вас пока нет публикаций.</p>
      )}

      {/* POSTNI TO'LIQ OCHISH MODALI (IKKINCHI RASM BO'YICHA) */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <button 
            onClick={() => { setSelectedPost(null); navigate('/profile'); }}
            className="absolute top-6 right-6 text-white/70 hover:text-white text-xl p-2 bg-black/50 rounded-full z-50"
          >
            <FaTimes />
          </button>

          <div className="relative max-w-4xl w-full max-h-[90vh] bg-black border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
            {/* VIDEO / MEDIA HUDUDI */}
            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px]">
              {selectedPost.mediaType === 'video' || selectedPost.videoUrl || selectedPost.mediaUrl?.endsWith('.mp4') ? (
                <video 
                  src={selectedPost.videoUrl || selectedPost.mediaUrl} 
                  className="w-full h-full max-h-[80vh] object-contain" 
                  autoPlay 
                  loop 
                  muted={isMuted} 
                />
              ) : (
                <img src={selectedPost.imageUrl || selectedPost.mediaUrl} alt="Post" className="w-full h-full max-h-[80vh] object-contain" />
              )}

              {/* OVOZ TUGMASI */}
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="absolute top-4 left-4 p-2 bg-black/60 rounded-full text-white/80 hover:text-white backdrop-blur-md"
              >
                {isMuted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}
              </button>

              {/* MODAL ICHIDAGI 3 NUQTA MENYUSI (IKKINCHI RASM) */}
              <div className="absolute top-4 right-4 menu-container">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalMenuOpen(!modalMenuOpen);
                  }}
                  className="p-2.5 bg-black/60 hover:bg-black/90 rounded-full text-white backdrop-blur-md transition"
                >
                  <FaEllipsisV size={14} />
                </button>

                {modalMenuOpen && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-40 bg-gray-900/95 border border-white/15 backdrop-blur-xl rounded-2xl shadow-2xl py-1.5 z-50"
                  >
                    <button
                      onClick={(e) => handleStartEdit(selectedPost, e)}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-2 transition"
                    >
                      <FaPencilAlt size={12} /> Изменить
                    </button>
                    <button
                      onClick={(e) => handleDeletePost(selectedPost._id, e)}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition"
                    >
                      <FaTrash size={12} /> Удалить
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* AVTOR VA MA'LUMOTLAR */}
            <div className="w-full md:w-80 p-6 bg-gray-950 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center font-bold">
                    {currentUser?.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover"/> : currentUser?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">@{currentUser?.username} ✓</h4>
                  </div>
                </div>
                <p className="text-white/80 text-sm whitespace-pre-wrap">{selectedPost.caption || selectedPost.content}</p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-white/60 text-sm mt-4">
                <div className="flex items-center gap-2">
                  <FaHeart className="text-red-500" />
                  <span>{selectedPost.likes?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAHRIRLASH POP-UP MODALI */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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
              className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-white outline-none focus:border-accent text-sm resize-none h-28 mb-4"
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