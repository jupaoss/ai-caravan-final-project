import type { Meta, StoryObj } from '@storybook/react'
import { Waveform } from './Waveform'

const meta: Meta<typeof Waveform> = {
  title: 'Components/Waveform',
  component: Waveform,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    state: {
      control: 'select',
      options: [
        'idle',
        'listening',
        'system-talking',
        'user-talking',
        'resting',
      ],
    },
  },
}

export default meta

type Story = StoryObj<typeof Waveform>

export const Idle: Story = {
  args: {
    state: 'idle',
    label: 'Idle state',
  },
}

export const Listening: Story = {
  args: {
    state: 'listening',
    label: 'Listening...',
  },
}

export const SystemTalking: Story = {
  args: {
    state: 'system-talking',
    label: 'System speaking',
  },
}

export const UserTalking: Story = {
  args: {
    state: 'user-talking',
    label: 'User speaking',
  },
}

export const Resting: Story = {
  args: {
    state: 'resting',
    label: 'Resting state',
  },
}