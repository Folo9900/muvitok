import React from 'react';
import {
  Box,
  Typography,
  Switch,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  useTheme,
} from '@mui/material';
import { useColorMode } from '../contexts/ColorModeContext';
import { tmdbService } from '../services/tmdb';
import { favoritesService } from '../services/favorites';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
}

const Profile: React.FC = () => {
  const { mode, toggleColorMode } = useColorMode();
  const theme = useTheme();
  const [favoriteMovies, setFavoriteMovies] = React.useState<Movie[]>([]);
  const [isPremium, setIsPremium] = React.useState(false);

  React.useEffect(() => {
    const loadFavorites = async () => {
      try {
        const favorites = await favoritesService.getFavorites();
        setFavoriteMovies(favorites);
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };

    loadFavorites();
  }, []);

  const handleRemoveFromFavorites = async (movieId: number) => {
    try {
      await favoritesService.removeFromFavorites(movieId);
      setFavoriteMovies(prev => prev.filter(movie => movie.id !== movieId));
    } catch (error) {
      console.error('Error removing movie from favorites:', error);
    }
  };

  const handlePremiumSubscribe = async () => {
    try {
      const response = await fetch('/api/payments/create-invoice', {
        method: 'POST',
      });
      const data = await response.json();
      // Здесь будет обработка платежа через Telegram
      console.log('Payment data:', data);
    } catch (error) {
      console.error('Error creating payment:', error);
    }
  };

  return (
    <Box sx={{ pb: 7, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Профиль пользователя
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Настройки
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography>Темная тема</Typography>
            <Switch
              checked={mode === 'dark'}
              onChange={toggleColorMode}
              color="primary"
            />
          </Box>
          {!isPremium && (
            <Button
              variant="contained"
              color="primary"
              onClick={handlePremiumSubscribe}
              sx={{ mb: 2 }}
            >
              Подключить Premium
            </Button>
          )}
        </Box>

        <Typography variant="h6" gutterBottom>
          Избранные фильмы
        </Typography>
        <Grid container spacing={2}>
          {favoriteMovies.map((movie) => (
            <Grid item xs={6} sm={4} md={3} key={movie.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={tmdbService.getImageUrl(movie.poster_path)}
                  alt={movie.title}
                />
                <CardContent>
                  <Typography variant="subtitle2" noWrap>
                    {movie.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Рейтинг: {movie.vote_average}/10
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveFromFavorites(movie.id)}
                  >
                    Удалить
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Profile;
