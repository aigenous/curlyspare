import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './router'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-ext-400.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-ext-700.css'
import './styles/tokens.css'
import './styles/base.css'

export const createApp = ViteSSG(App, { routes, scrollBehavior: () => ({ top: 0 }) }, () => {}, {
  hydration: true,
})
