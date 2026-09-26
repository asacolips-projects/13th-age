<template>
  <div :class="concat('progress-bar progress-bar--', name)">
    <div class="progress-track"></div>
    <div :class="getProgressClass(current)" :style="{width: getProgressPercent(current, realMax)}"></div>
    <div v-if="temp" :class="getProgressClass(temp, 'temp', current)" :style="{width: getProgressPercent(temp, realMax), left: getProgressPercent(current, realMax)}"></div>
  </div>
</template>

<script>
import { concat } from '@/methods/Helpers.js';
export default {
  name: 'Progress',
  props: ['current', 'temp', 'max', 'name'],
  setup() {
    return {
      concat
    }
  },
  data() {
    return {}
  },
  computed: {
    realMax() {
      let temp = this.temp ? this.temp : 0;
      return Math.max(this.max, this.current + temp);
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
  }
}
</script>

<style scoped lang="scss">
.progress-bar {
  width: 100%;
  height: 8px;
  margin: $padding-sm 0;
  border-radius: 50px;
  overflow: hidden;
  position: relative;
  border: 1px solid var(--c-black--50, #00000080);

  .progress-track,
  .progress-current,
  .progress-temp {
    background: var(--c-black--15, #00000026);
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
  }

  .progress-current,
  .progress-temp {
    right: auto;
    width: 100%;
    transition: all ease-in-out 0.25s;
    background-color: var(--c-progress-full, #41c179);
    border-radius: 50px;
    overflow: hidden;
    z-index: 3;
    border-right: 1px solid var(--c-black--50, #00000080);

    &.progress-hurt {
      background-color: var(--c-progress-hurt, #f7d601);
    }

    &.progress-staggered {
      background-color: var(--c-progress-staggered, #f78c01);
    }

    &.progress-dire {
      background-color: var(--c-progress-dire, #ca0000);
    }
  }

  .progress-temp {
    opacity: 0.25;
    border-radius: 0 50px 50px 0;
    overflow: visible;
    z-index: 2;

    &::before {
      content: '';
      display: block;
      position: absolute;
      top: 0;
      bottom: 0;
      width: 4px;
      right: 100%;
    }

    &.progress-full::before {
      background-color: var(--c-progress-full, #41c179);
    }

    &.progress-hurt::before {
      background-color: var(--c-progress-hurt, #f7d601);
    }

    &.progress-staggered::before {
      background-color: var(--c-progress-staggered, #f78c01);
    }

    &.progress-dire::before {
      background-color: var(--c-progress-dire, #ca0000);
    }
  }
}
</style>