<script lang="ts">
	import ChatWindow from '$lib/components/chat/ChatWindow.svelte';
	let { data } = $props();
</script>

{#key data.conversationId}
	<ChatWindow messages={data.messages} conversationId={data.conversationId} />
{/key}
