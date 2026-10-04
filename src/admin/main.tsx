import { createRoot } from 'react-dom/client'
import Studio from './Studio'

const root = document.getElementById('studio-root')
if (root) createRoot(root).render(<Studio />)

