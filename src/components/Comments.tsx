import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
} from '@mui/material';
import { commentsService } from '../services/comments';

interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: number;
}

interface CommentsProps {
  movieId: number;
  open: boolean;
  onClose: () => void;
}

const Comments: React.FC<CommentsProps> = ({ movieId, open, onClose }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadComments();
    }
  }, [open, movieId]);

  const loadComments = async () => {
    try {
      const movieComments = await commentsService.getComments(movieId);
      setComments(movieComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const comment = await commentsService.addComment(movieId, newComment.trim());
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Комментарии</DialogTitle>
      <DialogContent>
        <List>
          {comments.map((comment) => (
            <ListItem key={comment.id}>
              <ListItemText
                primary={comment.text}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {comment.author}
                    </Typography>
                    {' — '}
                    {new Date(comment.timestamp).toLocaleString()}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="Напишите комментарий..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading || !newComment.trim()}
            sx={{ mt: 1 }}
          >
            Отправить
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default Comments;
