import LeftSidebar from '../components/LeftSidebar';
import ReelsFeed from './ReelsFeed';

const Feed = () => {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <LeftSidebar />
      <div className="flex-1 w-full h-screen flex items-center justify-center bg-black/90">
        <ReelsFeed />
      </div>
    </div>
  );
};

export default Feed;