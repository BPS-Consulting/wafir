<script setup lang="ts">
import { ref, watchEffect, onMounted } from "vue";
import "wafir";

export type WafirPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

export interface WafirReporterProps {
  installationId: number;
  owner: string;
  repo: string;
  bridgeUrl?: string;
  position?: WafirPosition;
  modalTitle?: string;
  tooltipText?: string;
  buttonText?: string;
}

interface WafirReporterElement extends HTMLElement {
  installationId?: number;
  owner?: string;
  repo?: string;
  bridgeUrl?: string;
  position?: string;
  modalTitle?: string;
  tooltipText?: string;
  buttonText?: string;
}

const props = withDefaults(defineProps<WafirReporterProps>(), {
  position: "bottom-right",
});

const elementRef = ref<WafirReporterElement | null>(null);

onMounted(() => {
  watchEffect(() => {
    if (elementRef.value) {
      elementRef.value.installationId = props.installationId;
      elementRef.value.owner = props.owner;
      elementRef.value.repo = props.repo;
      if (props.bridgeUrl) elementRef.value.bridgeUrl = props.bridgeUrl;
      if (props.position) elementRef.value.position = props.position;
      if (props.modalTitle) elementRef.value.modalTitle = props.modalTitle;
      if (props.tooltipText) elementRef.value.tooltipText = props.tooltipText;
      if (props.buttonText) elementRef.value.buttonText = props.buttonText;
    }
  });
});
</script>

<template>
  <component :is="'wafir-reporter'" ref="elementRef">
    <template v-if="$slots.default">
      <div slot="trigger">
        <slot></slot>
      </div>
    </template>
  </component>
</template>
