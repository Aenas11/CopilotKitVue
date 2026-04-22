# copilotkit-vue

Vue 3 native bindings for CopilotKit.

## Install

```bash
pnpm add copilotkit-vue
```

## Use

```vue
<script setup lang="ts">
import { CopilotKitProvider, useAgent, CopilotChat } from "copilotkit-vue";
import "copilotkit-vue/styles";

const { agent } = useAgent({ agentId: "my_agent" });
</script>

<template>
  <CopilotKitProvider runtime-url="/api/copilotkit">
    <CopilotChat />
  </CopilotKitProvider>
</template>
```

## Styles

The package also exposes `copilotkit-vue/styles` for the base stylesheet.
