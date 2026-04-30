import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { SearchBar, type SearchBarState } from './SearchBar'

const meta: Meta<typeof SearchBar> = {
  title: 'Components/SearchBar',
  component: SearchBar,
}

export default meta

type Story = StoryObj<typeof SearchBar>

// Wrapper to simulate controlled input behavior
const Template = (args: { state: SearchBarState }) => {
  const [value, setValue] = useState('')

  return (
    <div style={{ width: 320 }}>
      <SearchBar
        {...args}
        value={value}
        onChange={setValue}
        onActivate={() => console.log('activate')}
      />
    </div>
  )
}

export const Default: Story = {
  render: () => <Template state="default" />,
}

export const Listening: Story = {
  render: () => <Template state="listening" />,
}

export const Entered: Story = {
  render: () => <Template state="entered" />,
}