<script lang="ts">
	import { Send, Loader2 } from 'lucide-svelte';
	import MessageBubble from './MessageBubble.svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { onMount, tick } from 'svelte';

	let { messages: initialMessages = [], conversationId = null } = $props();

	let messages = $state(initialMessages.map((m: any) => ({
		role: m.role,
		content: m.content,
		used_chunks: m.used_chunks
	})));
	
	let input = $state('');
	let loading = $state(false);
	let chatContainer: HTMLElement;

	async function scrollToBottom() {
		await tick();
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	onMount(() => {
		scrollToBottom();
	});

	async function handleSubmit() {
		if (!input.trim() || loading) return;
		
		const userMsg = input.trim();
		input = '';
		messages = [...messages, { role: 'user', content: userMsg, used_chunks: [] }];
		
		await scrollToBottom();
		loading = true;

		try {
			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages,
					conversationId
				})
			});

			if (!res.ok) throw new Error('Failed to fetch');

			const newConversationId = res.headers.get('X-Conversation-Id');
			
			messages = [...messages, { role: 'assistant', content: '', used_chunks: [] }];
			
			const reader = res.body?.getReader();
			const decoder = new TextDecoder();

			if (reader) {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					
					const chunk = decoder.decode(value, { stream: true });
					messages[messages.length - 1].content += chunk;
					await scrollToBottom();
				}
			}

			if (!conversationId && newConversationId) {
				await invalidateAll();
				goto(`/chat/${newConversationId}`);
			} else {
				await invalidateAll();
			}

		} catch (e) {
			console.error(e);
			messages = [...messages, { role: 'assistant', content: 'An error occurred while fetching the response.', used_chunks: [] }];
		} finally {
			loading = false;
			await scrollToBottom();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}
</script>

<div class="flex flex-col h-full bg-white relative">
	{#if messages.length === 0}
		<div class="flex-1 flex flex-col items-center justify-center p-8 text-center">
			<div class="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
				<Send size={32} />
			</div>
			<h2 class="text-2xl font-semibold text-gray-900 mb-2">How can I help you today?</h2>
			<p class="text-gray-500 max-w-md">Ask questions about company policies, internal guides, and documented knowledge.</p>
		</div>
	{:else}
		<div bind:this={chatContainer} class="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
			<div class="max-w-3xl mx-auto space-y-6">
				{#each messages as msg}
					<MessageBubble message={msg} />
				{/each}
				{#if loading && messages[messages.length-1].role === 'user'}
					<div class="flex items-center gap-3 text-gray-500 max-w-3xl mx-auto">
						<Loader2 class="w-5 h-5 animate-spin" />
						<span class="text-sm">Thinking...</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4">
		<div class="max-w-3xl mx-auto relative rounded-2xl shadow-sm border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-primary-500 transition-shadow">
			<textarea
				bind:value={input}
				onkeydown={handleKeydown}
				disabled={loading}
				placeholder="Ask a question about internal docs..."
				class="w-full bg-transparent border-0 resize-none rounded-2xl py-4 pl-4 pr-14 focus:ring-0 text-gray-900 placeholder:text-gray-400"
				rows="1"
				style="min-height: 56px; max-height: 200px;"
			></textarea>
			<button 
				onclick={handleSubmit} 
				disabled={!input.trim() || loading}
				class="absolute right-2 bottom-2 p-2 rounded-xl text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:hover:bg-primary-600 transition-colors"
			>
				{#if loading}
					<Loader2 class="w-5 h-5 animate-spin" />
				{:else}
					<Send class="w-5 h-5" />
				{/if}
			</button>
		</div>
		<p class="text-center text-xs text-gray-400 mt-3">Answers are generated based on uploaded company knowledge.</p>
	</div>
</div>
