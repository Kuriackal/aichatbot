<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import AuthLayout from '$lib/components/auth/AuthLayout.svelte';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Alert } from '$lib/components/ui/alert';
	import { Separator } from '$lib/components/ui/separator';

	let loading = $state(false);
	let form = $derived($page.form);
	let url = $page.url;
</script>

<AuthLayout>
	<Card class="w-full">
		<CardHeader class="space-y-1">
			<CardTitle class="text-2xl">Sign in to your account</CardTitle>
			<CardDescription>Access your company's knowledge base</CardDescription>
		</CardHeader>
		
		<CardContent class="grid gap-4">
			{#if url.searchParams.get('registered') === 'true'}
				<Alert variant="default" class="bg-green-50 text-green-900 border-green-200">
					Account created successfully. Sign in to continue.
				</Alert>
			{/if}

			{#if form?.error}
				<Alert variant="destructive">
					{form.error}
				</Alert>
			{/if}

			<form method="POST" action="?/login" use:enhance={() => { loading = true; return async ({ update }) => { loading = false; update(); }; }} class="grid gap-4">
				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input id="email" name="email" type="email" placeholder="name@company.com" required value={form?.email ?? ''} />
				</div>
				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<Input id="password" name="password" type="password" required />
				</div>
				
				<Button type="submit" class="w-full mt-2" disabled={loading}>
					{loading ? 'Signing in...' : 'Sign In'}
				</Button>
			</form>
		</CardContent>
		
		<CardFooter class="flex flex-col gap-4">
			<Separator />
			<div class="text-center text-sm text-muted-foreground">
				Don't have an account? <a href="/register" class="underline underline-offset-4 hover:text-primary">Create one</a>
			</div>
		</CardFooter>
	</Card>
</AuthLayout>
