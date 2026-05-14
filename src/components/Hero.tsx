import { Youtube, Music, Play, MessageSquare } from 'lucide-react';
import { Lyric } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HeroProps {
  lyric: Lyric | null;
  isFadingOut?: boolean;
  onEdit?: () => void;
  canEdit?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onShowComments: () => void;
  commentCount: number;
  isIntroActive?: boolean;
  onStart?: () => void;
}

export default function Hero({ 
  lyric, 
  isFadingOut, 
  onEdit, 
  canEdit, 
  onMouseEnter, 
  onMouseLeave, 
  onShowComments, 
  commentCount,
  isIntroActive,
  onStart
}: HeroProps) {
  if (!lyric) return null;

  const isJeffsCard = lyric.band?.trim().toLowerCase() === 'jeff dingwell';

  return (
    <div className="relative flex items-center justify-center h-full w-full overflow-hidden">
      {/* Lyric Card */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={`card-${lyric.id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: isFadingOut ? 0 : 1, 
            y: isFadingOut ? -20 : 0,
          }}
          exit={{ 
            opacity: 0, 
            y: -20,
            transition: { duration: 0.4, ease: "easeIn" }
          }}
          transition={{ 
            duration: 0.8, 
            ease: [0.21, 0.45, 0.32, 0.9] 
          }}
          className="relative z-10 w-full max-w-xl mx-4 min-[480px]:translate-y-0"
        >
          <div 
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={`w-full bg-black/40 backdrop-blur-sm pt-12 px-4 pb-4 min-[480px]:pt-[72px] min-[480px]:px-12 min-[480px]:pb-12 text-left md:text-left border border-white/5 shadow-2xl transition-transform hover:scale-[1.01] active:scale-100 group`}
          >
            <blockquote className={`${isJeffsCard ? 'space-y-4 min-[480px]:space-y-6' : 'space-y-1 min-[480px]:space-y-2'} mb-6 min-[480px]:mb-10`}>
              {lyric.text.split('\n').map((line, i) => (
                <p 
                  key={i}
                  className={`${
                    isJeffsCard 
                      ? 'text-[24px] md:text-[22.5px] leading-[32px]' 
                      : 'text-[24px] min-[480px]:text-2xl md:text-3xl leading-tight'
                  } font-serif text-gray-100`}
                >
                  {line}
                </p>
              ))}
            </blockquote>
            
            
            {!isJeffsCard && (
              <h2 className="text-[13px] min-[480px]:text-sm font-semibold tracking-[0.2em] text-white uppercase mb-1">
                {lyric.song}
              </h2>
            )}

            <div className={`flex items-center justify-between mt-0 pt-0 ${isJeffsCard && isIntroActive ? 'mb-4' : 'mb-6'}`}>
              <p className="text-[14.5px] min-[480px]:text-[15px] text-gray-300 tracking-wider">
                {isJeffsCard ? 'Enjoy' : lyric.band}
              </p>
              {isJeffsCard && isIntroActive && onStart && (
                <button
                  onClick={onStart}
                  className="bg-blue-600 text-white px-3 py-1 text-[14.5px] min-[480px]:text-[15px] tracking-wider uppercase hover:bg-blue-700 transition-colors rounded-sm"
                >
                  GET STARTED
                </button>
              )}
            </div>

            {!isJeffsCard && (
              <div className="flex items-center justify-between space-x-6 mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center space-x-6">
                  {lyric.youtubeUrl && (
                    <a 
                      href={lyric.youtubeUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-white hover:text-red-500 transition-colors"
                      title="Watch on YouTube"
                    >
                      <Youtube size={24} />
                    </a>
                  )}
                  {lyric.spotifyUrl && (
                    <a 
                      href={lyric.spotifyUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-white hover:text-green-500 transition-colors"
                      title="Listen on Spotify"
                    >
                      <Music size={24} />
                    </a>
                  )}
                  {lyric.appleMusicUrl && (
                    <a 
                      href={lyric.appleMusicUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-white hover:text-pink-500 transition-colors"
                      title="Listen on Apple Music"
                    >
                      <Play size={24} />
                    </a>
                  )}
                </div>

                <div className="flex items-center">
                  {canEdit && onEdit && (
                    <button 
                      onClick={onEdit}
                      className="text-[16px] min-[480px]:text-sm text-gray-400 hover:text-white transition-colors mr-[16px]"
                    >
                      Edit
                    </button>
                  )}
                  <button 
                    onClick={onShowComments}
                    className="flex items-center space-x-2 text-[16px] min-[480px]:text-sm text-gray-300 hover:text-white transition-colors relative"
                  >
                    <MessageSquare size={18} />
                    <span className="hidden min-[480px]:inline">Comments</span>
                    <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                      {commentCount}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
