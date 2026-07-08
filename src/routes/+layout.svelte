<script lang="ts">
	import { page } from '$app/stores';
	import { LogOut, FileText, BarChart3, MessageSquare } from 'lucide-svelte';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Knowledge Base Chatbot</title>
</svelte:head>

{#if !$page.data.session}
	{@render children()}
{:else}
	<div class="flex h-screen overflow-hidden bg-gray-50">
		<aside class="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
			<div class="h-16 flex items-center px-6 border-b border-gray-200">
				<h1 class="text-xl font-bold text-gray-900 flex items-center gap-2">
					<MessageSquare size={24} class="text-primary" />
					KB Chat
				</h1>
			</div>
			
			<nav class="flex-1 overflow-y-auto p-4 space-y-1">
				<a href="/chat" class="flex items-center gap-3 px-3 py-2 rounded-md transition-colors {$page.url.pathname.startsWith('/chat') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}">
					<MessageSquare size={20} />
					Chat
				</a>
				
				{#if $page.data.profile?.role === 'admin'}
					<div class="pt-4 pb-2">
						<p class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</p>
					</div>
					<a href="/admin/documents" class="flex items-center gap-3 px-3 py-2 rounded-md transition-colors {$page.url.pathname === '/admin/documents' ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}">
						<FileText size={20} />
						Documents
					</a>
					<a href="/admin/stats" class="flex items-center gap-3 px-3 py-2 rounded-md transition-colors {$page.url.pathname === '/admin/stats' ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}">
						<BarChart3 size={20} />
						Usage Stats
					</a>
				{/if}
			</nav>

			<div class="p-4 border-t border-gray-200">
				<div class="flex items-center gap-3 mb-4 px-2">
					<div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold uppercase">
						{$page.data.user?.email?.[0]}
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-gray-900 truncate">{$page.data.user?.email}</p>
						<p class="text-xs text-gray-500 capitalize">{$page.data.profile?.role || 'User'}</p>
					</div>
				</div>
				<form action="/login?/logout" method="POST">
					<button class="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
						<LogOut size={16} />
						Sign out
					</button>
				</form>
			</div>
		</aside>

		<main class="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
			{@render children()}
		</main>
	</div>
{/if}
