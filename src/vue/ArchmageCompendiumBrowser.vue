<template>
  <div :class="`archmage-v2-vue flexcol ${nightmode}`">
    <section class="container container--bottom flexrow">

      <section class="section section--sidebar flexcol filters">
        <div class="unit unit--input">
          <label class="unit-title" for="compendiumBrowser.name">Name</label>
          <input type="text" id="compendiumBrowser.name" name="compendiumBrowser.name" v-model="name"/>
        </div>

        <div class="unit unit--input">
          <label class="unit-title" for="compendiumBrowser.level">Level</label>
          <input type="number" min="0" id="compendiumBrowser.level" name="compendiumBrowser.level" v-model="level"/>
        </div>

        <div class="unit unit--input">
          <label class="unit-title" for="compendiumBrowser.type">Type</label>
          <select name="compendiumBrowser.type" id="compendiumBrowser.type" v-model="type">
            <option value="">-</option>
            <option v-for="(option, index) in CONFIG.ARCHMAGE.creatureTypes" :key="index" :value="index">{{ option }}</option>
          </select>
        </div>

        <div class="unit unit--input">
          <label class="unit-title" for="compendiumBrowser.role">Role</label>
          <select name="compendiumBrowser.role" id="compendiumBrowser.role" v-model="role">
            <option value="">-</option>
            <option v-for="(option, index) in CONFIG.ARCHMAGE.creatureRoles" :key="index" :value="index">{{ option }}</option>
          </select>
        </div>

        <div class="unit unit--input">
          <label class="unit-title" for="compendiumBrowser.size">Size</label>
          <select name="compendiumBrowser.size" id="compendiumBrowser.size" v-model="size">
            <option value="">-</option>
            <option v-for="(option, index) in CONFIG.ARCHMAGE.creatureSizes" :key="index" :value="index">{{ option }}</option>
          </select>
        </div>
      </section>

      <section class="section section--main flexcol">
        <ul class="compendium-browser-results">
          <li v-for="(entry, entryKey) in entries" :key="entryKey" class="compendium-browser-row flexrow" :data-id="entry._id" @click="openDocument(entry._id)">
            <img :src="entry.img"/>
            <div class="grid grid-4col">
              <strong class="grid-span-4">{{ entry?.name }}</strong>
              <div>Level {{ entry?.system?.attributes?.level?.value }}</div>
              <div>{{ CONFIG.ARCHMAGE.creatureTypes[entry?.system?.details?.type?.value] }}</div>
              <div>{{ CONFIG.ARCHMAGE.creatureRoles[entry?.system?.details?.role?.value] }}</div>
              <div>{{ CONFIG.ARCHMAGE.creatureSizes[entry?.system?.details?.size?.value] }}</div>
            </div>
          </li>
        </ul>
      </section>

    </section>
  </div>
</template>

<script>

export default {
  name: 'ArchmageCompendiumBrowser',
  props: [`context`],
  components: {},
  setup() {
    return {
      CONFIG,
      game
    }
  },
  data() {
    return {
      name: '',
      level: null,
      type: '',
      role: '',
      size: '',
    }
  },
  methods: {
    openDocument(id) {
      let pack = game.packs.get('archmage.srd-Monsters');
      pack.getDocument(id).then(document => {
        document.sheet.render(true);
        console.log(document);
      });
    }
  },
  computed: {
    nightmode() {
      return game.settings.get("archmage", "nightmode") ? 'nightmode' : '';
    },
    entries() {
      let result = this.context.srdMonsters.contents;

      if (this.name && this.name.length > 0) {
        console.log('Name filter');
        const name = this.name.toLocaleLowerCase();
        result = result.filter(entry => entry.name.toLocaleLowerCase().includes(name));
      }

      if (this.level && Number.isInteger(this.level)) {
        console.log('Level filter');
        result = result.filter(entry => entry.system.attributes.level.value == this.level);
      }

      if (this.type && this.type.length > 0) {
        console.log('Type filter');
        result = result.filter(entry => entry.system.details.type.value == this.type);
      }

      if (this.role && this.role.length > 0) {
        console.log('Role filter');
        result = result.filter(entry => entry.system.details.role.value == this.role);
      }

      if (this.size && this.size.length > 0) {
        console.log('Size filter');
        result = result.filter(entry => entry.system.details.size.value == this.size);
      }

      return result.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
      // @todo do we need to make a pager for performance?
      // }).slice(0, 25);
    }
  },
  watch: {},
  async created() {
    console.log("Creating compendium browser...");
  },
  async mounted() {
    console.log("Compendium browser mounted.");
  }
}
</script>

<style lang="scss">
</style>