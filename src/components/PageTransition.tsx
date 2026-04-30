import { motion, type HTMLMotionProps } from 'framer-motion'

type Props = HTMLMotionProps<'div'>

export const PageTransition = ({ children, ...props }: Props) => (
  <motion.div
    initial={{ opacity: 1 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, y: 10, scale: 0.99 }}
    transition={{ duration: 0.38, ease: 'easeIn' }}
    {...props}
  >
    {children}
  </motion.div>
)
