<script>
	import { createEventDispatcher } from 'svelte';

	export let comics = [];

	const dispatch = createEventDispatcher();

	function handleOpenComic(comic) {
		dispatch('openComic', comic);
	}

	function handleAddComic() {
		dispatch('addComic');
	}
</script>

<div class="library">
	<header class="header">
		<h1>📚 Reindeer Comic</h1>
		<button class="add-button" on:click={handleAddComic}>
			📚 添加漫画
		</button>
	</header>

	<div class="content">
		{#if comics.length === 0}
			<div class="empty-state">
				<h2>欢迎使用 Reindeer Comic</h2>
				<p>拖拽漫画文件到这里，或点击"添加漫画"按钮开始阅读</p>
				<p>支持的格式: ZIP, CBZ, CBR 文件和图片文件夹</p>
			</div>
		{:else}
			<div class="comics-grid">
				{#each comics as comic (comic.id)}
					<div class="comic-card" on:click={() => handleOpenComic(comic)}>
						<div class="comic-cover">
							📖
						</div>
						<div class="comic-info">
							<h3>{comic.name}</h3>
							<p>{comic.files.length} 页</p>
							<p class="comic-type">{comic.type === 'archive' ? '压缩包' : '文件夹'}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.library {
		width: 100%;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #1a1a1a;
		color: #ffffff;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 2rem;
		background: #2a2a2a;
		border-bottom: 1px solid #3a3a3a;
	}

	.header h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.add-button {
		background: #4a9eff;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.add-button:hover {
		background: #3a8eef;
	}

	.content {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		text-align: center;
		color: #888;
	}

	.empty-state h2 {
		margin-bottom: 1rem;
		color: #ccc;
	}

	.empty-state p {
		margin: 0.5rem 0;
		font-size: 1.1rem;
	}

	.comics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.comic-card {
		background: #2a2a2a;
		border-radius: 12px;
		padding: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		border: 1px solid #3a3a3a;
	}

	.comic-card:hover {
		background: #3a3a3a;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.comic-cover {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 200px;
		background: #1a1a1a;
		border-radius: 8px;
		font-size: 4rem;
		margin-bottom: 1rem;
		border: 1px solid #444;
	}

	.comic-info h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #fff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.comic-info p {
		margin: 0.25rem 0;
		color: #888;
		font-size: 0.9rem;
	}

	.comic-type {
		background: #4a9eff;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8rem;
		display: inline-block;
	}
</style>