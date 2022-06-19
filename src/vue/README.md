## Compiling

To compile the components, run the following from the root directory of this repo:

```bash
npm install
npm run build # or `npm run vite:build` for just vue components
npm run watch # or `npm run vite:watch` for just vue components
```

## Organization

The main character sheet applications are defined at the top level of the
`src/vue` directory. Those are currently:

- `ArchmageCharacterSheet.vue`
- `ArchmageNpcSheet.vue` (todo)

Within those applications, components are imported and must also be included in
the `components` property of the app export.

Main application components should also be included in `index.js` so that
they're exported for usage in Foundry classes.

### components/

The components directory includes `.vue` files used for components that build up
the character sheets. This is currently subdivided as follows:

- actor - Components for actors
    - character - Components for characters specifically. Also divided based on
       layout region.
    - npc - (todo) Components for NPCs specifically. Also divided based on
      layout region.
- parts - General purpose components that are intended for re-use (Tabs, Editor,
  and so forth).

### methods/

Methods that are widely used across components, such as localization and number
formatting, can be placed here.

## Importing and exporting

This configuration uses native ES modules, and as such, components and methods
are not globally available. Each vue file should have a `default` export in it
which is used when importing it. To import a file, use the following syntax:

`import Tab from '@/components/parts/Tab.vue';`

And then in the component your defining, include a component property:

```js
import Editor from '@/components/parts/Editor.vue';
export default {
  name: 'CharDetails',
  props: ['actor'],
  components: {
    Editor
  }
}
```

### @/ path alias

This build configuration includes an alias for `@/` that maps to `src/vue/`. If
you need to import a component at `src/vue/components/actor/main/CharDetails.vue`,
you can instead use `@/components/actor/main/CharDetails.vue`, regardles of
where you currently are in the file system.

## Component syntax

Vue files should be structured as follows:

```vue
<template>
  <div class="foobar">
    <div>{{actor._id}}</div>
    <SomeOtherComponent :actor="actor" :flags="flags"/>
  </div>
</template>

<script>
  import SomeOtherComponent from '@/components/parts/SomeOtherComponent.vue';
  export default {
    name: 'MyComponent',
    props: ['actor', 'flags'],
    components: {
      SomeOtherComponent
    }
  }
</script>

<style lang="scss" scoped>
  .my-component {
    strong {
      color: #6e6e6e;
    }
  }
</style>
```

There's also a `<script setup>` way to declare components, but it shouldn't be
used (yet). There's an issue with components created that way coming through as
AnonymousComponent in browser dev tools, so defining components with the short
setup syntax will make debugging more difficult.

### Composition API

Most of the components still use Vue 2 component definitions, such as the `data`
property, `computed` property, and so forth. However, you can also use the
composition API via the `setup` property for more advanced component
defintions.

For an example of a component that uses the Composition API, see the
`@/components/actor/character/main/CharEffects.vue` component.