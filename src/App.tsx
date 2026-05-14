import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  getDocs,
  serverTimestamp, 
  limit,
  where,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, signInWithGoogle, handleFirestoreError, OperationType } from './lib/firebase';
import { Lyric, Comment } from './types';
import { X } from 'lucide-react';

// Components
import Header from './components/Header';
import Hero from './components/Hero';
import SidePanel from './components/SidePanel';
import AddLyricForm from './components/AddLyricForm';
import CommentsPanel from './components/CommentsPanel';
import TimerBar from './components/TimerBar';
import ConfirmDialog from './components/ConfirmDialog';

export default function App() {
  const [currentLyric, setCurrentLyric] = useState<Lyric | null>(null);
  const [allLyrics, setAllLyrics] = useState<Lyric[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [activePanel, setActivePanel] = useState<'add-lyric' | 'comments' | 'search' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isHoveringHero, setIsHoveringHero] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isIntroActive, setIsIntroActive] = useState(false);
  const [lyricToDelete, setLyricToDelete] = useState<string | null>(null);

  // Default lyric if database is empty
  const defaultLyric: Lyric = {
    id: 'default',
    text: "She had nothing left to say.\nSo she said she loved me.\nAnd I stood there.\nGrateful for the lie.",
    song: "Lost Horizons",
    band: "Gin Blossoms",
    imageUrl: "https://images.unsplash.com/photo-1549492423-40020610332c?q=80&w=2600&auto=format&fit=crop",
    userId: "system",
    youtubeUrl: "https://youtube.com",
    spotifyUrl: "https://spotify.com",
    appleMusicUrl: "https://music.apple.com",
    createdAt: null
  };

  useEffect(() => {
    // Auth listener
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Initial Lyrics load - Pick a random one from recent entries, but check for Jeff's card first
    const fetchRandomLyric = async () => {
      try {
        const hasSeenIntro = sessionStorage.getItem('hasSeenIntro_v7');
        
        if (!hasSeenIntro) {
          // If haven't seen intro, specifically look for Jeff's card
          const qJeff = query(collection(db, 'lyrics'), where('band', '==', 'Jeff Dingwell'), limit(1));
          const jeffSnapshot = await getDocs(qJeff);
          if (!jeffSnapshot.empty) {
            const jeffsCard = { id: jeffSnapshot.docs[0].id, ...jeffSnapshot.docs[0].data() } as Lyric;
            setCurrentLyric(jeffsCard);
            setIsIntroActive(true);
            return;
          }
        }

        // If intro already seen or Jeff's card not found, pick random
        const qLyrics = query(collection(db, 'lyrics'), orderBy('createdAt', 'desc'), limit(100));
        const snapshot = await getDocs(qLyrics);
        const fetchedLyrics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lyric));
        
        if (fetchedLyrics.length > 0) {
          // Filter out Jeff's card from the random selection
          const pool = fetchedLyrics.filter(l => l.band?.trim().toLowerCase() !== 'jeff dingwell');
          if (pool.length > 0) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            setCurrentLyric(pool[randomIndex]);
          } else {
            setCurrentLyric(fetchedLyrics[0]);
          }
        } else {
          setCurrentLyric(defaultLyric);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'lyrics');
        setCurrentLyric(defaultLyric);
      }
    };

    fetchRandomLyric();

    // Listen to all lyrics for Search
    const qAllLyrics = query(collection(db, 'lyrics'), orderBy('band', 'asc'));
    const unsubscribeAllLyrics = onSnapshot(qAllLyrics, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lyric));
      setAllLyrics(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'lyrics'));

    return () => {
      unsubscribeAuth();
      unsubscribeAllLyrics();
    };
  }, []);

  useEffect(() => {
    setIsFadingOut(false);
  }, [currentLyric?.id]);

  const refreshLyrics = async () => {
    try {
      setIsIntroActive(false);
      const qLyrics = query(collection(db, 'lyrics'), orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(qLyrics);
      const fetchedLyrics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lyric));
      
      // Filter out Jeff's card from random display
      const pool = fetchedLyrics.filter(l => l.band?.trim().toLowerCase() !== 'jeff dingwell');

      if (pool.length > 1) {
        // Try to pick a different one
        let nextLyric = currentLyric;
        let attempts = 0;
        while ((!nextLyric || nextLyric.id === currentLyric?.id) && attempts < 10) {
          const randomIndex = Math.floor(Math.random() * pool.length);
          nextLyric = pool[randomIndex];
          attempts++;
        }
        setCurrentLyric(nextLyric);
      } else if (pool.length === 1) {
        setCurrentLyric(pool[0]);
      } else if (fetchedLyrics.length > 0) {
        setCurrentLyric(fetchedLyrics[0]);
      } else {
        setCurrentLyric(defaultLyric);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'lyrics');
      setCurrentLyric(defaultLyric);
    }
  };

  // Comments listener - depends on currentLyric
  useEffect(() => {
    if (!currentLyric?.id) return;

    const qComments = query(
      collection(db, 'comments'), 
      where('lyricId', '==', currentLyric.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeComments = onSnapshot(qComments, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
      setComments(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'comments'));

    return () => unsubscribeComments();
  }, [currentLyric?.id]);

  const handleStartApp = () => {
    sessionStorage.setItem('hasSeenIntro_v7', 'true');
    setIsIntroActive(false);
    refreshLyrics();
  };

  const handleSaveLyric = async (formData: Omit<Lyric, 'id' | 'createdAt'>, id?: string) => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    
    try {
      if (isEditing && id && id !== 'default') {
        const lyricRef = doc(db, 'lyrics', id);
        await updateDoc(lyricRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });
        setCurrentLyric({ id, ...formData, userId: currentLyric?.userId || user.uid, createdAt: currentLyric?.createdAt });
      } else {
        const docRef = await addDoc(collection(db, 'lyrics'), {
          ...formData,
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          createdAt: serverTimestamp()
        });
        setCurrentLyric({ id: docRef.id, ...formData, userId: user.uid, userName: user.displayName || 'Anonymous', createdAt: new Date() });
      }
      setActivePanel(null);
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'lyrics');
    }
  };

  const handleDeleteLyric = async (id: string) => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    
    if (id === 'default') return;

    try {
      const batch = writeBatch(db);
      
      // Delete the lyric itself
      batch.delete(doc(db, 'lyrics', id));

      // Query and delete all comments for this lyric
      const qComments = query(collection(db, 'comments'), where('lyricId', '==', id));
      const commentsSnapshot = await getDocs(qComments);
      commentsSnapshot.docs.forEach((commentDoc) => {
        batch.delete(commentDoc.ref);
      });

      await batch.commit();
      
      setActivePanel(null);
      if (currentLyric?.id === id) {
        await refreshLyrics();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'lyrics');
    }
  };

  const handleAddComment = async (text: string) => {
    if (!user) {
      await signInWithGoogle();
      return;
    }

    if (!currentLyric?.id) return;

    try {
      await addDoc(collection(db, 'comments'), {
        text,
        lyricId: currentLyric.id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'comments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'comments');
    }
  };

  const navigateLyric = (direction: 'prev' | 'next') => {
    if (allLyrics.length <= 1) {
      if (direction === 'next') refreshLyrics();
      return;
    }
    
    const currentIndex = allLyrics.findIndex(l => l.id === currentLyric?.id);
    let nextIndex;
    
    if (direction === 'prev') {
      nextIndex = currentIndex <= 0 ? allLyrics.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex >= allLyrics.length - 1 ? 0 : currentIndex + 1;
    }
    
    setIsFadingOut(true);
    setTimeout(() => {
      setCurrentLyric(allLyrics[nextIndex]);
    }, 300);
  };

  const isAdmin = user?.email === 'jeff@bolddesign.ca';
  const isOwner = currentLyric?.id !== 'default' && currentLyric?.userId === user?.uid;
  const canEditCurrent = isOwner;

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden font-sans">
      {/* Global Background */}
      <AnimatePresence mode="wait">
        {currentLyric && (
          <motion.div 
            key={`bg-${currentLyric.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: `url(${currentLyric.imageUrl})` }}
          >
            <div className="absolute inset-0 bg-black/25" />
          </motion.div>
        )}
      </AnimatePresence>

      <Header 
        user={user}
        onAddNew={() => {
          if (activePanel === 'add-lyric' && !isEditing) {
            setActivePanel(null);
          } else {
            setIsEditing(false);
            setActivePanel('add-lyric');
          }
        }}
        onSearch={() => setActivePanel(activePanel === 'search' ? null : 'search')}
      />

      <TimerBar 
        duration={20} 
        onComplete={refreshLyrics}
        onNearComplete={() => setIsFadingOut(true)}
        keyTrigger={currentLyric?.id || 'empty'}
        isPaused={activePanel !== null || isHoveringHero || isIntroActive}
      />

      <motion.main 
        className="flex-1 relative pt-[80px] min-[480px]:pt-0"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          // Only trigger on mobile/small screens
          if (window.innerWidth >= 1024) return;
          
          const threshold = 100;
          if (info.offset.x > threshold) {
            // Swipe Right -> New screen
            navigateLyric('next');
          } else if (info.offset.x < -threshold) {
            // Swipe Left -> Previous screen
            navigateLyric('prev');
          }
        }}
      >
        <Hero 
          lyric={currentLyric} 
          isFadingOut={isFadingOut}
          canEdit={canEditCurrent}
          isIntroActive={isIntroActive}
          onStart={handleStartApp}
          onEdit={() => {
            setIsEditing(true);
            setActivePanel('add-lyric');
          }}
          onMouseEnter={() => setIsHoveringHero(true)}
          onMouseLeave={() => setIsHoveringHero(false)}
          onShowComments={() => setActivePanel(activePanel === 'comments' ? null : 'comments')}
          commentCount={comments.length}
        />
      </motion.main>

      {/* Side Sheets */}
      <SidePanel 
        isOpen={activePanel === 'add-lyric'} 
        onClose={() => {
          setActivePanel(null);
          setIsEditing(false);
        }}
        title={isEditing ? 'Edit lyric' : 'Add new lyric'}
      >
        <AddLyricForm 
          user={user}
          onSave={(data) => handleSaveLyric(data, currentLyric?.id)}
          onDelete={(id) => setLyricToDelete(id)}
          onCancel={() => {
            setActivePanel(null);
            setIsEditing(false);
          }}
          initialData={isEditing ? currentLyric : null}
        />
      </SidePanel>

      <SidePanel 
        isOpen={activePanel === 'search'} 
        onClose={() => setActivePanel(null)}
        title="Search"
      >
        <div className="px-8 py-6 bg-white min-h-full">
          {Object.entries(
            allLyrics
              .filter(l => isAdmin || l.band?.trim().toLowerCase() !== 'jeff dingwell')
              .reduce((acc: Record<string, Lyric[]>, lyric) => {
                const band = lyric.band?.trim() || 'Unknown Artist';
                if (!acc[band]) acc[band] = [];
                acc[band].push(lyric);
                return acc;
              }, {})
          ).sort(([a], [b]) => {
            const getSortable = (s: string) => s.toLowerCase().startsWith('the ') ? s.slice(4).trim() : s;
            return getSortable(a).localeCompare(getSortable(b));
          }).map(([band, bandLyrics]) => (
            <div key={band} className="mb-4">
              <h3 className="text-[16px] font-medium text-gray-900 mb-2">{band}</h3>
              <div className="pl-[12px]">
                {(bandLyrics as Lyric[]).sort((a, b) => a.song.localeCompare(b.song)).map((lyric) => (
                  <div key={lyric.id} className="flex items-center group border-b border-gray-50 last:border-0">
                    <div className="flex items-center space-x-2 flex-1 min-w-0 py-1" id={`song-${lyric.id}`}>
                      {isAdmin && lyric.id !== 'default' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLyricToDelete(lyric.id);
                          }}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1 -ml-1"
                          title="Delete lyric"
                        >
                          <X size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setIsFadingOut(true);
                          setTimeout(() => {
                            setCurrentLyric(lyric);
                            setActivePanel(null);
                          }, 300);
                        }}
                        className="text-sm text-gray-500 hover:text-blue-600 transition-colors truncate text-left"
                      >
                        {lyric.song}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {allLyrics.length === 0 && (
            <p className="text-gray-400 text-sm italic">No lyrics found in the library.</p>
          )}
        </div>
      </SidePanel>

      <SidePanel 
        isOpen={activePanel === 'comments'} 
        onClose={() => setActivePanel(null)}
        title="Comments"
      >
        <CommentsPanel 
          comments={comments}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          isAdmin={isAdmin}
          currentUserId={user?.uid}
        />
      </SidePanel>

      <ConfirmDialog 
        isOpen={lyricToDelete !== null}
        onClose={() => setLyricToDelete(null)}
        onConfirm={() => {
          if (lyricToDelete) {
            handleDeleteLyric(lyricToDelete);
          }
        }}
        message="Are you sure you want to delete this?"
      />

    </div>
  );
}
