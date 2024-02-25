<template>
  <ul class="pager">
    <li class="pager-first"><button type="button" @click="updateCurrent" :data-page="1">«</button></li>
    <li class="pager-prev"><button type="button" @click="updateCurrent" :data-page="Math.max(parseInt(pager.current) - 1, 1)">&lt;</button></li>
    <li v-for="page in parseInt(pageCount)" :class="`pager-page${ pager.current == page ? ' pager-active' : ''}`">
      <button type="button" @click="updateCurrent" :data-page="page">{{ page }}</button>
    </li>
    <li class="pager-next"><button type="button" @click="updateCurrent" :data-page="Math.min(parseInt(pager.current) + 1, pageCount)">&gt;</button></li>
    <li class="pager-last"><button type="button" @click="updateCurrent" :data-page="pageCount">»</button></li>
  </ul>
</template>

<script>
  export default {
    name: 'Pager',
    props: ['total-rows', 'per-page', 'pager'],
    data() {
      return {}
    },
    methods: {
      updateCurrent(event = null) {
        this.pager.current = event
          ? event.target.dataset.page
          : (this.pager.current ?? 1);

        if (this.pager.current > this.pager.pages) {
          this.pager.current = this.pager.pages;
        }

        this.pager.firstIndex = (this.pager.current - 1) * this.pager.perPage;
        this.pager.lastIndex = (this.pager.current * this.pager.perPage) - 1;

        if (this.pager.current == this.pager.pages) {
          this.pager.lastIndex = this.totalRows;
        }
      }
    },
    computed: {
      pageCount() {
        const count = this.totalRows / this.perPage;
        const pageCount = Number.isInteger(count) ? count : Math.floor(count) + 1;
        this.pager.pages = pageCount;

        this.updateCurrent();

        return pageCount;
      }
    },
    async created() {
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
    padding: 0;

    button,
    span {
      padding: 0 12px;
    }
  }

  .pager-active {
    opacity: 0.7;
  }
}
</style>