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
  content: '<p>Semper si interdum ultricies id fringilla sodales ipsum luctus donec cras. Justo vel felis facilisi feugiat sapien luctus massa sed sit conubia. Fermentum rutrum hendrerit integer dignissim vel turpis aptent habitasse scelerisque donec. Montes egestas ante cursus enim duis praesent sapien eget posuere inceptos. Torquent nisi morbi arcu consectetur molestie.</p>',
  type: 'player',
};

export const GM = Template.bind({});
GM.args = {
  header: 'GM',
  content: '<p>Semper si interdum ultricies id fringilla sodales ipsum luctus donec cras. Justo vel felis facilisi feugiat sapien luctus massa sed sit conubia. Fermentum rutrum hendrerit integer dignissim vel turpis aptent habitasse scelerisque donec. Montes egestas ante cursus enim duis praesent sapien eget posuere inceptos. Torquent nisi morbi arcu consectetur molestie.</p>',
  type: 'gm',
};

export const Aside = Template.bind({});
Aside.args = {
  header: 'Aside',
  content: '<p>Semper si interdum ultricies id fringilla sodales ipsum luctus donec cras. Justo vel felis facilisi feugiat sapien luctus massa sed sit conubia. Fermentum rutrum hendrerit integer dignissim vel turpis aptent habitasse scelerisque donec. Montes egestas ante cursus enim duis praesent sapien eget posuere inceptos. Torquent nisi morbi arcu consectetur molestie.</p>',
  type: 'aside',
};