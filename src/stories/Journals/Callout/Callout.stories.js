import Callout from './Callout.vue';

export default {
  title: 'Journals/Callout',
  component: Callout,
  argTypes: {
    header: { control: 'text' },
    content: { control: 'text' },
    type: {
      control: { type: 'select' },
      options: ['player', 'gm', 'aside'],
    },
  },
};

const Template = (args) => ({
  components: { Callout },
  setup() {
    return { args };
  },
  template: '<callout v-bind="args" />',
});

export const Player = Template.bind({});
Player.args = {
  header: 'Player',
  content: '<p>Lorem ipsum dolor sit amet.</p>',
  type: 'player',
};

export const GM = Template.bind({});
GM.args = {
  header: 'GM',
  content: '<p>Lorem ipsum dolor sit amet.</p>',
  type: 'gm',
};

export const Aside = Template.bind({});
Aside.args = {
  header: 'Aside',
  content: '<p>Lorem ipsum dolor sit amet.</p>',
  type: 'aside',
};