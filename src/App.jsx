import React, { useState, useEffect, useRef } from 'react';

const GOAL = 100000;
const STORAGE_KEY = 'pushup-quest-data';

function App() {
  const [entries, setEntries] = useState({});
  const [photos, setPhotos] = useState({});
  const [loading, setLoading] = useState(true);
  const [todayAdd, setTodayAdd] = useState(0);
  const [showPhotoPrompt, setShowPhotoPrompt] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showBeforePrompt, setShowBeforePrompt] = useState(false);
  const fileInputRef = useRef(null);
  const beforeInputRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  // Check if we need to show the before photo prompt
  useEffect(() => {
    if (!loading) {
      const totalPushups = Object.values(entries).reduce((a, b) => a + b, 0);
      if (totalPushups === 0 && !photos[0]) {
        setShowBeforePrompt(true);
      }
    }
  }, [loading, entries, photos]);

  const loadData = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setEntries(data.entries || {});
        setPhotos(data.photos || {});
      }
    } catch (e) {
      console.log('No existing data');
    }
    setLoading(false);
  };

  const saveData = (newEntries, newPhotos) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      entries: newEntries,
      photos: newPhotos
    }));
  };

  const getMilestone = (count) => Math.floor(count / 1000) * 1000;
  const getNextMilestone = (count) => Math.ceil((count + 1) / 1000) * 1000;

  const addPushups = (count) => {
    const oldTotal = Object.values(entries).reduce((a, b) => a + b, 0);
    const newEntries = { ...entries };
    newEntries[today] = (newEntries[today] || 0) + count;
    const newTotal = Object.values(newEntries).reduce((a, b) => a + b, 0);
    
    setEntries(newEntries);
    setTodayAdd(prev => prev + count);
    setTimeout(() => setTodayAdd(0), 400);
    saveData(newEntries, photos);

    const oldMilestone = getMilestone(oldTotal);
    const newMilestone = getMilestone(newTotal);
    
    if (newMilestone > oldMilestone && newMilestone > 0) {
      if (!photos[newMilestone]) {
        setTimeout(() => setShowPhotoPrompt(newMilestone), 600);
      }
    }
  };

  const removePushups = (count) => {
    const newEntries = { ...entries };
    newEntries[today] = Math.max(0, (newEntries[today] || 0) - count);
    if (newEntries[today] === 0) delete newEntries[today];
    setEntries(newEntries);
    saveData(newEntries, photos);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !showPhotoPrompt) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 400;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        const newPhotos = { 
          ...photos, 
          [showPhotoPrompt]: {
            data: compressedBase64,
            date: new Date().toISOString(),
            milestone: showPhotoPrompt
          }
        };
        setPhotos(newPhotos);
        saveData(entries, newPhotos);
        setShowPhotoPrompt(null);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleBeforePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 400;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        
        const newPhotos = { 
          ...photos, 
          [0]: {
            data: compressedBase64,
            date: new Date().toISOString(),
            milestone: 0
          }
        };
        setPhotos(newPhotos);
        saveData(entries, newPhotos);
        setShowBeforePrompt(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Calculate stats
  const totalPushups = Object.values(entries).reduce((a, b) => a + b, 0);
  const todayCount = entries[today] || 0;
  const daysWithEntries = Object.keys(entries).length;
  const dailyAverage = daysWithEntries > 0 ? Math.round(totalPushups / daysWithEntries) : 0;
  
  // Current level/milestone info
  const currentLevel = Math.floor(totalPushups / 1000) + 1;
  const nextMilestone = getNextMilestone(totalPushups);
  const prevMilestone = getMilestone(totalPushups);
  const progressInLevel = totalPushups - prevMilestone;
  const remainingInLevel = nextMilestone - totalPushups;
  const levelPercent = (progressInLevel / 1000) * 100;

  const sortedDates = Object.keys(entries).sort();
  const firstDate = sortedDates[0];
  const daysSinceStart = firstDate 
    ? Math.ceil((new Date(today) - new Date(firstDate)) / (1000 * 60 * 60 * 24)) + 1
    : 0;
  
  const calculateStreak = () => {
    let streak = 0;
    let checkDate = new Date(today);
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (entries[dateStr] && entries[dateStr] > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };
  const currentStreak = calculateStreak();
  const bestDay = Math.max(0, ...Object.values(entries));
  const remaining = GOAL - totalPushups;
  const daysToGoal = dailyAverage > 0 ? Math.ceil(remaining / dailyAverage) : null;
  
  const getWeeklyAvg = () => {
    let sum = 0;
    let days = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (entries[dateStr]) {
        sum += entries[dateStr];
        days++;
      }
    }
    return days > 0 ? Math.round(sum / days) : 0;
  };
  const weeklyAvg = getWeeklyAvg();

  const photosArray = Object.entries(photos)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([milestone, data]) => ({ milestone: Number(milestone), ...data }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Before photo prompt (Day 0)
  if (showBeforePrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">📸</div>
          <h2 className="text-3xl font-black text-white mb-2">
            BEFORE PHOTO
          </h2>
          <p className="text-purple-200 mb-6">
            Capture your Day 0 starting point. You'll thank yourself at 100k.
          </p>
          
          <div className="bg-purple-500/20 rounded-xl p-4 mb-6 text-left">
            <div className="text-purple-300 text-sm font-medium mb-2">📸 Pick your pose:</div>
            <p className="text-white text-sm">
              Front-facing mirror selfie — relaxed or flexing. Use the same pose for every milestone!
            </p>
          </div>

          <input
            ref={beforeInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleBeforePhotoUpload}
            className="hidden"
          />
          
          <button
            onClick={() => beforeInputRef.current?.click()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl mb-3 hover:opacity-90 transition-all active:scale-95"
          >
            📷 Take Starting Photo
          </button>
          
          <button
            onClick={() => setShowBeforePrompt(false)}
            className="w-full bg-white/10 text-purple-300 font-medium py-3 rounded-xl hover:bg-white/20 transition-all"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  // Photo prompt modal
  if (showPhotoPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-black text-white mb-2">
            LEVEL {showPhotoPrompt / 1000} COMPLETE!
          </h2>
          <p className="text-purple-200 mb-6">
            You hit {showPhotoPrompt.toLocaleString()} push-ups! Capture your progress.
          </p>
          
          <div className="bg-purple-500/20 rounded-xl p-4 mb-6 text-left">
            <div className="text-purple-300 text-sm font-medium mb-2">📸 Same pose, every time:</div>
            <p className="text-white text-sm">
              Front-facing mirror selfie. Pick relaxed or flexing and stick with it!
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl mb-3 hover:opacity-90 transition-all active:scale-95"
          >
            📷 Take Progress Photo
          </button>
          
          <button
            onClick={() => setShowPhotoPrompt(null)}
            className="w-full bg-white/10 text-purple-300 font-medium py-3 rounded-xl hover:bg-white/20 transition-all"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  // Gallery view
  if (showGallery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">📸 Progress Photos</h2>
            <button
              onClick={() => setShowGallery(false)}
              className="bg-white/10 px-4 py-2 rounded-lg text-purple-300 hover:bg-white/20 transition-colors"
            >
              ← Back
            </button>
          </div>

          {photosArray.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-purple-300">No progress photos yet.</p>
              <p className="text-purple-400 text-sm mt-2">
                Complete a level to capture your first photo!
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-4">
                <div className="aspect-square rounded-xl overflow-hidden bg-black/30 mb-3">
                  <img
                    src={photosArray[galleryIndex]?.data}
                    alt={`Level ${photosArray[galleryIndex]?.milestone / 1000}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <div className="text-white font-bold text-xl">
                    {photosArray[galleryIndex]?.milestone === 0 
                      ? 'Starting Point' 
                      : `Level ${photosArray[galleryIndex]?.milestone / 1000} Complete`}
                  </div>
                  <div className="text-purple-300 text-sm">
                    {new Date(photosArray[galleryIndex]?.date).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => setGalleryIndex(Math.max(0, galleryIndex - 1))}
                  disabled={galleryIndex === 0}
                  className="w-12 h-12 rounded-full bg-white/10 text-white font-bold disabled:opacity-30 hover:bg-white/20 transition-all"
                >
                  ←
                </button>
                <span className="text-purple-300">
                  {galleryIndex + 1} / {photosArray.length}
                </span>
                <button
                  onClick={() => setGalleryIndex(Math.min(photosArray.length - 1, galleryIndex + 1))}
                  disabled={galleryIndex === photosArray.length - 1}
                  className="w-12 h-12 rounded-full bg-white/10 text-white font-bold disabled:opacity-30 hover:bg-white/20 transition-all"
                >
                  →
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {photosArray.map((photo, idx) => (
                  <button
                    key={photo.milestone}
                    onClick={() => setGalleryIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === galleryIndex ? 'border-purple-400 scale-105' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={photo.data} alt={`${photo.milestone}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {photosArray.length >= 2 && (
                <div className="mt-6 bg-white/5 rounded-2xl p-4">
                  <div className="text-purple-300 text-xs uppercase tracking-wider mb-3 text-center">
                    Your Transformation
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <div className="aspect-square rounded-xl overflow-hidden bg-black/30 mb-2">
                        <img src={photosArray[0].data} alt="First" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-center text-white text-sm">
                        {photosArray[0].milestone === 0 ? 'Day 0' : `Level ${photosArray[0].milestone / 1000}`}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="aspect-square rounded-xl overflow-hidden bg-black/30 mb-2">
                        <img src={photosArray[photosArray.length - 1].data} alt="Latest" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-center text-white text-sm">
                        {photosArray[photosArray.length - 1].milestone === 0 
                          ? 'Day 0' 
                          : `Level ${photosArray[photosArray.length - 1].milestone / 1000}`}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Stats view
  if (showStats) {
    const overallPercent = (totalPushups / GOAL) * 100;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">📊 Full Stats</h2>
            <button
              onClick={() => setShowStats(false)}
              className="bg-white/10 px-4 py-2 rounded-lg text-purple-300 hover:bg-white/20 transition-colors"
            >
              ← Back
            </button>
          </div>

          {/* Overall Progress */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-5 mb-4">
            <div className="text-purple-300 text-xs uppercase tracking-wider mb-2">Overall Progress</div>
            <div className="text-4xl font-black text-white mb-1">
              {totalPushups.toLocaleString()} <span className="text-lg text-purple-300">/ 100k</span>
            </div>
            <div className="h-3 bg-black/30 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
            <div className="text-purple-300 text-sm">{overallPercent.toFixed(2)}% complete • {remaining.toLocaleString()} remaining</div>
          </div>

          {/* Projection */}
          {dailyAverage > 0 && (
            <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-2xl p-4 mb-4">
              <div className="text-orange-300 text-xs uppercase tracking-wider mb-1">🎯 Projected Finish</div>
              <div className="text-white text-2xl font-bold">
                {new Date(Date.now() + daysToGoal * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                  month: 'long', day: 'numeric', year: 'numeric' 
                })}
              </div>
              <div className="text-orange-300 text-sm">{daysToGoal} days at current pace</div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-purple-300 text-xs uppercase">🔥 Streak</div>
              <div className="text-white text-2xl font-bold">{currentStreak} days</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-purple-300 text-xs uppercase">📊 Daily Avg</div>
              <div className="text-white text-2xl font-bold">{dailyAverage}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-purple-300 text-xs uppercase">📈 7-Day Avg</div>
              <div className="text-white text-2xl font-bold">{weeklyAvg}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-purple-300 text-xs uppercase">🏆 Best Day</div>
              <div className="text-white text-2xl font-bold">{bestDay}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-purple-300 text-xs uppercase">📅 Days Active</div>
              <div className="text-white text-2xl font-bold">{daysWithEntries}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-purple-300 text-xs uppercase">⏱️ Total Days</div>
              <div className="text-white text-2xl font-bold">{daysSinceStart || 0}</div>
            </div>
          </div>

          {/* Levels Completed */}
          <div className="bg-white/5 rounded-2xl p-4">
            <div className="text-purple-300 text-xs uppercase tracking-wider mb-3">Levels Completed</div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: Math.min(currentLevel - 1, 100) }, (_, i) => i + 1).map(level => {
                const hasPhoto = photos[level * 1000];
                return (
                  <div
                    key={level}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                      hasPhoto ? 'bg-pink-500 text-white' : 'bg-green-500/80 text-white'
                    }`}
                    title={hasPhoto ? 'Photo captured' : 'No photo'}
                  >
                    {level}
                  </div>
                );
              })}
              {currentLevel <= 100 && (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold bg-white/10 text-purple-300 border-2 border-dashed border-purple-500">
                  {currentLevel}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-purple-300">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500"></span> Done</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-pink-500"></span> + Photo</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main view - focused on next milestone
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 pb-8">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Header - minimal */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-lg font-bold text-white">💪 Push-Up Quest</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setGalleryIndex(0); setShowGallery(true); }}
              className="bg-white/10 p-2 rounded-lg text-purple-300 hover:bg-white/20"
            >
              📸
            </button>
            <button
              onClick={() => setShowStats(true)}
              className="bg-white/10 p-2 rounded-lg text-purple-300 hover:bg-white/20"
            >
              📊
            </button>
          </div>
        </div>

        {/* HERO: Next Milestone Progress */}
        <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 backdrop-blur rounded-3xl p-6 text-center border border-white/10">
          <div className="text-purple-200 text-sm font-medium mb-1">LEVEL {currentLevel}</div>
          
          {/* Circular progress indicator */}
          <div className="relative w-48 h-48 mx-auto my-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${levelPercent * 2.64} 264`}
                className="transition-all duration-500"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-black text-white tabular-nums">
                {remainingInLevel}
              </div>
              <div className="text-purple-200 text-sm">to go</div>
            </div>
          </div>

          <div className="text-white font-medium">
            <span className="text-purple-300">{progressInLevel}</span> / 1,000 → <span className="font-bold">{nextMilestone.toLocaleString()}</span>
          </div>
          
          {todayAdd > 0 && (
            <div className="text-green-400 text-lg font-bold mt-2 animate-pulse">+{todayAdd}!</div>
          )}
        </div>

        {/* Today + Quick Add */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-purple-300 text-xs uppercase tracking-wider">Today</div>
              <div className="text-3xl font-bold text-white tabular-nums">{todayCount}</div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => removePushups(1)}
                className="w-10 h-10 rounded-full bg-red-500/30 text-red-300 font-bold text-xl hover:bg-red-500/50 transition-all active:scale-90"
              >
                −
              </button>
              <button 
                onClick={() => addPushups(1)}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white font-bold text-2xl hover:from-green-300 hover:to-green-500 transition-all shadow-lg shadow-green-500/30 active:scale-90"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Quick add row */}
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 25, 50].map(num => (
              <button
                key={num}
                onClick={() => addPushups(num)}
                className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 rounded-xl transition-all active:scale-95"
              >
                +{num}
              </button>
            ))}
          </div>
        </div>

        {/* Mini Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-orange-400 text-lg font-bold">{currentStreak}🔥</div>
            <div className="text-purple-300 text-xs">streak</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-white text-lg font-bold">{dailyAverage}</div>
            <div className="text-purple-300 text-xs">avg/day</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <div className="text-white text-lg font-bold">{totalPushups.toLocaleString()}</div>
            <div className="text-purple-300 text-xs">total</div>
          </div>
        </div>

        {/* Overall progress - small and subtle */}
        <div className="bg-white/5 rounded-xl p-3">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-purple-300">Overall: {((totalPushups / GOAL) * 100).toFixed(1)}%</span>
            <span className="text-purple-400">{remaining.toLocaleString()} to 100k</span>
          </div>
          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
              style={{ width: `${(totalPushups / GOAL) * 100}%` }}
            />
          </div>
        </div>

        {/* Motivational footer */}
        {dailyAverage > 0 && (
          <div className="text-center text-purple-300 text-sm">
            At this pace, level {currentLevel} done in <span className="text-white font-medium">{Math.ceil(remainingInLevel / dailyAverage)} days</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
