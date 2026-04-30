import type { Meta, StoryObj } from '@storybook/react'
import { Card } from './Card'
import type { Product } from '../data/products'

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
}

export default meta

type Story = StoryObj<typeof Card>

// ✅ Full mock that matches your real Product type
const mockProduct: Product = {
  id: '1',
  name: 'Air Max 90',
  price: 120,
  image: 'https://via.placeholder.com/400x300',
  description: 'A classic sneaker with modern comfort and style.',
  colors: ['#000000', '#FFFFFF', '#FF0000'],
  sizes: ['S', 'M', 'L'],
  rating: 4.5,
  reviews: 120,
}

export const Gaze: Story = {
  args: {
    product: mockProduct,
    variant: 'gaze',
  },
}

export const EchoSmall: Story = {
  args: {
    product: mockProduct,
    variant: 'echo-small',
  },
}

export const EchoBig: Story = {
  args: {
    product: mockProduct,
    variant: 'echo-big',
  },
}

export const EchoBigWithKaraoke: Story = {
  args: {
    product: mockProduct,
    variant: 'echo-big',
    karaokeWords: [
      { word: 'This', state: 'active', start: 0, end: 500 },
      { word: 'is', state: 'active', start: 500, end: 800 },
      { word: 'karaoke', state: 'active', start: 800, end: 1400 },
    ],
  },
}

export const Thumbnail: Story = {
  args: {
    product: mockProduct,
    variant: 'thumbnail',
  },
}