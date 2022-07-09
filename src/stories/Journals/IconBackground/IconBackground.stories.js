import IconBackground from './IconBackground.vue';

export default {
  title: 'Journals/IconBackground',
  component: IconBackground,
  argTypes: {
    header: { control: 'text' },
    content: { control: 'text' },
    icon: {
      control: 'select',
      options: ['great-gold-wyrm'],
    }
  },
};

const Template = (args) => ({
  components: { IconBackground },
  setup() {
    return { args };
  },
  template: '<icon-background v-bind="args" />',
});

export const GreatGoldWyrm = Template.bind({});
GreatGoldWyrm.args = {
  header: 'The Great Gold Wyrm\'s Mirror',
  content: `<p>Risus arcu tellus dictum congue potenti elementum blandit vehicula porttitor suspendisse. Laoreet feugiat consectetuer ornare primis justo pellentesque letius. Maximus aliquam sociosqu curae justo ante tristique. Arcu fusce integer montes at facilisi proin neque sollicitudin faucibus. Dui quam convallis vulputate est donec natoque hac tristique sodales.</p>
    <p>Pede nunc libero vulputate elementum tempor tellus. Luctus sed faucibus est sollicitudin velit dictum congue. Habitant turpis conubia quis himenaeos egestas arcu. Dapibus maecenas blandit nascetur mollis scelerisque. Consequat euismod tempor iaculis suscipit dui odio tortor curae convallis libero nisl. Sagittis mattis sit quam cubilia montes. Pulvinar dignissim cubilia porta lectus proin aenean ultrices bibendum letius class.</p>`,
  icon: 'great-gold-wyrm'
};