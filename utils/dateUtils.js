/**
 * Format a date string to a readable format
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Check if today
  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  }
  
  // Check if yesterday
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  // Check if this week
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (d > weekAgo) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d.getDay()];
  }
  
  // Otherwise return formatted date
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return d.toLocaleDateString('en-US', options);
};

/**
 * Format a time string to readable format
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

/**
 * Get relative time string (e.g., "5 mins ago", "2 hours ago")
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(date);
};
