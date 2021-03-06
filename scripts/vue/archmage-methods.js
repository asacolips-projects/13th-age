window.archmageVueMethods = {
  methods: {
    getSafeValue(property, defaultValue) {
      if (property) return property.value;
      return defaultValue;
    },
    localize(key) {
      return game.i18n.localize(key);
    },
    numberFormat(value, dec = 0, sign = false) {
      value = parseFloat(value).toFixed(dec);
      if (sign ) return ( value >= 0 ) ? `+${value}` : value;
      return value;
    }
  }
}