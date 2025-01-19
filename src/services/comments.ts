interface Comment {
  id: string;
  movieId: number;
  text: string;
  author: string;
  timestamp: number;
}

// Временное хранилище комментариев (в реальном приложении это должно быть в базе данных)
const comments: Record<number, Comment[]> = {};

export const commentsService = {
  async getComments(movieId: number): Promise<Comment[]> {
    return comments[movieId] || [];
  },

  async addComment(movieId: number, text: string): Promise<Comment> {
    if (!comments[movieId]) {
      comments[movieId] = [];
    }

    const newComment: Comment = {
      id: Math.random().toString(36).substring(7),
      movieId,
      text,
      author: 'Пользователь', // В реальном приложении здесь будет имя текущего пользователя
      timestamp: Date.now()
    };

    comments[movieId].push(newComment);
    return newComment;
  }
};
