/**
 * API Configuration
 * Single source of truth for API endpoints
 * 
 * To use localhost:
 * 1. Change API_BASE_URL below to 'http://localhost:5000' or your local port
 * 2. Make sure your backend is running locally
 * 3. For Android emulator, use 'http://10.0.2.2:5000'
 * 4. For iOS simulator, use 'http://localhost:5000'
 */

// Change this to switch between environments
const API_BASE_URL = 'https://signup.roostapp.io';
// const API_BASE_URL = 'http://localhost:5000';
// Alternative configurations (uncomment to use):
// const API_BASE_URL = 'http://localhost:5000';  // For iOS simulator and web
// const API_BASE_URL = 'http://10.0.2.2:5000';   // For Android emulator
// const API_BASE_URL = 'http://192.168.1.x:5000'; // For physical devices (replace with your machine's IP)

export default API_BASE_URL;
