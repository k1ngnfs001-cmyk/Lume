// import {
//   useEffect,
//   useState
// } from 'react';

// import {
//   useParams,
//   Link
// } from 'react-router-dom';

// import {
//   FaHeart,
//   FaRegHeart,
//   FaComment,
//   FaBookmark
// } from 'react-icons/fa';

// import {
//   FiBookmark
// } from 'react-icons/fi';

// import {
//   useAuth
// } from '../context/AuthContext';

// import {
//   useAlert
// } from '../context/AlertContext';

// import axios from '../api/axios';

// const PostPage = () => {
//   const { id } = useParams();

//   const {
//     user
//   } = useAuth();

//   const {
//     showAlert
//   } = useAlert();

//   const [
//     post,
//     setPost
//   ] = useState(null);

//   const [
//     loading,
//     setLoading
//   ] = useState(true);

//   const [
//     error,
//     setError
//   ] = useState('');

//   // =========================================================
//   // LOAD POST
//   // =========================================================

//   useEffect(() => {
//     const loadPost = async () => {
//       try {
//         setLoading(true);
//         setError('');

//         const response =
//           await axios.get(
//             `/posts/${id}`
//           );

//         setPost(
//           response.data
//         );
//       } catch (err) {
//         console.error(
//           'Ошибка загрузки поста:',
//           err
//         );

