import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

const StoriesBar = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const fetchStories = async () => {
    try {
      const res = await axios.get('/stories');
      setStories(res.data);
    } catch (error) {
      console.error('Ошибка загрузки историй:', error);
    }
  };

  useEffect(() => {
    fetchStories();
    const handleUpdate = () => fetchStories();
    window.addEventListener('story_uploaded', handleUpdate);
    return () => window.removeEventListener('story_uploaded', handleUpdate);
  }, []);

  const handleStoryClick = (story) => {
    setSelectedStory(story);
    setProgress(0);
    clearInterval(timerRef.current);
    let p = 0;
    timerRef.current = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) {
        clearInterval(timerRef.current);
        closeViewer();
      }
    }, 250); // 5 секунд
  };

  const closeViewer = () => {
    clearInterval(timerRef.current);
    setSelectedStory(null);
    setProgress(0);
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2 mb-4 px-2 scrollbar-hide">
        <Link 
          to="/upload"
          className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-glow p-1 flex items-center justify-center border-2 border-dark">
            <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-white text-2xl group-hover:bg-gray-700 transition">
              +
            </div>
          </div>
          <span className="text-white/50 text-xs">Добавить</span>
        </Link>

        {stories.map((story) => (
          <div 
            key={story._id}
            onClick={() => handleStoryClick(story)}
            className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-glow p-1">
              <div className="w-full h-full rounded-full bg-gray-800 overflow-hidden">
                {story.user?.avatar ? (
                  <img src={story.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                    {story.user?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <span className="text-white/50 text-xs truncate max-w-[70px]">{story.title || '@' + story.user?.username}</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedStory && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
            onClick={closeViewer}
          >
            <div className="relative w-full max-w-md rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="absolute top-4 left-4 right-4 h-1 bg-white/20 rounded-full z-10">
                <div className="h-full bg-white rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); closeViewer(); }}
                className="absolute top-4 right-4 z-10 text-white/80 hover:text-white p-2 bg-black/60 rounded-full backdrop-blur-sm transition"
              >
                ✕
              </button>

              <div className="w-full h-[80vh] bg-black flex items-center justify-center">
                {selectedStory.mediaType === 'video' ? (
                  <video src={selectedStory.mediaUrl} className="w-full h-full object-contain bg-black" autoPlay controls={false} />
                ) : (
                  <img src={selectedStory.mediaUrl} alt="Story" className="w-full h-full object-contain bg-black shadow-2xl" />
                )}
              </div>

              <div className="absolute bottom-6 left-4 right-4 z-10 text-left">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center text-white font-bold text-xs">
                    {selectedStory.user?.avatar ? (
                      <img src={selectedStory.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      selectedStory.user?.username?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-white font-semibold text-sm drop-shadow-lg">@{selectedStory.user?.username}</span>
                </div>
                <h3 className="text-white text-lg font-bold drop-shadow-lg">{selectedStory.title}</h3>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StoriesBar;