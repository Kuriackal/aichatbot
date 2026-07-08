<script lang="ts">
	import { FileText, User, Bot } from 'lucide-svelte';
	
	let { message } = $props();
	
	let showSources = $state(false);

	function parseMarkdown(text: string) {
		if (!text) return '';
		return text
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			.replace(/\n/g, '<br/>');
	}
</script>

<div class="flex gap-4 group">
	<div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 {message.role === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-primary-100 text-primary-700'}">
		{#if message.role === 'user'}
			<User size={16} />
		{:else}
			<Bot size={16} />
		{/if}
	</div>
	
	<div class="flex-1 space-y-2 min-w-0">
		<div class="prose prose-sm max-w-none text-gray-800 leading-relaxed">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html parseMarkdown(message.content)}
		</div>
		

	</div>
</div>
