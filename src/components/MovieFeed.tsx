import React, { useState, useEffect, useCallback } from 'react';
import { Box, IconButton, Typography, CircularProgress, Button, useTheme, useMediaQuery } from '@mui/material';
import { Favorite, FavoriteBorder, Comment, VolumeOff, VolumeUp, Refresh } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import Comments from './Comments';
import { tmdbService } from '../services/tmdb';
import { storageService } from '../services/storage';
import type { Movie } from '../services/tmdb';

export default function MovieFeed() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMovies = useCallback(async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (refresh) {
        tmdbService.clearSeenMovies();
      }
      
      const fetchedMovies = await tmdbService.getMoviesWithTrailers();
      if (fetchedMovies.length === 0) {
        setError('Не удалось загрузить фильмы');
        return;
      }
      
      setMovies(fetchedMovies);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка при загрузке фильмов');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMovies(true);
  };

  const currentMovie = movies[currentIndex];

  const handleLike = () => {
    if (!currentMovie) return;
    
    const isNowLiked = storageService.toggleLikedMovie(currentMovie);
    setMovies(prevMovies => 
      prevMovies.map(movie => 
        movie.id === currentMovie.id 
          ? { ...movie, liked: isNowLiked }
          : movie
      )
    );
  };

  const handleSwipe = (direction: 'up' | 'down') => {
    if (direction === 'up' && currentIndex < movies.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (direction === 'down' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

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
            {currentMovie.video_key ? (
              <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${currentMovie.video_key}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&playsinline=1`}
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
                onClick={() => setIsMuted(!isMuted)}
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
                onClick={() => setShowFullDescription(!showFullDescription)}
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
                  onClick={() => setShowComments(true)}
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
        onClose={() => setShowComments(false)}
      />
    </motion.div>
  );
}