//         setError(
//           err.response?.data?.message ||
//           'Пост не найден'
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (id) {
//       loadPost();
//     }
//   }, [id]);

//   // =========================================================
//   // LIKE
//   // =========================================================

//   const handleLike = async () => {
//     if (!user) {
//       showAlert({
//         title: 'Войдите в Lume',
//         message:
//           'Чтобы поставить лайк, необходимо войти в аккаунт.'
//       });

//       return;
//     }

//     try {
//       const response =
//         await axios.post(
//           `/posts/${post._id}/like`
//         );

//       setPost(
//         prev => ({
//           ...prev,

//           isLikedByMe:
//             Boolean(
//               response.data.isLiked
//             ),

//           likes:
//             response.data.likes || []
//         })
//       );
//     } catch (err) {
//       showAlert({
//         title: 'Ошибка',
//         message:
//           err.response?.data?.message ||
//           err.message
//       });
//     }
//   };

//   // =========================================================
//   // SAVE
//   // =========================================================

//   const handleSave = async () => {
//     if (!user) {
//       showAlert({
//         title: 'Войдите в Lume',
//         message:
//           'Чтобы сохранить пост, необходимо войти в аккаунт.'
//       });

//       return;
//     }

//     try {
//       const response =
//         await axios.post(
//           `/posts/${post._id}/save`
//         );

//       setPost(
//         prev => ({
//           ...prev,

//           isSavedByMe:
//             Boolean(
//               response.data.isSaved
//             ),

//           savedBy:
//             response.data.savedBy ||
//             []
//         })
//       );
//     } catch (err) {
//       showAlert({
//         title: 'Ошибка',
//         message:
//           err.response?.data?.message ||
//           err.message
//       });
//     }
//   };

//   // =========================================================
//   // SHARE AGAIN
//   // =========================================================

//   const handleShare = async () => {
//     const shareUrl =
//       `${window.location.origin}/post/${post._id}`;

//     try {
//       await navigator.clipboard.writeText(
//         shareUrl
//       );

//       showAlert({
//         title: 'Ссылка скопирована',
//         message:
//           'Ссылка на этот пост скопирована в буфер обмена.'
//       });
//     } catch (err) {
//       showAlert({
//         title: 'Ошибка',
//         message:
//           'Не удалось скопировать ссылку.'
//       });
//     }
//   };

//   // =========================================================
//   // LOADING
//   // =========================================================

//   if (loading) {
//     return (
//       <div className="
//         min-h-screen
//         bg-[#0a0a0a]
//         flex
//         items-center
//         justify-center
//         text-white/50
//       ">
//         Lume загружается...
//       </div>
//     );
//   }

//   // =========================================================
//   // ERROR
//   // =========================================================

//   if (!post) {
//     return (
//       <div className="
//         min-h-screen
//         bg-[#0a0a0a]
//         flex
//         flex-col
//         items-center
//         justify-center
//         text-white
//         gap-4
//         px-6
//         text-center
//       ">
//         <h1 className="
//           text-3xl
//           font-bold
//         ">
//           {error || 'Пост не найден'}
//         </h1>

//         <Link
//           to="/"
//           className="
//             px-5
//             py-2.5
//             rounded-full
//             bg-white
//             text-black
//             font-semibold
//           "
//         >
//           Вернуться в Lume
//         </Link>
//       </div>
//     );
//   }

//   const isLiked =
//     Boolean(
//       post.isLikedByMe
//     ) ||
//     post.likes?.some(
//       item =>
//         String(
//           item?._id || item
//         ) ===
//         String(
//           user?._id
//         )
//     );

//   const isSaved =
//     Boolean(
//       post.isSavedByMe
//     ) ||
//     post.savedBy?.some(
//       item =>
//         String(
//           item?._id || item
//         ) ===
//         String(
//           user?._id
//         )
//     );

//   return (
//     <div className="
//       min-h-screen
//       bg-[#0a0a0a]
//       flex
//       items-center
//       justify-center
//       px-4
//       py-8
//     ">
//       <div className="
//         w-full
//         max-w-[900px]
//         flex
//         flex-col
//         md:flex-row
//         items-center
//         justify-center
//         gap-6
//       ">

//         {/* ===================================================
//             MEDIA
//         ==================================================== */}

//         <div className="
//           relative
//           w-full
//           max-w-[650px]
//           aspect-square
//           max-h-[85vh]
//           rounded-[24px]
//           overflow-hidden
//           bg-black
//           shadow-2xl
//         ">

//           {post.mediaUrl ? (
//             post.mediaType === 'video' ? (
//               <video
//                 src={post.mediaUrl}
//                 className="
//                   w-full
//                   h-full
//                   object-cover
//                 "
//                 controls
//                 autoPlay
//                 loop
//                 playsInline
//               />
//             ) : (
//               <img
//                 src={post.mediaUrl}
//                 alt="Post"
//                 className="
//                   w-full
//                   h-full
//                   object-cover
//                 "
//               />
//             )
//           ) : (
//             <div className="
//               w-full
//               h-full
//               bg-gray-800
//               flex
//               items-center
//               justify-center
//               text-white/50
//               text-2xl
//               font-bold
//               p-6
//               text-center
//             ">
//               {post.content}
//             </div>
//           )}

//           {/* Gradient */}
//           <div className="
//             absolute
//             bottom-0
//             left-0
//             right-0
//             h-[40%]
//             bg-gradient-to-t
//             from-black/90
//             via-black/30
//             to-transparent
//             pointer-events-none
//           " />

//           {/* Author */}
//           <div className="
//             absolute
//             bottom-5
//             left-5
//             z-10
//           ">
//             <Link
//               to={`/profile/${post.user?._id}`}
//               className="
//                 flex
//                 items-center
//                 gap-3
//               "
//             >
//               <div className="
//                 w-10
//                 h-10
//                 rounded-full
//                 bg-accent
//                 flex
//                 items-center
//                 justify-center
//                 overflow-hidden
//                 text-white
//                 font-bold
//               ">
//                 {post.user?.avatar ? (
//                   <img
//                     src={post.user.avatar}
//                     alt="Avatar"
//                     className="
//                       w-full
//                       h-full
//                       object-cover
//                     "
//                   />
//                 ) : (
//                   post.user?.username
//                     ?.charAt(0)
//                     .toUpperCase()
//                 )}
//               </div>

//               <div>
//                 <div className="
//                   text-white
//                   font-bold
//                   flex
//                   items-center
//                   gap-1
//                 ">
//                   @{post.user?.username}

//                   {post.user?.isVerified && (
//                     <span className="
//                       text-blue-500
//                     ">
//                       ✓
//                     </span>
//                   )}
//                 </div>

//                 <div className="
//                   text-white/50
//                   text-xs
//                 ">
//                   {post.createdAt
//                     ? new Date(
//                         post.createdAt
//                       ).toLocaleDateString()
//                     : ''}
//                 </div>
//               </div>
//             </Link>

//             {post.content && (
//               <p className="
//                 text-white/90
//                 text-sm
//                 mt-2
//                 max-w-[500px]
//               ">
//                 {post.content}
//               </p>
//             )}
//           </div>
//         </div>

//         {/* ===================================================
//             ACTIONS
//         ==================================================== */}

//         <div className="
//           flex
//           md:flex-col
//           items-center
//           gap-4
//         ">

//           {/* LIKE */}
//           <button
//             onClick={handleLike}
//             className="
//               w-14
//               h-14
//               rounded-full
//               bg-black/60
//               backdrop-blur-md
//               border
//               border-white/10
//               flex
//               items-center
//               justify-center
//               text-white
//               hover:bg-black/80
//               transition
//             "
//           >
//             {isLiked ? (
//               <FaHeart className="
//                 text-red-500
//                 text-xl
//               " />
//             ) : (
//               <FaRegHeart className="
//                 text-white/80
//                 text-xl
//               " />
//             )}
//           </button>

//           {/* COMMENTS */}
//           <div className="
//             w-14
//             h-14
//             rounded-full
//             bg-black/60
//             backdrop-blur-md
//             border
//             border-white/10
//             flex
//             items-center
//             justify-center
//             text-white
//           ">
//             <FaComment className="
//               text-white/80
//               text-xl
//             " />
//           </div>

//           {/* SAVE */}
//           <button
//             onClick={handleSave}
//             className="
//               w-14
//               h-14
//               rounded-full
//               bg-black/60
//               backdrop-blur-md
//               border
//               border-white/10
//               flex
//               items-center
//               justify-center
//               text-white
//               hover:bg-black/80
//               transition
//             "
//           >
//             {isSaved ? (
//               <FaBookmark className="
//                 text-yellow-400
//                 text-xl
//               " />
//             ) : (
//               <FiBookmark className="
//                 text-white/80
//                 text-xl
//               " />
//             )}
//           </button>

//           {/* SHARE */}
//           <button
//             onClick={handleShare}
//             className="
//               w-14
//               h-14
//               rounded-full
//               bg-black/60
//               backdrop-blur-md
//               border
//               border-white/10
//               flex
//               items-center
//               justify-center
//               text-white
//               hover:bg-black/80
//               transition
//             "
//           >
//             ↗
//           </button>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default PostPage;