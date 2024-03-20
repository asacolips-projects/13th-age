<template>
  <ul :class="`pager pager-style-${pagerOptions.style}`">
    <li class="pager-page pager-first"><button type="button" @click="updateCurrent" :data-page="1" title="First page">«<span class="visually-hidden"> First page</span></button></li>
    <li class="pager-page pager-prev"><button type="button" @click="updateCurrent" :data-page="Math.max(parseInt(pagerOptions.current) - 1, 1)" title="Previous page">&lt;<span class="visually-hidden"> Previous page</span></button></li>
    <template v-if="pagerOptions.style == 'buttons'">
      <li v-for="page in parseInt(pageCount)" :class="`pager-page pager-page-n${ pagerOptions.current == page ? ' pager-active' : ''}`">
        <button type="button" @click="updateCurrent" :data-page="page">{{ page }}</button>
      </li>
    </template>
    <template v-else>
      <li class="pager-page pager-numeric">
        <div class="flexrow"><input type="number" class="pager-input" v-model="pagerOptions.current" min="1" :max="pageCount"/> of <strong class="pager-max">{{ pageCount }}</strong></div>
      </li>
    </template>
    <li class="pager-page pager-next"><button type="button" @click="updateCurrent" :data-page="Math.min(parseInt(pagerOptions.current) + 1, pageCount)" title="Next page">&gt;<span class="visually-hidden"> Next page</span></button></li>
    <li class="pager-page pager-last"><button type="button" @click="updateCurrent" :data-page="pageCount" title="Last page">»<span class="visually-hidden"> Last page</span></button></li>
  </ul>
</template>

<script>
  /**
   * Pager component.
   *
   * To use, include in your template as <Pager :pager-options="pager-options"/>.
   *
   * The `pagerOptions` that gets passed into the component should be an object
   * with the following properties. Each property should be an int, and all of them
   * excluding the perPage property will be recalculated into the parent component.
   *
   * current: 0,
   * pages: 0,
   * totalRows: 0,
   * perPage: 50,
   * firstIndex: 0,
   * lastIndex: 0
   */
  export default {
    name: 'Pager',
    props: ['pager-options'],
    data() {
      return {}
    },
    methods: {
      updateCurrent(event = null) {
        this.pagerOptions.current = event
          ? event.target.dataset.page
          : (this.pagerOptions.current ?? 1);

        if (this.pagerOptions.current > this.pagerOptions.pages) {
          this.pagerOptions.current = this.pagerOptions.pages;
        }

        if (this.pagerOptions.current < 1) {
          this.pagerOptions.current = 1;
        }

        this.pagerOptions.firstIndex = (this.pagerOptions.current - 1) * this.pagerOptions.perPage;
        this.pagerOptions.lastIndex = (this.pagerOptions.current * this.pagerOptions.perPage) - 1;

        if (this.pagerOptions.current == this.pagerOptions.pages) {
          this.pagerOptions.lastIndex = this.pagerOptions.totalRows;
        }
      }
    },
    computed: {
      pageCount() {
        const count = this.pagerOptions.totalRows / this.pagerOptions.perPage;
        const pageCount = Number.isInteger(count) ? count : Math.floor(count) + 1;
        this.pagerOptions.pages = pageCount;

        this.updateCurrent();

        return pageCount;
      }
    },
    async created() {
      // Run an initial pager flow calculation.
      this.updateCurrent();
    }
  }
</script>

<style lang="scss">
.archmage-vue {
  .pager {
    display: flex;
    list-style-type: none;
    margin: 0;
    padding: 8px 0 0;

    li {
      margin-right: 2px;
    }

    button,
    span {
      padding: 0 4px;
    }
  }

  .pager-style-input {
    max-width: 230px;

    .flexrow {
      justify-content: space-evenly;

      > * {
        flex: 0;
      }
    }

    button,
    span {
      padding: 0 12px;
    }

    .pager-input {
      border: 1px solid $c-black--75;
      border-radius: 4px;
      margin: 0;
      padding: 0 2px;
      line-height: 1;
      font-size: 16px;
    }
  }

  .pager-page {
    .flexrow {
      justify-content: space-around;
    }
  }

  .pager-active {
    opacity: 0.7;
  }
}
</style>