import Quote from './Quote.vue';

export default {
  title: 'Journals/Quote',
  component: Quote,
  argTypes: {
    header: { control: 'text' },
    content: { control: 'text' },
    type: {
      control: { type: 'select' },
      options: ['icon', 'npc'],
    },
  },
};

const Template = (args) => ({
  components: { Quote },
  setup() {
    return { args };
  },
  template: '<quote v-bind="args" />',
});

export const Icon = Template.bind({});
Icon.args = {
  header: 'Quote',
  content: '"Your pardon, but this is the moment you burst into flames...<span>fireball</span>...and I go save civilization."',
  type: 'icon'
};

export const NPC = Template.bind({});
NPC.args = {
  content: '<p>The early Emperors who understood that their people needed games of war to remain fit for true battle imagined that the war games would stop when the Empire charged into actual war. Which shows that Emperors know much of war but little of people.</p>',
  type: 'npc',
  author: 'Kullis'
};