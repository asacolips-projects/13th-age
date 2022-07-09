import JournalPage from './JournalPage.vue';

export default {
  title: 'Journals/JournalPage',
  component: JournalPage,
  argTypes: {
    header: { control: 'text' },
    content: { control: 'text' },
  },
};

const Template = (args) => ({
  components: { JournalPage },
  setup() {
    return { args };
  },
  template: '<journal-page v-bind="args" />',
});


export const SampleContent = Template.bind({});
SampleContent.args = {
  header: 'Title',
  content: `<p>Consectetuer ornare per nulla aliquet senectus fringilla. Mi odio nunc rhoncus placerat dignissim pharetra scelerisque venenatis proin sollicitudin. Semper maximus cubilia aliquet fermentum hendrerit consectetuer adipiscing. Nunc montes felis velit ullamcorper lacinia turpis nulla nostra maximus. Mollis arcu felis montes vehicula aenean maximus sociosqu sed mauris. Ullamcorper eget nisl ornare nam nunc faucibus non. Cubilia ridiculus aenean aliquet porta urna est eget commodo nullam congue.</p>`
};

export const SampleSections = Template.bind({});
SampleSections.args = {
  header: 'The Dragon Empire',
  // content: '<p>Lorem ipsum dolor sit amet.</p>',
  sections: [
    {
      content: `<p>Consectetuer ornare per nulla aliquet senectus fringilla. Mi odio nunc rhoncus placerat dignissim pharetra scelerisque venenatis proin sollicitudin. Semper maximus cubilia aliquet fermentum hendrerit consectetuer adipiscing. Nunc montes felis velit ullamcorper lacinia turpis nulla nostra maximus. Mollis arcu felis montes vehicula aenean maximus sociosqu sed mauris. Ullamcorper eget nisl ornare nam nunc faucibus non. Cubilia ridiculus aenean aliquet porta urna est eget commodo nullam congue.</p>`
    },
    {
      header: 'The Three Worlds',
      heading: 'h2',
      content: `<p>Consectetuer ornare per nulla aliquet senectus fringilla. Mi odio nunc rhoncus placerat dignissim pharetra scelerisque venenatis proin sollicitudin. Semper maximus cubilia aliquet fermentum hendrerit consectetuer adipiscing. Nunc montes felis velit ullamcorper lacinia turpis nulla nostra maximus. Mollis arcu felis montes vehicula aenean maximus sociosqu sed mauris. Ullamcorper eget nisl ornare nam nunc faucibus non. Cubilia ridiculus aenean aliquet porta urna est eget commodo nullam congue.</p>`
    },
    {
      header: 'The Land',
      heading: 'h3',
      content: `<p>Consectetuer ornare per nulla aliquet senectus fringilla. Mi odio nunc rhoncus placerat dignissim pharetra scelerisque venenatis proin sollicitudin. Semper maximus cubilia aliquet fermentum hendrerit consectetuer adipiscing. Nunc montes felis velit ullamcorper lacinia turpis nulla nostra maximus. Mollis arcu felis montes vehicula aenean maximus sociosqu sed mauris. Ullamcorper eget nisl ornare nam nunc faucibus non. Cubilia ridiculus aenean aliquet porta urna est eget commodo nullam congue.</p>`
    },
    {
      header: 'The Underworld',
      heading: 'h3',
      content: `<p>Consectetuer ornare per nulla aliquet senectus fringilla. Mi odio nunc rhoncus placerat dignissim pharetra scelerisque venenatis proin sollicitudin. Semper maximus cubilia aliquet fermentum hendrerit consectetuer adipiscing. Nunc montes felis velit ullamcorper lacinia turpis nulla nostra maximus. Mollis arcu felis montes vehicula aenean maximus sociosqu sed mauris. Ullamcorper eget nisl ornare nam nunc faucibus non. Cubilia ridiculus aenean aliquet porta urna est eget commodo nullam congue.</p>`
    },
    {
      header: 'The Overworld',
      heading: 'h3',
      content: `<p>Consectetuer ornare per nulla aliquet senectus fringilla. Mi odio nunc rhoncus placerat dignissim pharetra scelerisque venenatis proin sollicitudin. Semper maximus cubilia aliquet fermentum hendrerit consectetuer adipiscing. Nunc montes felis velit ullamcorper lacinia turpis nulla nostra maximus. Mollis arcu felis montes vehicula aenean maximus sociosqu sed mauris. Ullamcorper eget nisl ornare nam nunc faucibus non. Cubilia ridiculus aenean aliquet porta urna est eget commodo nullam congue.</p>`
    },
    {
      header: 'A-Z Geography',
      heading: 'h2',
      content: `<p>Consectetuer ornare per nulla aliquet senectus fringilla. Mi odio nunc rhoncus placerat dignissim pharetra scelerisque venenatis proin sollicitudin. Semper maximus cubilia aliquet fermentum hendrerit consectetuer adipiscing. Nunc montes felis velit ullamcorper lacinia turpis nulla nostra maximus. Mollis arcu felis montes vehicula aenean maximus sociosqu sed mauris. Ullamcorper eget nisl ornare nam nunc faucibus non. Cubilia ridiculus aenean aliquet porta urna est eget commodo nullam congue.</p>`
    },
    {
      header: 'The Map is Not Complete',
      heading: 'h3',
      content: `<p>Consectetuer ornare per nulla aliquet senectus fringilla. Mi odio nunc rhoncus placerat dignissim pharetra scelerisque venenatis proin sollicitudin. Semper maximus cubilia aliquet fermentum hendrerit consectetuer adipiscing. Nunc montes felis velit ullamcorper lacinia turpis nulla nostra maximus. Mollis arcu felis montes vehicula aenean maximus sociosqu sed mauris. Ullamcorper eget nisl ornare nam nunc faucibus non. Cubilia ridiculus aenean aliquet porta urna est eget commodo nullam congue.</p>`
    }
  ]
};