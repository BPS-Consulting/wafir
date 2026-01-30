<script setup lang="ts">
import { ref, watchEffect, onMounted } from "vue";
import "wafir";

export type WafirPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

export interface WafirWidgetProps {
  /** URL to the wafir configuration file (JSON or YAML) */
  configUrl: string;
  /** Custom bridge server URL (for self-hosted bridge) */
  bridgeUrl?: string;
  /** Widget button position */
  position?: WafirPosition;
  /** Modal title text */
  modalTitle?: string;
  /** Tooltip text for the trigger button */
  tooltipText?: string;
  /** Optional button text (shows instead of icon) */
  buttonText?: string;
}

interface WafirWidgetElement extends HTMLElement {
  configUrl?: string;
  bridgeUrl?: string;
  position?: string;
  modalTitle?: string;
  tooltipText?: string;
  buttonText?: string;
}

const props = withDefaults(defineProps<WafirWidgetProps>(), {
  position: "bottom-right",
});

const elementRef = ref<WafirWidgetElement | null>(null);

onMounted(() => {
  watchEffect(() => {
    if (elementRef.value) {
      elementRef.value.configUrl = props.configUrl;
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
  <component :is="'wafir-widget'" ref="elementRef">
    <template v-if="$slots.default">
      <div slot="trigger">
        <slot></slot>
      </div>
    </template>
  </component>
</template>
