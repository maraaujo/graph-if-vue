<script setup>
import avatar1 from '@images/avatars/avatar-1.png'
import avatar2 from '@images/avatars/avatar-2.png'
import avatar3 from '@images/avatars/avatar-3.png'
import avatar4 from '@images/avatars/avatar-4.png'
import avatar5 from '@images/avatars/avatar-5.png'

const people = [
  {
    name: 'Sandra Adams',
    group: 'Group 1',
    avatar: avatar1,
  },
  {
    name: 'Ali Connors',
    group: 'Group 1',
    avatar: avatar2,
  },
  {
    name: 'Trevor Hansen',
    group: 'Group 1',
    avatar: avatar3,
  },
  {
    name: 'Tucker Smith',
    group: 'Group 1',
    avatar: avatar2,
  },
  {
    name: 'Britta Holt',
    group: 'Group 2',
    avatar: avatar4,
  },
  {
    name: 'Jane Smith ',
    group: 'Group 2',
    avatar: avatar5,
  },
  {
    name: 'John Smith',
    group: 'Group 2',
    avatar: avatar1,
  },
  {
    name: 'Sandra Williams',
    group: 'Group 2',
    avatar: avatar3,
  },
]

const friends = ref([])
</script>

<template>
  <VCombobox
    v-model="friends"
    :items="people"
    chips
    closable-chips
    item-title="name"
    item-value="name"
    label="Select"
    multiple
  >
    <template #chip="{ props, item }">
      <VChip
        v-bind="props"
        :prepend-avatar="item.raw.avatar"
        :text="item.raw.name"
      />
    </template>

    <template #item="{ props, item }">
      <VListItem
        v-bind="props"
        :prepend-avatar="item?.raw?.avatar"
        :title="item?.raw?.name"
        :subtitle="item?.raw?.group"
      />
    </template>
  </VCombobox>
</template>
