import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  Block,
  Speed,
  MovieFilter,
  Star,
} from '@mui/icons-material';

interface PremiumDialogProps {
  open: boolean;
  onClose: () => void;
  onPurchase: () => void;
}

const PremiumDialog: React.FC<PremiumDialogProps> = ({
  open,
  onClose,
  onPurchase,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <Star sx={{ color: 'primary.main', mr: 1 }} />
          Премиум подписка
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
          Получите доступ ко всем премиум-возможностям:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <Block color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Без рекламы"
              secondary="Смотрите трейлеры без прерываний"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Speed color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Улучшенные рекомендации"
              secondary="Более точный подбор фильмов"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <MovieFilter color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Эксклюзивный контент"
              secondary="Доступ к специальным подборкам"
            />
          </ListItem>
        </List>
        <Typography
          variant="h6"
          sx={{ textAlign: 'center', mt: 2, color: 'primary.main' }}
        >
          Всего 299 ₽/месяц
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">
          Позже
        </Button>
        <Button
          variant="contained"
          onClick={onPurchase}
          startIcon={<Star />}
        >
          Активировать премиум
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PremiumDialog;
