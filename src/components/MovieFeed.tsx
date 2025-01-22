import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Fade, CircularProgress, Button } from '@mui/material';
import { Favorite, FavoriteBorder, Comment, VolumeOff, VolumeUp } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import Comments from './Comments';
import { tmdbService } from '../services/tmdb';
import { storageService } from '../services/storage';

interface Movie {
  id: number;
  title: string;
  overview: string;
  vote_average: number;
  poster_path: string;
  backdrop_path: string;
  video_key: string | null;
  liked: boolean;
}

const MovieFeed: React.FC = () => {
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [likedMovies, setLikedMovies] = useState<number[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Функция для перемешивания массива
  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const getFirstSentence = (text: string) => {
    const match = text.match(/^.*?[.!?](?:\s|$)/);
    return match ? match[0].trim() : text;
  };

  useEffect(() => {
    // Загружаем избранные фильмы при монтировании компонента
    setLikedMovies(storageService.getLikedMovies());
  }, []);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedMovies = await tmdbService.getMoviesWithTrailers();
        if (fetchedMovies.length === 0) {
          setError('Не удалось загрузить фильмы');
          return;
        }
        // Перемешиваем фильмы перед отображением
        setMovies(shuffleArray(fetchedMovies));
      } catch (error) {
        console.error('Error fetching movies:', error);
        setError(error instanceof Error ? error.message : 'Произошла ошибка при загрузке фильмов');
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const loadMoreMovies = async () => {
    try {
      setLoading(true);
      const newMovies = await tmdbService.getMoviesWithTrailers();
      if (newMovies.length === 0) {
        setError('Не удалось загрузить больше фильмов');
        return;
      }
      setMovies(prevMovies => [...prevMovies, ...newMovies]);
    } catch (error) {
      console.error('Error loading more movies:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка при загрузке фильмов');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = () => {
    if (!currentMovie) return;
    
    const isNowLiked = storageService.toggleLikedMovie(currentMovie.id);
    setLikedMovies(storageService.getLikedMovies());
    
    // Обновляем состояние текущего фильма
    setMovies(prevMovies => 
      prevMovies.map(movie => 
        movie.id === currentMovie.id 
          ? { ...movie, liked: isNowLiked }
          : movie
      )
    );
  };

  const handleSwipe = async (direction: 'up' | 'down') => {
    if (direction === 'up' && currentIndex < movies.length - 1) {
      setCurrentIndex(prev => prev + 1);
      
      // Если осталось мало фильмов, загружаем еще
      if (currentIndex >= movies.length - 3) {
        loadMoreMovies();
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'error.main' }}>
        <Typography variant="h6">{error}</Typography>
      </Box>
    );
  }

  if (!movies.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Нет доступных фильмов</Typography>
      </Box>
    );
  }

  const currentMovie = movies[currentIndex];

  return (
    <motion.div style={{ height: '100vh', position: 'relative' }}>
      <motion.div
        style={{ height: '100vh', position: 'relative' }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.y < -50) handleSwipe('up');
          else if (info.offset.y > 50) handleSwipe('down');
        }}
      >
        {currentMovie.video_key ? (
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${currentMovie.video_key}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              style={{
                border: 'none',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100vw',
                height: '100vh',
                objectFit: 'cover',
                pointerEvents: 'none'
              }}
            />
            <IconButton
              onClick={() => setIsMuted(!isMuted)}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)'
                },
                zIndex: 2
              }}
            >
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
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

        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            padding: { xs: 1, sm: 2 },
            zIndex: 1
          }}
        >
          <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} gutterBottom>
            {currentMovie.title}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 1,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              display: '-webkit-box',
              WebkitLineClamp: showFullDescription ? 'unset' : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
            onClick={() => setShowFullDescription(!showFullDescription)}
          >
            {currentMovie.overview}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <IconButton
              onClick={handleLike}
              sx={{
                color: 'white',
                '&:hover': { color: '#ff4081' }
              }}
            >
              {likedMovies.includes(currentMovie.id) ? (
                <Favorite sx={{ color: '#ff4081' }} />
              ) : (
                <FavoriteBorder />
              )}
            </IconButton>
            <IconButton
              onClick={() => setCommentsOpen(true)}
              sx={{
                color: 'white',
                '&:hover': { color: '#2196f3' }
              }}
            >
              <Comment />
            </IconButton>
          </Box>
        </Box>

        <Comments
          open={commentsOpen}
          onClose={() => setCommentsOpen(false)}
          movieId={currentMovie.id}
        />
      </motion.div>
    </motion.div>
  );
};

export default MovieFeed;
