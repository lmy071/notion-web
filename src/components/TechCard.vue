<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useMouseInElement } from '@vueuse/core';

const target = ref(null);
const { elementX, elementY, isOutside, elementHeight, elementWidth } = useMouseInElement(target);

const cardStyle = ref({
  transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
  transition: 'transform 0.1s ease-out'
});

const glowStyle = ref({
  opacity: 0,
  left: '0px',
  top: '0px'
});

const handleMouseMove = () => {
  if (isOutside.value) {
    cardStyle.value.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    glowStyle.value.opacity = 0;
    return;
  }

  const rotateX = ((elementY.value / elementHeight.value) - 0.5) * -10;
  const rotateY = ((elementX.value / elementWidth.value) - 0.5) * 10;

  cardStyle.value.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  
  glowStyle.value = {
    opacity: 1,
    left: `${elementX.value}px`,
    top: `${elementY.value}px`,
    background: `radial-gradient(circle at center, var(--primary-glow) 0%, transparent 70%)`
  };
};

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
});
</script>

<template>
  <div 
    ref="target"
    class="tech-card glass"
    :style="cardStyle"
  >
    <div class="glow" :style="glowStyle"></div>
    <div class="content">
      <slot></slot>
    </div>
    <div class="border-effect"></div>
  </div>
</template>

<style scoped>
.tech-card {
  position: relative;
  padding: 2rem;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.3s ease;
  cursor: pointer;
}

.tech-card:hover {
  border-color: var(--primary);
}

.glow {
  position: absolute;
  width: 300px;
  height: 300px;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 0;
  transition: opacity 0.3s ease;
}

.content {
  position: relative;
  z-index: 1;
}

.border-effect {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid transparent;
  background: linear-gradient(var(--primary), var(--secondary)) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: destination-out;
  mask-composite: exclude;
  opacity: 0.1;
  transition: opacity 0.3s ease;
}

.tech-card:hover .border-effect {
  opacity: 0.5;
}
</style>
