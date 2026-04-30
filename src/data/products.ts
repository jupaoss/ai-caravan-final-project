import product1Url from '../assets/images/03-product-1.png'
import product2Url from '../assets/images/04-product-2.png'
import product3Url from '../assets/images/05-product-3.png'
import product4Url from '../assets/images/06-product-4.png'
import product5Url from '../assets/images/07-product-5.png'

export interface Product {
  id: string
  name: string
  price: number
  description: string
  shortDescription?: string
  sizes: string[]
  rating: number
  reviews: number
  colors: string[]
  image: string
  isNew?: boolean
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Balloon Wrinkle Dress',
    price: 140,
    description: 'Dress made of knit fabric with a racerback neckline and balloon silhouette.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    rating: 4.6,
    reviews: 89,
    colors: ['#1A542F', '#000000'],
    image: product1Url,
  },
  {
    id: '2',
    name: 'Oversized Pleated Sleeve Dress',
    price: 400,
    description: 'Plain dress with long raglan sleeves and pleated satin. Straight cut.',
    sizes: ['XS', 'S', 'M', 'L'],
    rating: 4.8,
    reviews: 134,
    colors: ['#000000', '#FFFFFF'],
    image: product2Url,
  },
  {
    id: '3',
    name: 'Superlight Dress winkle tricoline',
    price: 320,
    description: 'Dress with thin straps and a straight neckline. Long length. Straight cut. Pleated fabric.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    rating: 4.9,
    reviews: 212,
    colors: ['#DAB993', '#000000'],
    image: product3Url,
    isNew: true,
  },
  {
    id: '4',
    name: 'Vestido smoking nadador lastex plisse',
    price: 80,
    description: "Women's plain dress. A blend of satin and crushed cotton. Sheath silhouette.",
    sizes: ['S', 'M', 'L'],
    rating: 4.4,
    reviews: 56,
    colors: ['#9E0003', '#000000'],
    image: product4Url,
  },
  {
    id: '5',
    name: 'Pleated Collar Dress',
    price: 340,
    description: "Strappy dress with a straight neckline, structured bust with padding, defined waist, A-line skirt, and midi length. Features a back zipper closure. Part of the Regenerate Life collection, made from a viscose and hemp blend.\n\nDesigned for a balanced silhouette, this piece combines structure and fluidity for a refined yet effortless look.",
    shortDescription: "Strappy dress with a straight neckline, structured bust with padding, defined waist, A-line skirt, and midi length.",
    sizes: ['XS', 'S', 'M', 'L'],
    rating: 4.7,
    reviews: 98,
    colors: ['#FFFFFF'],
    image: product5Url,
  },
]
