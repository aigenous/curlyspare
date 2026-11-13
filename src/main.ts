import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './router'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/app.css'
import './styles/shell.css'

export const createApp = ViteSSG(App, { routes, scrollBehavior: () => ({ top: 0 }) }, () => {}, {
  hydration: true,
})
