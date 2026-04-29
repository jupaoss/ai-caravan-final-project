import { motion, type HTMLMotionProps } from 'framer-motion'

type Props = HTMLMotionProps<'div'>

export const PageTransition = ({ children, ...props }: Props) => (
  <motion.div
    initial={{ opacity: 1 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.25, ease: 'easeInOut' }}
    {...props}
  >
    {children}
  </motion.div>
)
