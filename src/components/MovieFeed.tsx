import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Fade, CircularProgress, Button } from '@mui/material';
import { Favorite, FavoriteBorder, Comment } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import Comments from './Comments';
import { tmdbService } from '../services/tmdb';
import { videoCacheService } from '../services/video-cache';
import { favoritesService } from '../services/favorites'; // Import favoritesService

interface Movie {
  id: number;
  title: string;
  overview: string;
  vote_average: number;
  video_key?: string;
  liked: boolean;
}

const MovieFeed: React.FC = () => {
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [likedMovies, setLikedMovies] = useState<number[]>([]); // Add likedMovies state
  const [showFullDescription, setShowFullDescription] = useState(false);

  const getFirstSentence = (text: string) => {
    const match = text.match(/^.*?[.!?](?:\s|$)/);
    return match ? match[0].trim() : text;
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const movies = await tmdbService.getMoviesWithTrailers();
        setMovies(movies.map(movie => ({ ...movie, liked: false })));
      } catch (error) {
        console.error('Error fetching movies:', error);
      }
    };
    fetchMovies();
  }, []);

  const loadMoreMovies = async () => {
    try {
      const newMovies = await tmdbService.getMoviesWithTrailers();
      setMovies(prevMovies => [...prevMovies, ...newMovies.map(movie => ({ ...movie, liked: false }))]);
    } catch (error) {
      console.error('Error loading more movies:', error);
    }
  };

  const handleLike = async (movieId: number) => {
    try {
      const isFavorite = await favoritesService.isFavorite(movieId);
      if (isFavorite) {
        await favoritesService.removeFromFavorites(movieId);
      } else {
        await favoritesService.addToFavorites(movieId);
      }
      setLikedMovies(prev => {
        if (prev.includes(movieId)) {
          return prev.filter(id => id !== movieId);
        } else {
          return [...prev, movieId];
        }
      });
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
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
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${currentMovie.video_key}?autoplay=1&mute=1&controls=0&modestbranding=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{
              border: 'none',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '200vw',
              height: '200vh',
              objectFit: 'cover',
              pointerEvents: 'none'
            }}
          />
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
            padding: 2,
            zIndex: 1
          }}
        >
          <Typography variant="h6" gutterBottom>
            {currentMovie.title}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {showFullDescription ? currentMovie.overview : getFirstSentence(currentMovie.overview)}
            {currentMovie.overview !== getFirstSentence(currentMovie.overview) && (
              <Button
                onClick={() => setShowFullDescription(!showFullDescription)}
                sx={{ color: 'primary.main', textTransform: 'none', ml: 1 }}
              >
                {showFullDescription ? 'Свернуть' : 'Читать далее'}
              </Button>
            )}
          </Typography>
          {showFullDescription && (
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0,0,0,0.8)',
                zIndex: 2,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
              onClick={() => setShowFullDescription(false)}
            >
              <Typography variant="h6" gutterBottom>
                {currentMovie.title}
              </Typography>
              <Typography variant="body1">
                {currentMovie.overview}
              </Typography>
            </Box>
          )}
          <Typography variant="subtitle1" color="white">
            Рейтинг: {currentMovie.vote_average}/10
          </Typography>
          <Box
            sx={{
              position: 'absolute',
              right: 16,
              bottom: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              zIndex: 1
            }}
          >
            <IconButton onClick={() => handleLike(currentMovie.id)} sx={{ color: 'white' }}>
              {likedMovies.includes(currentMovie.id) ? <Favorite color="error" /> : <FavoriteBorder />}
            </IconButton>
            <IconButton sx={{ color: 'white' }} onClick={() => setCommentsOpen(true)}>
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
