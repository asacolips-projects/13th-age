<template>
  <div :class="concat('progress-bar progress-bar--', name)">
    <div class="progress-track"></div>
    <div :class="getProgressClass(current)" :style="{width: getProgressPercent(current, realMax)}"></div>
    <div v-if="temp" :class="getProgressClass(temp, 'temp', current)" :style="{width: getProgressPercent(temp, realMax), left: getProgressPercent(current, realMax)}"></div>
  </div>
</template>

<script>
export default {
  props: ['current', 'temp', 'max', 'name'],
  data: () => ({}),
  computed: {
    realMax() {
      return Math.max(this.max, this.current + this.temp);
    }
  },
  methods: {
    getProgressClass(value, modifier = 'current', value2 = 0) {
      let percent = this.getProgressPercent((Number(value) + value2), this.max, false);
      let level = 'full';

      if (percent > 75) {
        level = 'full';
      }
      else if (percent > 50) {
        level = 'hurt';
      }
      else if (percent > 25) {
        level = 'staggered';
      }
      else {
        level = 'dire';
      }

      return `progress-${modifier} progress-${level}`;
    },
    getProgressPercent(value, value2, includeSign = true) {
      let percent = Math.ceil(100 * (value / Math.max(1, value2)));

      if (percent > 100) percent = 100;
      else if (percent < 0) percent = 0;

      return includeSign ? `${percent}%` : percent;
    }
  },
  async created() {
    for (let [k,v] of Object.entries(window.archmageVueMethods.methods)) {
      this[k] = v;
    }
  },
  async mounted() {}
}
</script>