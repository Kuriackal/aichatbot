<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
	<div class="w-full max-w-[400px]">
		{@render children()}
	</div>
</div>
