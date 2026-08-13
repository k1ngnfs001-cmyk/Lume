import ReelsFeed from './ReelsFeed';

const FollowingFeed = () => {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-black/90">
      {/* Передаём feedType="following", чтобы загружались только посты из подписок */}
      <ReelsFeed feedType="following" />
    </div>
  );
};

export default FollowingFeed;