<template>
  <ul class="pager">
    <li class="pager-first"><button type="button" :data-page="0">«</button></li>
    <li class="pager-prev"><button type="button">&lt;</button></li>
    <li v-for="page in parseInt(pages)"><button type="button" :data-page="page">{{ page }}</button></li>
    <li class="pager-next"><button type="button">&gt;</button></li>
    <li class="pager-last"><button type="button" :data-page="pages">»</button></li>
  </ul>
</template>

<script>
  export default {
    name: 'Pager',
    props: ['total-rows', 'per-page'],
    computed: {
      pages() {
        const count = this.totalRows / this.perPage;
        return Number.isInteger(count) ? count : count + 1;
      }
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
}
</style>