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
		
		{#if message.role === 'assistant' && message.used_chunks && message.used_chunks.length > 0}
			<div class="mt-3">
				<button 
					onclick={() => showSources = !showSources}
					class="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
				>
					<FileText size={14} />
					{showSources ? 'Hide Sources' : 'View Sources'} ({message.used_chunks.length})
				</button>
				
				{#if showSources}
					<div class="mt-3 space-y-2">
						{#each message.used_chunks as chunk, i}
							<div class="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-100 shadow-sm">
								<p class="font-semibold text-gray-800 mb-1 flex items-center gap-2">
									<span class="bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">[{i + 1}]</span>
									{chunk.filename}
								</p>
								<p class="line-clamp-3 italic opacity-90">"{chunk.content}"</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
