export type Layout = 'story-first' | 'value-first' | 'social-first'
export type DetailLevel = 'essentials' | 'full-story'
export type NavStyle = 'guided' | 'ask'

export const assignLayout = (detail: DetailLevel, nav: NavStyle): Layout => {
  if (detail === 'full-story' && nav === 'guided') return 'story-first'
  if (detail === 'full-story' && nav === 'ask') return 'social-first'
  return 'value-first'
}

export const getVoiceScript = (
  layout: Layout,
  product: {
    name: string
    price: number
    description: string
    rating: number
    reviews: number
    sizes: string[]
  }
): string => {
  switch (layout) {
    case 'story-first':
      return `${product.name}. ${product.description} Ready to hear the price?`
    case 'value-first':
      return `${product.name}. $${product.price}. Available in ${product.sizes.join(', ')}. Want to add it or hear more?`
    case 'social-first':
      return `${product.name}. Rated ${product.rating} by ${product.reviews} people. $${product.price}. Want to hear more?`
  }
}
