<script>
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/tauri';
	import { open } from '@tauri-apps/api/dialog';
	import { listen } from '@tauri-apps/api/event';
	import Library from '$lib/components/Library.svelte';
	import ComicReader from '$lib/components/ComicReader.svelte';

	let currentView = 'library';
	let comics = [];
	let currentComic = null;

	onMount(async () => {
		// Listen for file drop events
		const unlisten = await listen('tauri://file-drop', (event) => {
			handleFileDrop(event.payload);
		});

		// Load existing comics
		loadComics();

		return unlisten;
	});

	async function handleFileDrop(files) {
		for (const file of files) {
			await addComic(file);
		}
	}

	async function openFileDialog() {
		try {
			const selected = await open({
				multiple: true,
				filters: [
					{
						name: 'Comics',
						extensions: ['zip', 'cbz', 'cbr']
					},
					{
						name: 'All Files',
						extensions: ['*']
					}
				]
			});

			if (selected) {
				const files = Array.isArray(selected) ? selected : [selected];
				for (const file of files) {
					await addComic(file);
				}
			}
		} catch (error) {
			console.error('Failed to open file dialog:', error);
		}
	}

	async function addComic(path) {
		try {
			let files;
			if (path.endsWith('.zip') || path.endsWith('.cbz') || path.endsWith('.cbr')) {
				files = await invoke('read_zip_files', { path });
			} else {
				files = await invoke('read_directory_files', { path });
			}

			const comic = {
				id: Date.now(),
				path,
				name: path.split('/').pop() || path.split('\\').pop(),
				files,
				type: path.includes('.') ? 'archive' : 'directory'
			};

			comics = [...comics, comic];
		} catch (error) {
			console.error('Failed to add comic:', error);
		}
	}

	function loadComics() {
		// For now, start with empty library
		// In a real app, this would load from persistent storage
		comics = [];
	}

	function openComic(comic) {
		currentComic = comic;
		currentView = 'reader';
	}

	function closeComic() {
		currentComic = null;
		currentView = 'library';
	}
</script>

<main class="app">
	{#if currentView === 'library'}
		<Library 
			{comics} 
			on:openComic={(event) => openComic(event.detail)}
			on:addComic={openFileDialog}
		/>
	{:else if currentView === 'reader' && currentComic}
		<ComicReader 
			comic={currentComic}
			on:close={closeComic}
		/>
	{/if}
</main>

<style>
	.app {
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #1a1a1a;
		color: #ffffff;
	}

	:global(*) {
		box-sizing: border-box;
	}
</style>