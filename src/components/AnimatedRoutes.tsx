import { useLocation, useNavigate } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { EntryPoint } from '../pages/EntryPoint'
import { EchoOnboarding } from '../pages/EchoOnboarding'
import { GazeShop } from '../pages/GazeShop'
import { EchoShopV2 } from '../pages/EchoShopV2'
import { ProductDetail } from '../pages/ProductDetail'
import { Toggle } from './Toggle'

const TOGGLE_PATHS = ['/gaze', '/echo-v2']

export const AnimatedRoutes = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const showToggle = TOGGLE_PATHS.includes(location.pathname)
  const activeMode = location.pathname === '/gaze' ? 'gaze' : 'echo'

  const handleToggleChange = (mode: 'gaze' | 'echo') => {
    if (mode === 'gaze') navigate('/gaze')
    else navigate('/echo-v2', { state: { showResults: true } })
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<EntryPoint />} />
          <Route path="/gaze" element={<GazeShop />} />
          <Route path="/echo-onboarding" element={<EchoOnboarding />} />
          <Route path="/echo-v2" element={<EchoShopV2 />} />
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </AnimatePresence>
      {showToggle && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 200 }}>
          <Toggle active={activeMode} onChange={handleToggleChange} />
        </div>
      )}
    </>
  )
}
