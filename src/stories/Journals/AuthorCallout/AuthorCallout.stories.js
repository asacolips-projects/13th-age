import AuthorCallout from './AuthorCallout.vue';

export default {
  title: 'Journals/AuthorCallout',
  component: AuthorCallout,
  argTypes: {
    author: { control: 'text' },
    header: { control: 'text' },
    content: { control: 'text' },
  },
};

const Template = (args) => ({
  components: { AuthorCallout },
  setup() {
    return { args };
  },
  template: '<author-callout v-bind="args" />',
});

export const Rob = Template.bind({});
Rob.args = {
  author: 'Rob Heinsoo',
  content: `<p>A senectus euismod non cubilia ac porta mi. Efficitur scelerisque dictumst turpis orci nullam congue pretium ut metus tellus. Penatibus ultrices porttitor per ridiculus risus aptent aliquam tortor luctus. Parturient orci lacinia nulla platea ac. Tincidunt pede eleifend eu et leo augue tortor sem sapien ultrices consectetuer. At proin ligula arcu platea ultricies.</p>
    <p>Enim tortor nisi consectetur odio aptent. Habitant risus ornare ipsum mus magnis rutrum purus consectetur diam congue lobortis. Praesent urna nostra lacinia phasellus non. Quam iaculis euismod risus mi ex velit. Elementum accumsan elit auctor sem consectetuer leo magna ipsum laoreet torquent. Felis consectetuer efficitur si faucibus euismod.</p>`,
};

export const Jonathan = Template.bind({});
Jonathan.args = {
  author: 'Jonathan Tweet',
  content: `<p>Enim tortor nisi consectetur odio aptent. Habitant risus ornare ipsum mus magnis rutrum purus consectetur diam congue lobortis. Praesent urna nostra lacinia phasellus non. Quam iaculis euismod risus mi ex velit. Elementum accumsan elit auctor sem consectetuer leo magna ipsum laoreet torquent. Felis consectetuer efficitur si faucibus euismod.</p>
    <p>A senectus euismod non cubilia ac porta mi. Efficitur scelerisque dictumst turpis orci nullam congue pretium ut metus tellus. Penatibus ultrices porttitor per ridiculus risus aptent aliquam tortor luctus. Parturient orci lacinia nulla platea ac. Tincidunt pede eleifend eu et leo augue tortor sem sapien ultrices consectetuer. At proin ligula arcu platea ultricies.</p>`,
};