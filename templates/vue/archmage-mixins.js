export default archmageMixin = {
  methods: {
    getSafeValue(property, defaultValue) {
      if (property) return property.value;
      return defaultValue;
    },
    localize(key) {
      return game.i18n.localize(key);
    }
  }
}