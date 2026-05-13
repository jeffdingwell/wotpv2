import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Loader2, Check, Trash2, ShieldAlert, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Lyric } from '../types';
import { User } from 'firebase/auth';
import { signInWithGoogle } from '../lib/firebase';

interface AddLyricFormProps {
  onSave: (lyric: Omit<Lyric, 'id' | 'createdAt'>, id?: string) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
  initialData?: Lyric | null;
  user: User | null;
}

export default function AddLyricForm({ onSave, onDelete, onCancel, initialData, user }: AddLyricFormProps) {
  const [formData, setFormData] = useState({
    text: '',
    song: '',
    band: '',
    imageUrl: '',
    youtubeUrl: '',
    spotifyUrl: '',
    appleMusicUrl: ''
  });

  const [pexelsQuery, setPexelsQuery] = useState('');
  const [pexelsResults, setPexelsResults] = useState<any[]>([]);
  const [pexelsPage, setPexelsPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [selectedPreviewPhoto, setSelectedPreviewPhoto] = useState<any | null>(null);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        text: initialData.text || '',
        song: initialData.song || '',
        band: initialData.band || '',
        imageUrl: initialData.imageUrl || '',
        youtubeUrl: initialData.youtubeUrl || '',
        spotifyUrl: initialData.spotifyUrl || '',
        appleMusicUrl: initialData.appleMusicUrl || ''
      });
    }
  }, [initialData]);

  const handleSearchImages = async (page = 1) => {
    if (!pexelsQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
      
      if (apiKey && apiKey !== 'YOUR_PEXELS_API_KEY') {
        const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(pexelsQuery)}&per_page=8&page=${page}`, {
          headers: {
            Authorization: apiKey
          }
        });
        
        if (!res.ok) throw new Error(`Pexels API responded with status: ${res.status}`);
        const data = await res.json();
        if (data.photos) {
          setPexelsResults(data.photos);
          setPexelsPage(page);
        }
      } else {
        // Always try the proxy as a fallback
        const res = await fetch(`/api/pexels/search?query=${encodeURIComponent(pexelsQuery)}&page=${page}`);
        
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            if (data.photos) {
              setPexelsResults(data.photos);
              setPexelsPage(page);
              return;
            }
          }
        }
        
        throw new Error('Pexels API key missing or proxy failed. Please set VITE_PEXELS_API_KEY for production.');
      }
    } catch (error: any) {
      console.error('Failed to search pexels:', error);
      setSearchError(error?.message || 'Failed to search images');
    } finally {
      setIsSearching(false);
    }
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateUrls = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.imageUrl && !formData.imageUrl.startsWith('https://images.pexels.com')) {
      newErrors.imageUrl = 'Only images from https://images.pexels.com are allowed';
    }
    if (formData.youtubeUrl && !formData.youtubeUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)) {
      newErrors.youtubeUrl = 'Please enter a valid YouTube URL';
    }
    if (formData.spotifyUrl && !formData.spotifyUrl.match(/^(https?:\/\/)?(open\.spotify\.com)\/.+$/)) {
      newErrors.spotifyUrl = 'Please enter a valid Spotify URL';
    }
    if (formData.appleMusicUrl && !formData.appleMusicUrl.match(/^(https?:\/\/)?(music\.apple\.com)\/.+$/)) {
      newErrors.appleMusicUrl = 'Please enter a valid Apple Music URL';
    }

    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check required fields
    const newErrors: Record<string, string> = {};
    if (!formData.text.trim()) newErrors.text = 'Required';
    if (!formData.song.trim()) newErrors.song = 'Required';
    if (!formData.band.trim()) newErrors.band = 'Required';
    if (!formData.imageUrl.trim()) newErrors.imageUrl = 'Required';

    // Check URLs
    const urlErrors = validateUrls();
    Object.assign(newErrors, urlErrors);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const baseInputClasses = "w-full border-b border-gray-300 focus:border-blue-600 outline-none transition-colors text-sm placeholder:text-gray-300";
  const singleLineClasses = `${baseInputClasses} h-8`;
  const labelClasses = "block text-[11px] uppercase tracking-widest text-gray-500 font-medium mb-1";

  return (
    <>
      <form onSubmit={handleSubmit} className="px-8 pt-6 pb-10 space-y-8 bg-white min-h-full">
        <div className="space-y-1">
          <div className="flex items-center justify-between relative">
            <label className={labelClasses + " mb-0"}>Lyrics</label>
            <div 
              className="group flex items-center space-x-2 text-blue-600 cursor-help transition-colors w-fit"
              onMouseEnter={() => setShowRules(true)}
              onMouseLeave={() => setShowRules(false)}
            >
              <ShieldAlert size={14} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Rules</span>
            </div>

            <AnimatePresence>
              {showRules && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full left-[-32px] right-[-32px] z-50 mt-3 pointer-events-none px-4"
                >
                  <div className="bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 rounded-sm">
                    <p className="text-[13px] leading-relaxed text-gray-700 font-normal">
                      This is not a democracy—it’s a dictatorship. Zero tolerance. Post lyrics and nothing else. Any racial, political, homophobic, disrespectful, or otherwise dumb shit gets you banned. No warnings. No second chances.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <textarea
            name="text"
            value={formData.text}
            onChange={handleChange}
            rows={3}
            className={`${baseInputClasses} py-2 resize-none ${errors.text ? 'border-[#CC0000]' : ''}`}
          />
          {errors.text && <p className="text-[#CC0000] text-[14px] mt-1">* Required</p>}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={labelClasses}>Song</label>
            <input
              type="text"
              name="song"
              value={formData.song}
              onChange={handleChange}
              className={`${singleLineClasses} ${errors.song ? 'border-[#CC0000]' : ''}`}
            />
            {errors.song && <p className="text-[#CC0000] text-[14px] mt-1">* Required</p>}
          </div>

          <div>
            <label className={labelClasses}>Band/Artist</label>
            <input
              type="text"
              name="band"
              value={formData.band}
              onChange={handleChange}
              className={`${singleLineClasses} ${errors.band ? 'border-[#CC0000]' : ''}`}
            />
            {errors.band && <p className="text-[#CC0000] text-[14px] mt-1">* Required</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClasses}>Pexels Image Search</label>
            <div className="flex items-center space-x-2 border-b border-gray-300 focus-within:border-blue-600 transition-colors">
              <input
                type="text"
                value={pexelsQuery}
                onChange={(e) => setPexelsQuery(e.target.value)}
                placeholder="Describe your background then press search"
                className="flex-1 h-8 outline-none text-sm placeholder:text-gray-300"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchImages())}
              />
              <button 
                type="button" 
                onClick={handleSearchImages}
                disabled={isSearching}
                className="p-2 text-gray-400 hover:text-blue-600"
              >
                {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </button>
            </div>
          </div>

          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-[#24459c]" size={24} />
            </div>
          )}

          {searchError && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded border border-red-100">
              {searchError}
            </div>
          )}

          {pexelsResults.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto p-1">
                {pexelsResults.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        setSelectedPreviewPhoto(photo);
                      } else {
                        setFormData(prev => ({ ...prev, imageUrl: photo.src.large2x }));
                      }
                    }}
                    onMouseEnter={() => setHoveredImage(photo.src.large)}
                    onMouseLeave={() => setHoveredImage(null)}
                    className={`relative group aspect-square rounded overflow-hidden border-2 transition-all ${
                      formData.imageUrl === photo.src.large2x ? 'border-blue-600 ring-2 ring-blue-100' : 'border-transparent'
                    }`}
                  >
                    <img 
                      src={photo.src.tiny} 
                      alt={photo.alt} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                    />
                    {formData.imageUrl === photo.src.large2x && (
                      <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                        <Check size={16} className="text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] text-gray-400 font-medium italic">Photos from Pexels</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pexelsPage <= 1 || isSearching}
                    onClick={() => handleSearchImages(pexelsPage - 1)}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={isSearching}
                    onClick={() => handleSearchImages(pexelsPage + 1)}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : !isSearching && pexelsQuery && (
            <div className="text-center py-8 text-gray-400 text-xs italic">
              No results found for "{pexelsQuery}"
            </div>
          )}

        </div>

        <div className="space-y-6">
          <p className="text-[16px] text-[#333333] font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>Add links to hear the song (not required)</p>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <label className="text-[11px] uppercase tracking-widest text-gray-500 font-medium">YouTube link</label>
            </div>
            <input
              type="url"
              name="youtubeUrl"
              value={formData.youtubeUrl}
              onChange={handleChange}
              className={`${singleLineClasses} ${errors.youtubeUrl ? 'border-[#CC0000]' : ''}`}
            />
            {errors.youtubeUrl && <p className="text-[#CC0000] text-[12px] mt-1">{errors.youtubeUrl}</p>}
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-1">
              <label className="text-[11px] uppercase tracking-widest text-gray-500 font-medium">Spotify link</label>
            </div>
            <input
              type="url"
              name="spotifyUrl"
              value={formData.spotifyUrl}
              onChange={handleChange}
              className={`${singleLineClasses} ${errors.spotifyUrl ? 'border-[#CC0000]' : ''}`}
            />
            {errors.spotifyUrl && <p className="text-[#CC0000] text-[12px] mt-1">{errors.spotifyUrl}</p>}
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-1">
              <label className="text-[11px] uppercase tracking-widest text-gray-500 font-medium">Apple music link</label>
            </div>
            <input
              type="url"
              name="appleMusicUrl"
              value={formData.appleMusicUrl}
              onChange={handleChange}
              className={`${singleLineClasses} ${errors.appleMusicUrl ? 'border-[#CC0000]' : ''}`}
            />
            {errors.appleMusicUrl && <p className="text-[#CC0000] text-[12px] mt-1">{errors.appleMusicUrl}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-6">
            <button
              type="submit"
              className="bg-[#24459c] text-white px-8 py-3 text-sm font-medium hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/10 active:scale-95"
            >
              {initialData?.id && initialData.id !== 'default' ? 'Save Changes' : 'Save Lyric'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-500 hover:text-black text-sm transition-colors"
            >
              Cancel
            </button>
          </div>

          {initialData?.id && initialData.id !== 'default' && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(initialData.id!)}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors text-sm font-medium"
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </form>

      {/* Global Preview Overlay - Positioned 16px left of the side sheet on desktop */}
      {hoveredImage && !selectedPreviewPhoto && createPortal(
        <AnimatePresence mode="wait">
          <motion.div
            key={hoveredImage}
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className="fixed top-1/2 right-[464px] -translate-y-1/2 z-[9999] pointer-events-none hidden lg:block"
            style={{ width: '500px' }}
          >
            <div className="bg-black/80 backdrop-blur-md p-2 rounded-lg shadow-2xl overflow-hidden border border-white/10">
              <img 
                src={hoveredImage} 
                alt="Preview" 
                className="w-full h-auto rounded"
              />
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Mobile Detailed Preview with Actions */}
      {selectedPreviewPhoto && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-6 lg:hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedPreviewPhoto(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white w-full max-w-[400px] rounded-lg shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h4 className="text-xs uppercase tracking-widest font-bold text-gray-400">Preview</h4>
              <button onClick={() => setSelectedPreviewPhoto(null)} className="text-gray-400 hover:text-black">
                <X size={18} />
              </button>
            </div>
            <div className="aspect-[4/3] w-full overflow-hidden">
              <img 
                src={selectedPreviewPhoto.src.large} 
                alt={selectedPreviewPhoto.alt}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, imageUrl: selectedPreviewPhoto.src.large2x }));
                  setSelectedPreviewPhoto(null);
                }}
                className="w-full bg-[#24459c] text-white py-3 rounded-md text-sm font-semibold hover:bg-blue-800 transition-colors shadow-lg active:scale-[0.98]"
              >
                Use this image
              </button>
              <button
                type="button"
                onClick={() => setSelectedPreviewPhoto(null)}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-md text-sm font-semibold hover:bg-gray-200 transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
}
