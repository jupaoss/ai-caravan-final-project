import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Toggle } from './Toggle'
import type { ToggleProps } from './Toggle'

const meta: Meta<typeof Toggle> = {
  title: 'Components/Toggle',
  component: Toggle,
}

export default meta

type Story = StoryObj<typeof Toggle>

// Wrapper to simulate real interaction
const Template = (args: Pick<ToggleProps, 'active'>) => {
  const [active, setActive] = useState<ToggleProps['active']>(args.active)

  return (
    <Toggle
      active={active}
      onChange={(mode) => setActive(mode)}
    />
  )
}

export const Gaze: Story = {
  render: () => <Template active="gaze" />,
}

export const Echo: Story = {
  render: () => <Template active="echo" />,
}