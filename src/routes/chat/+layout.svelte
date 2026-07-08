<script lang="ts">
	import { page } from '$app/stores';
	import { MessageSquarePlus, MessageSquare, Trash2 } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let { data, children } = $props();

	async function deleteConv(id: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		if (!confirm('Delete this conversation?')) return;
		
		const res = await fetch(`/api/conversations?id=${id}`, { method: 'DELETE' });
		if (res.ok) {
			await invalidateAll();
			if ($page.params.conversationId === id) {
				window.location.href = '/chat';
			}
		}
	}
</script>

<div class="flex h-full w-full bg-white">
	<div class="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
		<div class="p-4">
			<a href="/chat" class="flex items-center gap-2 w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm justify-center font-medium">
				<MessageSquarePlus size={18} />
				New Chat
			</a>
		</div>
		
		<div class="flex-1 overflow-y-auto p-2 space-y-1">
			<h3 class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">Recent Chats</h3>
			{#each data.conversations as conv}
				<a href="/chat/{conv.id}" class="group flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors {$page.params.conversationId === conv.id ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-200'}">
					<div class="flex items-center gap-2 overflow-hidden">
						<MessageSquare size={16} class="flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
						<span class="truncate">{conv.title || 'New Chat'}</span>
					</div>
					<button onclick={(e) => deleteConv(conv.id, e)} class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-opacity p-1">
						<Trash2 size={14} />
					</button>
				</a>
			{:else}
				<p class="px-3 text-sm text-gray-500 text-center py-4">No recent chats.</p>
			{/each}
		</div>
	</div>

	<div class="flex-1 flex flex-col min-w-0 bg-white relative">
		{@render children()}
	</div>
</div>
