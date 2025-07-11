/**
 * Utility functions for date formatting
 */

export const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'vor wenigen Minuten';
  if (diffInHours < 24) return `vor ${diffInHours} Std.`;
  if (diffInHours < 168) return `vor ${Math.floor(diffInHours / 24)} Tagen`;

  return date.toLocaleDateString('de-DE');
}; 