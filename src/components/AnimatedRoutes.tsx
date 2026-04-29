import { useLocation } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { EntryPoint } from '../pages/EntryPoint'
import { EchoOnboarding } from '../pages/EchoOnboarding'
import { GazeShop } from '../pages/GazeShop'
import { EchoShop } from '../pages/EchoShop'
import { EchoShopV2 } from '../pages/EchoShopV2'
import { ProductDetail } from '../pages/ProductDetail'

export const AnimatedRoutes = () => {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<EntryPoint />} />
        <Route path="/gaze" element={<GazeShop />} />
        <Route path="/echo-onboarding" element={<EchoOnboarding />} />
        <Route path="/echo" element={<EchoShop />} />
        <Route path="/echo-v2" element={<EchoShopV2 />} />
        <Route path="/product/:id" element={<ProductDetail />} />
      </Routes>
    </AnimatePresence>
  )
}
