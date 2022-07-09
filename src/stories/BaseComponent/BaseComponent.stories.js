import BaseComponent from './BaseComponent.vue';

export default {
  title: 'BaseComponent',
  component: BaseComponent,
  argTypes: {
    header: { control: 'text' },
    content: { control: 'text' },
  },
};

const Template = (args) => ({
  components: { BaseComponent },
  setup() {
    return { args };
  },
  template: '<base-component v-bind="args" />',
});

export const Foobar = Template.bind({});
Foobar.args = {
  header: 'Title',
  content: '<p>Lorem ipsum dolor sit amet.</p>',
};