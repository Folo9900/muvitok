import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Box, IconButton, Typography, CircularProgress, Button, useTheme, useMediaQuery } from '@mui/material';
import { Favorite, FavoriteBorder, Comment, VolumeOff, VolumeUp, Refresh } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import Comments from './Comments';
import { tmdbService } from '../services/tmdb';
import { storageService } from '../services/storage';
import { videoCacheService } from '../services/video-cache';
import type { Movie } from '../services/tmdb';
import SearchBar from './SearchBar';

export default function MovieFeed() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isInitialMount = useRef(true);
  const prevMovieId = useRef<number | null>(null);
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isMuted, setIsMuted] = useState(() => storageService.getSoundState());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    query: '',
    genres: [] as number[],
    minRating: 0
  });

  const fetchMovies = useCallback(async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (refresh) {
        tmdbService.clearSeenMovies();
      }
      
      const fetchedMovies = await tmdbService.getMoviesWithTrailers(filters);
      if (fetchedMovies.length === 0) {
        setError('Не удалось загрузить фильмы');
        return;
      }
      
      setMovies(fetchedMovies);
      setCurrentIndex(0);
      console.log('Successfully fetched movies:', fetchedMovies.length);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка при загрузке фильмов');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filters]);

  // Инициализация при монтировании
  useEffect(() => {
    if (isInitialMount.current) {
      console.log('Initial mount, fetching movies...');
      isInitialMount.current = false;
      fetchMovies();
    }
  }, [fetchMovies]);

  // Сохранение состояния звука
  useEffect(() => {
    if (!isInitialMount.current) {
      console.log('Saving sound state:', isMuted);
      storageService.setSoundState(isMuted);
    }
  }, [isMuted]);

  // Кэширование видео URL
  useEffect(() => {
    if (currentMovie?.video_key) {
      const videoId = currentMovie.video_key;
      const videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&playsinline=1&rel=0`;
      videoCacheService.set(videoId, videoUrl);
    }
  }, [currentMovie?.video_key, isMuted]);

  // Предзагрузка следующего видео
  useEffect(() => {
    const nextMovie = movies[currentIndex + 1];
    if (nextMovie?.video_key) {
      const videoUrl = `https://www.youtube.com/embed/${nextMovie.video_key}?autoplay=0&controls=0&modestbranding=1&playsinline=1&rel=0`;
      videoCacheService.set(nextMovie.video_key, videoUrl);
    }
  }, [movies, currentIndex]);

  const handleRefresh = useCallback(() => {
    console.log('Refreshing movies...');
    setIsRefreshing(true);
    fetchMovies(true);
  }, [fetchMovies]);

  const currentMovie = useMemo(() => movies[currentIndex], [movies, currentIndex]);

  const handleLike = useCallback(() => {
    if (!currentMovie) return;
    
    console.log('Toggling like for movie:', currentMovie.title);
    const isNowLiked = storageService.toggleLikedMovie(currentMovie);
    setMovies(prevMovies => 
      prevMovies.map(movie => 
        movie.id === currentMovie.id 
          ? { ...movie, liked: isNowLiked }
          : movie
      )
    );
  }, [currentMovie]);

  const handleSwipe = useCallback((direction: 'up' | 'down') => {
    console.log('Swiping:', direction);
    if (direction === 'up' && currentIndex < movies.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowFullDescription(false);
    } else if (direction === 'down' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowFullDescription(false);
    }
  }, [currentIndex, movies.length]);

  const handleToggleDescription = useCallback(() => {
    setShowFullDescription(prev => !prev);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleToggleComments = useCallback(() => {
    setShowComments(prev => !prev);
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'black'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'black',
          color: 'white',
          p: 2,
          textAlign: 'center'
        }}
      >
        <Typography variant="h6" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRefresh}
          disabled={isRefreshing}
          startIcon={<Refresh />}
        >
          {isRefreshing ? 'Обновление...' : 'Попробовать снова'}
        </Button>
      </Box>
    );
  }

  if (!currentMovie) {
    return null;
  }

  const videoUrl = currentMovie.video_key 
    ? videoCacheService.get(currentMovie.video_key) || 
      `https://www.youtube.com/embed/${currentMovie.video_key}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&playsinline=1&rel=0`
    : null;

  return (
    <motion.div
      style={{ height: '100vh', overflow: 'hidden', position: 'relative', touchAction: 'none' }}
      onPanEnd={(e, { offset, velocity }) => {
        const swipe = Math.abs(offset.y) * velocity.y;
        if (swipe < -1000) {
          handleSwipe('up');
        } else if (swipe > 1000) {
          handleSwipe('down');
        }
      }}
    >
      <SearchBar
        onSearch={(query) => setFilters(prev => ({ ...prev, query }))}
        onFilterChange={(genres) => setFilters(prev => ({ ...prev, genres }))}
        onRatingChange={(rating) => setFilters(prev => ({ ...prev, minRating: rating }))}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentMovie.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              bgcolor: 'black',
              overflow: 'hidden'
            }}
          >
            {videoUrl ? (
              <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                <iframe
                  width="100%"
                  height="100%"
                  src={videoUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  style={{
                    border: 'none',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: isMobile ? '100vw' : '100vw',
                    height: isMobile ? '100vh' : '100vh',
                    objectFit: 'cover',
                    pointerEvents: 'none'
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ 
                width: '100%', 
                height: '100%', 
                bgcolor: 'black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography color="white">Трейлер недоступен</Typography>
              </Box>
            )}

            {/* Контролы в верхней части экрана */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-between',
                padding: { xs: 1, sm: 2 },
                background: 'linear-gradient(rgba(0,0,0,0.7), transparent)',
                zIndex: 2
              }}
            >
              <IconButton
                onClick={handleRefresh}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
                }}
              >
                <Refresh />
              </IconButton>
              
              <IconButton
                onClick={handleToggleMute}
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
                }}
              >
                {isMuted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>
            </Box>

            {/* Информация о фильме */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                padding: { xs: 2, sm: 3 },
                paddingBottom: { xs: 4, sm: 5 },
                zIndex: 1
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: { xs: '1.2rem', sm: '1.5rem' },
                  mb: 1,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                {currentMovie.title}
              </Typography>

              {currentMovie.genres && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  {currentMovie.genres.map(genre => (
                    <Typography
                      key={genre.id}
                      variant="caption"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: { xs: '0.7rem', sm: '0.8rem' }
                      }}
                    >
                      {genre.name}
                    </Typography>
                  ))}
                </Box>
              )}

              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 2,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  display: '-webkit-box',
                  WebkitLineClamp: showFullDescription ? 'unset' : 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }}
                onClick={handleToggleDescription}
              >
                {currentMovie.overview}
              </Typography>

              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1, sm: 2 },
                mt: { xs: 1, sm: 2 }
              }}>
                <IconButton
                  onClick={handleLike}
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
                  }}
                >
                  {currentMovie.liked ? (
                    <Favorite sx={{ color: '#ff4081' }} />
                  ) : (
                    <FavoriteBorder />
                  )}
                </IconButton>
                <IconButton
                  onClick={handleToggleComments}
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
                  }}
                >
                  <Comment />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </motion.div>
      </AnimatePresence>

      <Comments
        movieId={currentMovie.id}
        open={showComments}
        onClose={handleToggleComments}
      />
    </motion.div>
  );
}
