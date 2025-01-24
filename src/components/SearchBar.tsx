import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Chip,
  Typography,
  useTheme,
  useMediaQuery,
  Rating
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { tmdbService } from '../services/tmdb';
import type { Genre } from '../services/tmdb';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange: (genres: number[]) => void;
  onRatingChange: (rating: number) => void;
}

export default function SearchBar({ onSearch, onFilterChange, onRatingChange }: SearchBarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [minRating, setMinRating] = useState<number>(0);

  // Загрузка жанров при монтировании
  useEffect(() => {
    const loadGenres = async () => {
      const fetchedGenres = await tmdbService.getGenres();
      setGenres(fetchedGenres);
    };
    loadGenres();
  }, []);

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    onSearch(value);
  }, [onSearch]);

  const handleGenreToggle = useCallback((genreId: number) => {
    setSelectedGenres(prev => {
      const newGenres = prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId];
      onFilterChange(newGenres);
      return newGenres;
    });
  }, [onFilterChange]);

  const handleRatingChange = useCallback((event: React.ChangeEvent<{}>, value: number | null) => {
    const rating = value || 0;
    setMinRating(rating);
    onRatingChange(rating);
  }, [onRatingChange]);

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          p: 1,
          background: 'linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.6))',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          gap: 1,
          alignItems: 'center'
        }}
      >
        <TextField
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Поиск фильмов..."
          variant="outlined"
          size="small"
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'grey.500' }} />,
            sx: {
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
              '& input::placeholder': {
                color: 'grey.500',
                opacity: 1,
              },
            },
          }}
        />
        <IconButton
          onClick={() => setIsFilterOpen(true)}
          sx={{
            color: 'white',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
          }}
        >
          <FilterIcon />
        </IconButton>
      </Box>

      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 300,
            maxHeight: isMobile ? '80vh' : '100vh',
            bgcolor: 'background.paper',
            p: 2
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Фильтры</Typography>
          <IconButton onClick={() => setIsFilterOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          Минимальный рейтинг
        </Typography>
        <Rating
          value={minRating}
          onChange={handleRatingChange}
          precision={0.5}
          sx={{ mb: 2 }}
        />

        <Typography variant="subtitle1" gutterBottom>
          Жанры
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {genres.map(genre => (
            <Chip
              key={genre.id}
              label={genre.name}
              onClick={() => handleGenreToggle(genre.id)}
              color={selectedGenres.includes(genre.id) ? 'primary' : 'default'}
              sx={{
                '&.MuiChip-root': {
                  borderRadius: 1,
                },
              }}
            />
          ))}
        </Box>
      </Drawer>
    </>
  );
}
