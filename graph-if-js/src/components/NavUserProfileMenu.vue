<script setup>
import avatar from '@images/avatars/avatar-6.png'

const user = ref()

onMounted(() => user.value = localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')) : {})
</script>

<template>
 
    

</template>
