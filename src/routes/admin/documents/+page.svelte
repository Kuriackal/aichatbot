<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Trash2, UploadCloud, File, CheckCircle2, XCircle, Loader2, Edit, Save, Plus } from 'lucide-svelte';

	let { data } = $props();
	
	let files: FileList | null = $state(null);
	let uploading = $state(false);
	let error = $state<string | null>(null);


	let activeTab = $state<'files' | 'qa'>('files');


	let newQuestion = $state('');
	let newAnswer = $state('');
	let savingQa = $state(false);
	let qaError = $state<string | null>(null);


	let editingQaId = $state<string | null>(null);
	let editQuestion = $state('');
	let editAnswer = $state('');
	let updatingQa = $state(false);

	async function uploadFiles() {
		if (!files || files.length === 0) return;
		
		uploading = true;
		error = null;
		
		for (let i = 0; i < files.length; i++) {
			const formData = new FormData();
			formData.append('file', files[i]);
			
			try {
				const res = await fetch('/api/documents/upload', {
					method: 'POST',
					headers: {
						'Accept': 'application/json'
					},
					body: formData
				});
				
				if (!res.ok) {
					let errorMessage = 'Upload failed';
					try {
						const data = await res.json();
						errorMessage = data.error || `Server returned ${res.status}: ${res.statusText}`;
					} catch (parseErr) {
						errorMessage = `Server error ${res.status}: ${res.statusText}`;
					}
					error = errorMessage;
				}
			} catch (e: any) {
				error = e.message || 'Network error occurred';
			}
		}
		
		files = null;
		uploading = false;
		await invalidateAll();
	}

	async function deleteDocument(id: string) {
		if (!confirm('Are you sure you want to delete this document?')) return;
		
		const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
		if (res.ok) {
			await invalidateAll();
		} else {
			alert('Failed to delete document');
		}
	}

	async function saveNewQa() {
		if (!newQuestion.trim() || !newAnswer.trim()) return;
		
		savingQa = true;
		qaError = null;

		try {
			const res = await fetch('/api/qa', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ question: newQuestion, answer: newAnswer })
			});

			if (res.ok) {
				newQuestion = '';
				newAnswer = '';
				await invalidateAll();
			} else {
				const data = await res.json();
				qaError = data.error || 'Failed to save Q&A';
			}
		} catch (e: any) {
			qaError = e.message || 'Server error';
		} finally {
			savingQa = false;
		}
	}

	function startEditQa(qa: any) {
		editingQaId = qa.id;
		editQuestion = qa.question;
		editAnswer = qa.answer;
	}

	function cancelEditQa() {
		editingQaId = null;
		editQuestion = '';
		editAnswer = '';
	}

	async function updateQa() {
		if (!editQuestion.trim() || !editAnswer.trim() || !editingQaId) return;

		updatingQa = true;
		try {
			const res = await fetch(`/api/qa/${editingQaId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ question: editQuestion, answer: editAnswer })
			});

			if (res.ok) {
				editingQaId = null;
				await invalidateAll();
			} else {
				alert('Failed to update Q&A');
			}
		} catch (e) {
			alert('Server error updating Q&A');
		} finally {
			updatingQa = false;
		}
	}

	async function deleteQa(id: string) {
		if (!confirm('Are you sure you want to delete this Q&A pair?')) return;
		
		const res = await fetch(`/api/qa/${id}`, { method: 'DELETE' });
		if (res.ok) {
			await invalidateAll();
		} else {
			alert('Failed to delete Q&A');
		}
	}
</script>

<div class="h-full w-full overflow-y-auto">
	<div class="p-8 max-w-6xl mx-auto space-y-8">
	<div class="flex justify-between items-end">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Knowledge Base Management</h1>
			<p class="text-gray-500 mt-1">Manage documents and manual Q&A pairs.</p>
		</div>
		
		<!-- Tabs -->
		<div class="flex bg-gray-100 p-1 rounded-lg">
			<button 
				onclick={() => activeTab = 'files'}
				class="px-4 py-2 text-sm font-medium rounded-md transition-colors {activeTab === 'files' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
			>
				Files
			</button>
			<button 
				onclick={() => activeTab = 'qa'}
				class="px-4 py-2 text-sm font-medium rounded-md transition-colors {activeTab === 'qa' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
			>
				Manual Q&A
			</button>
		</div>
	</div>

	{#if activeTab === 'files'}
		<!-- Upload Section -->
		<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
			<h2 class="text-lg font-medium text-gray-900 mb-4">Upload Documents</h2>
			
			{#if error}
				<div class="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
					{error}
				</div>
			{/if}

			<div class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors">
				<UploadCloud class="mx-auto h-12 w-12 text-gray-400" />
				<div class="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
					<label for="file-upload" class="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80">
						<span>Upload a file</span>
						<input id="file-upload" type="file" multiple class="sr-only" bind:files onchange={uploadFiles} disabled={uploading}>
					</label>
					<p class="pl-1">or drag and drop</p>
				</div>
				<p class="text-xs leading-5 text-gray-500">PDF, DOCX, TXT up to 10MB</p>
			</div>

			{#if uploading}
				<div class="mt-4 flex items-center justify-center text-sm text-gray-600">
					<Loader2 class="animate-spin mr-2 h-4 w-4" />
					Processing documents...
				</div>
			{/if}
		</div>

		<!-- List Section -->
		<div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chunks</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
						<th class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each data.documents || [] as doc}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<File class="h-5 w-5 text-gray-400 mr-3" />
									<div>
										<div class="text-sm font-medium text-gray-900">{doc.filename}</div>
										<div class="text-sm text-gray-500">{doc.profiles?.email || 'Unknown'}</div>
									</div>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								{#if doc.status === 'ready'}
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
										<CheckCircle2 class="w-3 h-3 mr-1" /> Ready
									</span>
								{:else if doc.status === 'processing'}
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
										<Loader2 class="w-3 h-3 mr-1 animate-spin" /> Processing
									</span>
								{:else}
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
										<XCircle class="w-3 h-3 mr-1" /> Failed
									</span>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{doc.chunk_count}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{new Date(doc.created_at).toLocaleDateString()}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
								<button onclick={() => deleteDocument(doc.id)} class="text-red-600 hover:text-red-900 transition-colors">
									<Trash2 size={18} />
								</button>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500">
								No documents uploaded yet.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if activeTab === 'qa'}
		<!-- Create QA Section -->
		<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
			<h2 class="text-lg font-medium text-gray-900 mb-4">Add Manual Q&A</h2>
			
			{#if qaError}
				<div class="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
					{qaError}
				</div>
			{/if}

			<div class="space-y-4">
				<div>
					<label for="question" class="block text-sm font-medium text-gray-700">Question</label>
					<input id="question" bind:value={newQuestion} type="text" placeholder="e.g., What is the guest wifi password?" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border" disabled={savingQa} />
				</div>
				<div>
					<label for="answer" class="block text-sm font-medium text-gray-700">Answer</label>
					<textarea id="answer" bind:value={newAnswer} rows="3" placeholder="e.g., The guest wifi password is 'welcome2024'." class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border" disabled={savingQa}></textarea>
				</div>
				<div class="flex justify-end">
					<button onclick={saveNewQa} disabled={savingQa || !newQuestion.trim() || !newAnswer.trim()} class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors">
						{#if savingQa}
							<Loader2 class="w-4 h-4 mr-2 animate-spin" /> Saving...
						{:else}
							<Plus class="w-4 h-4 mr-2" /> Add Q&A
						{/if}
					</button>
				</div>
			</div>
		</div>

		<!-- QA List Section -->
		<div class="space-y-4">
			<h2 class="text-lg font-medium text-gray-900">Existing Q&A Pairs</h2>
			{#each data.qaPairs || [] as qa}
				<div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative group">
					{#if editingQaId === qa.id}
						<!-- Editing Mode -->
						<div class="space-y-4">
							<div>
								<label for="edit-question" class="block text-sm font-medium text-gray-700">Question</label>
								<input id="edit-question" bind:value={editQuestion} type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border" disabled={updatingQa} />
							</div>
							<div>
								<label for="edit-answer" class="block text-sm font-medium text-gray-700">Answer</label>
								<textarea id="edit-answer" bind:value={editAnswer} rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border" disabled={updatingQa}></textarea>
							</div>
							<div class="flex justify-end space-x-3">
								<button onclick={cancelEditQa} disabled={updatingQa} class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
									Cancel
								</button>
								<button onclick={updateQa} disabled={updatingQa || !editQuestion.trim() || !editAnswer.trim()} class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
									{#if updatingQa}
										<Loader2 class="w-4 h-4 mr-2 animate-spin" /> Saving...
									{:else}
										<Save class="w-4 h-4 mr-2" /> Save Changes
									{/if}
								</button>
							</div>
						</div>
					{:else}
						<!-- View Mode -->
						<div class="pr-16">
							<h3 class="text-sm font-semibold text-gray-900 mb-2">Q: {qa.question}</h3>
							<p class="text-sm text-gray-600 whitespace-pre-wrap">A: {qa.answer}</p>
							<div class="mt-4 text-xs text-gray-400">
								Added by {qa.profiles?.email || 'Unknown'} on {new Date(qa.created_at).toLocaleDateString()}
							</div>
						</div>
						
						<!-- Actions (hidden until hover for cleaner UI) -->
						<div class="absolute top-6 right-6 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
							<button onclick={() => startEditQa(qa)} class="p-2 text-gray-400 hover:text-primary transition-colors rounded-md hover:bg-gray-50" title="Edit">
								<Edit size={18} />
							</button>
							<button onclick={() => deleteQa(qa.id)} class="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-red-50" title="Delete">
								<Trash2 size={18} />
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<div class="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
					No manual Q&A pairs added yet.
				</div>
			{/each}
		</div>
	{/if}
	</div>
</div>
