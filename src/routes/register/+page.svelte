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
</script>

<AuthLayout>
	<Card class="w-full">
		<CardHeader class="space-y-1">
			<CardTitle class="text-2xl">Create your account</CardTitle>
			<CardDescription>Get access to Company's knowledge base</CardDescription>
		</CardHeader>
		
		<CardContent class="grid gap-4">
			{#if form?.error}
				<Alert variant="destructive">
					{form.error}
				</Alert>
			{/if}

			<form method="POST" use:enhance={() => { loading = true; return async ({ update }) => { loading = false; update(); }; }} class="grid gap-4">
				<div class="grid gap-2">
					<Label for="fullName">Full Name</Label>
					<Input id="fullName" name="fullName" type="text" placeholder="Jane Doe" required value={form?.fullName ?? ''} />
				</div>
				
				<div class="grid gap-2">
					<Label for="email">Email Address</Label>
					<Input id="email" name="email" type="email" placeholder="employee@company.com" required value={form?.email ?? ''} />
				</div>

				<div class="grid gap-2">
					<Label for="password">Password</Label>
					<Input id="password" name="password" type="password" required />
				</div>

				<div class="grid gap-2">
					<Label for="confirmPassword">Confirm Password</Label>
					<Input id="confirmPassword" name="confirmPassword" type="password" required />
				</div>
				
				<Button type="submit" class="w-full mt-2" disabled={loading}>
					{loading ? 'Creating account...' : 'Create Account'}
				</Button>
			</form>
		</CardContent>
		
		<CardFooter class="flex flex-col gap-4">
			<Separator />
			<div class="text-center text-sm text-muted-foreground">
				Already have an account? <a href="/login" class="underline underline-offset-4 hover:text-primary">Sign in</a>
			</div>
		</CardFooter>
	</Card>
</AuthLayout>
