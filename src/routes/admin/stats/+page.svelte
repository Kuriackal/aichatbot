<script lang="ts">
	import { Users, FileText, MessageSquare } from 'lucide-svelte';
	let { data } = $props();
</script>

<div class="p-8 max-w-6xl mx-auto space-y-8">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Usage Stats</h1>
		<p class="text-gray-500 mt-1">High-level metrics for the internal knowledge base.</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
			<div class="p-3 bg-blue-100 text-blue-600 rounded-lg">
				<Users size={24} />
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Total Users</p>
				<p class="text-2xl font-semibold text-gray-900">{data.stats.users}</p>
			</div>
		</div>
		
		<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
			<div class="p-3 bg-green-100 text-green-600 rounded-lg">
				<FileText size={24} />
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Total Documents</p>
				<p class="text-2xl font-semibold text-gray-900">{data.stats.documents}</p>
			</div>
		</div>

		<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
			<div class="p-3 bg-purple-100 text-purple-600 rounded-lg">
				<MessageSquare size={24} />
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Total Conversations</p>
				<p class="text-2xl font-semibold text-gray-900">{data.stats.conversations}</p>
			</div>
		</div>
	</div>
</div>
