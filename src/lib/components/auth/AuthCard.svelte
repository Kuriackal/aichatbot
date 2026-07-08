<script lang="ts">
	let { children } = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden font-sans">
	<!-- Ledger / Archive Background Pattern -->
	<div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(255,255,255,0.2) 31px, rgba(255,255,255,0.2) 32px), repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(255,255,255,0.1) 31px, rgba(255,255,255,0.1) 32px); background-size: 32px 32px;"></div>
	
	<!-- Content Wrapper -->
	<div class="w-full max-w-md relative z-10 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
		<!-- Index Card -->
		<div class="bg-[#fcfaf5] rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[#e5dfc5] relative overflow-hidden">
			
			<!-- Brass Nameplate / Header Accents -->
			<div class="absolute top-0 left-0 right-0 h-3 bg-[#0f172a] border-b-[3px] border-[#d4af37]"></div>
			
			<!-- Red vertical margin line of index card -->
			<div class="absolute left-8 top-0 bottom-0 w-[1px] bg-red-300/50 pointer-events-none"></div>
			<div class="absolute left-9 top-0 bottom-0 w-[1px] bg-red-300/50 pointer-events-none"></div>
			
			<!-- Horizontal ruled lines -->
			<div class="absolute inset-0 top-[104px] pointer-events-none opacity-30" style="background-image: repeating-linear-gradient(transparent, transparent 31px, #94a3b8 31px, #94a3b8 32px);"></div>

			<!-- Card Content -->
			<div class="relative pt-12 pb-10 px-12 z-10">
				{@render children()}
			</div>
		</div>
	</div>
</div>
