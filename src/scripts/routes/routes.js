import HomePage from '../pages/home/home-page.js';
import LoginPage from '../pages/auth/login-page.js';
import RegisterPage from '../pages/auth/register-page.js';
import AddStoryPage from '../pages/add-story/add-story-page.js';
import FavoritesPage from '../pages/favorites/favorites-page.js';
import AboutPage from '../pages/about/about-page.js';

const routes = {
  '/': HomePage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/add-story': AddStoryPage,
  '/favorites': FavoritesPage,
  '/about': AboutPage,
};

export default routes;