<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/tauri';

	export let comic;

	const dispatch = createEventDispatcher();

	let currentPageIndex = 0;
	let images = [];
	let zoomLevel = 1;
	let containerElement;
	let loadingImages = new Set();
	let viewMode = 'single'; // 'single', 'double', 'webtoon'
	let webtoonScrollContainer;

	onMount(() => {
		loadImages();
		
		// Keyboard shortcuts
		const handleKeyDown = (event) => {
			switch (event.key) {
				case 'Escape':
					handleClose();
					break;
				case 'ArrowLeft':
				case 'a':
				case 'A':
					if (event.shiftKey && viewMode === 'double') {
						// Shift + 左箭头：双页模式下单页向前
						previousSinglePage();
					} else {
						previousPage();
					}
					break;
				case 'ArrowRight':
				case 'd':
				case 'D':
					if (event.shiftKey && viewMode === 'double') {
						// Shift + 右箭头：双页模式下单页向后
						nextSinglePage();
					} else {
						nextPage();
					}
					break;
				case ' ':
					if (viewMode !== 'webtoon') {
						if (event.shiftKey && viewMode === 'double') {
							// Shift + 空格：双页模式下单页向后
							nextSinglePage();
						} else {
							nextPage();
						}
					}
					break;
				case 'Home':
					goToPage(0);
					break;
				case 'End':
					goToPage(images.length - 1);
					break;
			}
		};

		const handleWheel = (event) => {
			if (event.ctrlKey || event.metaKey) {
				event.preventDefault();
				const delta = event.deltaY > 0 ? -0.1 : 0.1;
				zoomLevel = Math.max(0.1, Math.min(5, zoomLevel + delta));
			} else if (viewMode === 'webtoon' && webtoonScrollContainer) {
				// Let webtoon mode handle normal scrolling
				return;
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		if (containerElement) {
			containerElement.addEventListener('wheel', handleWheel);
		}

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			if (containerElement) {
				containerElement.removeEventListener('wheel', handleWheel);
			}
		};
	});

	async function loadImages() {
		images = comic.files.map((file, index) => ({
			id: index,
			src: null, // Will be loaded on demand
			name: file,
			isLoaded: false
		}));

		// Preload current image and next few images
		await loadImageData(0);
		if (images.length > 1) await loadImageData(1);
		if (images.length > 2) await loadImageData(2);
	}

	async function loadImageData(index) {
		if (index < 0 || index >= images.length || images[index].isLoaded || loadingImages.has(index)) {
			return;
		}

		loadingImages.add(index);
		
		try {
			let src;
			if (comic.type === 'archive') {
				src = await invoke('read_image_from_zip', { 
					zipPath: comic.path, 
					imagePath: images[index].name 
				});
			} else {
				// For directory-based comics, use convertFileSrc
				const { convertFileSrc } = await import('@tauri-apps/api/tauri');
				src = convertFileSrc(images[index].name);
			}
			
			images[index].src = src;
			images[index].isLoaded = true;
			images = [...images]; // Trigger reactivity
		} catch (error) {
			console.error('Failed to load image:', error);
			images[index].src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==';
			images[index].isLoaded = true;
			images = [...images];
		} finally {
			loadingImages.delete(index);
		}
	}

	// Load images when page changes
	$: if (currentPageIndex >= 0) {
		if (viewMode === 'webtoon') {
			// Preload all images for webtoon mode
			for (let i = 0; i < images.length; i++) {
				loadImageData(i);
			}
		} else {
			// Preload current and next few images for single/double mode
			loadImageData(currentPageIndex);
			loadImageData(currentPageIndex + 1);
			loadImageData(currentPageIndex + 2);
			if (viewMode === 'double') {
				loadImageData(currentPageIndex + 3);
				loadImageData(currentPageIndex + 4);
			}
		}
	}

	function handleClose() {
		dispatch('close');
	}

	function previousPage() {
		if (viewMode === 'webtoon') return;
		
		if (viewMode === 'double') {
			// 确保双页模式下正确跳转，且不超出边界
			currentPageIndex = Math.max(0, currentPageIndex - 2);
		} else {
			if (currentPageIndex > 0) {
				currentPageIndex--;
			}
		}
	}

	function nextPage() {
		if (viewMode === 'webtoon') return;
		
		if (viewMode === 'double') {
			// 双页模式下，确保不超出图片总数
			const nextIndex = currentPageIndex + 2;
			if (nextIndex < images.length) {
				currentPageIndex = nextIndex;
			}
		} else {
			if (currentPageIndex < images.length - 1) {
				currentPageIndex++;
			}
		}
	}

	// 新增：单页移动功能（用于双页模式微调）
	function previousSinglePage() {
		if (currentPageIndex > 0) {
			currentPageIndex--;
		}
	}

	function nextSinglePage() {
		if (currentPageIndex < images.length - 1) {
			currentPageIndex++;
		}
	}

	function goToPage(index) {
		if (index >= 0 && index < images.length) {
			currentPageIndex = index;
		}
	}

	function resetZoom() {
		zoomLevel = 1;
	}

	function switchViewMode(mode) {
		viewMode = mode;
		if (mode === 'webtoon') {
			zoomLevel = 1; // Reset zoom for webtoon mode
		}
	}
</script>

<div class="reader" bind:this={containerElement}>
	<header class="reader-header">
		<button class="close-button" on:click={handleClose} title="返回图书馆 (ESC)">
			← 返回
		</button>
		
		<div class="comic-title">
			<h2>{comic.name}</h2>
			<span class="page-counter">
				{#if viewMode === 'webtoon'}
					{images.length} 页
				{:else if viewMode === 'double'}
					{Math.floor(currentPageIndex / 2) + 1} / {Math.ceil(images.length / 2)}
				{:else}
					{currentPageIndex + 1} / {images.length}
				{/if}
			</span>
		</div>

		<div class="controls">
			<div class="view-mode-selector">
				<button 
					class="mode-button" 
					class:active={viewMode === 'single'}
					on:click={() => switchViewMode('single')}
					title="单页模式"
				>
					📄
				</button>
				<button 
					class="mode-button" 
					class:active={viewMode === 'double'}
					on:click={() => switchViewMode('double')}
					title="双页模式"
				>
					📖
				</button>
				<button 
					class="mode-button" 
					class:active={viewMode === 'webtoon'}
					on:click={() => switchViewMode('webtoon')}
					title="Webtoon模式"
				>
					📜
				</button>
			</div>
			
			{#if viewMode === 'double'}
				<div class="help-text">
					<span title="双页模式快捷键：←/→ 双页翻页，Shift+←/→ 单页调整">
						💡 Shift+方向键单页调整
					</span>
				</div>
			{/if}
			
			<button class="control-button" on:click={resetZoom} title="重置缩放">
				🔍 {Math.round(zoomLevel * 100)}%
			</button>
		</div>
	</header>

	<div class="reader-content" class:webtoon-mode={viewMode === 'webtoon'}>
		{#if images.length > 0}
			{#if viewMode === 'webtoon'}
				<!-- Webtoon模式：垂直滚动显示所有图片 -->
				<div class="webtoon-container" bind:this={webtoonScrollContainer}>
					{#each images as image, index}
						{#if image && image.isLoaded && image.src}
							<div class="webtoon-page">
								<img 
									src={image.src}
									alt={`Page ${index + 1}`}
									style="width: 100%; height: auto;"
								/>
							</div>
						{:else}
							<div class="webtoon-page loading-page">
								<p>加载第 {index + 1} 页...</p>
							</div>
						{/if}
					{/each}
				</div>
			{:else}
				<!-- 单页/双页模式 -->
				<div class="page-container" class:double-page={viewMode === 'double'}>
					{#if viewMode === 'double'}
						<!-- 双页模式：显示两页 -->
						{#if images[currentPageIndex]}
							<div class="page-wrapper">
								{#if images[currentPageIndex].isLoaded && images[currentPageIndex].src}
									<img 
										src={images[currentPageIndex].src}
										alt={`Page ${currentPageIndex + 1}`}
										style="transform: scale({zoomLevel})"
										class="page-image"
									/>
								{:else}
									<div class="loading">
										<p>加载第 {currentPageIndex + 1} 页...</p>
									</div>
								{/if}
							</div>
						{/if}
						
						{#if images[currentPageIndex + 1]}
							<div class="page-wrapper">
								{#if images[currentPageIndex + 1].isLoaded && images[currentPageIndex + 1].src}
									<img 
										src={images[currentPageIndex + 1].src}
										alt={`Page ${currentPageIndex + 2}`}
										style="transform: scale({zoomLevel})"
										class="page-image"
									/>
								{:else}
									<div class="loading">
										<p>加载第 {currentPageIndex + 2} 页...</p>
									</div>
								{/if}
							</div>
						{/if}
					{:else}
						<!-- 单页模式：显示一页 -->
						{#if images[currentPageIndex]}
							<div class="page-wrapper">
								{#if images[currentPageIndex].isLoaded && images[currentPageIndex].src}
									<img 
										src={images[currentPageIndex].src}
										alt={`Page ${currentPageIndex + 1}`}
										style="transform: scale({zoomLevel})"
										class="page-image"
									/>
								{:else}
									<div class="loading">
										<p>加载第 {currentPageIndex + 1} 页...</p>
									</div>
								{/if}
							</div>
						{:else}
							<div class="page-wrapper loading-wrapper">
								<div class="loading">
									<p>图片不存在</p>
								</div>
							</div>
						{/if}
					{/if}
				</div>

				<!-- 导航按钮（仅在单页/双页模式显示） -->
				<div class="navigation">
					{#if viewMode === 'double'}
						<!-- 双页模式：显示单步和双步导航 -->
						<div class="nav-group">
							<button 
								class="nav-button single-step"
								on:click={previousSinglePage}
								disabled={currentPageIndex === 0}
								title="单页后退 (Shift+←)"
							>
								‹
							</button>
							<button 
								class="nav-button prev"
								on:click={previousPage}
								disabled={currentPageIndex === 0}
								title="双页后退 (←)"
							>
								«
							</button>
						</div>
						
						<div class="nav-group">
							<button 
								class="nav-button next"
								on:click={nextPage}
								disabled={currentPageIndex + 2 >= images.length}
								title="双页前进 (→)"
							>
								»
							</button>
							<button 
								class="nav-button single-step"
								on:click={nextSinglePage}
								disabled={currentPageIndex === images.length - 1}
								title="单页前进 (Shift+→)"
							>
								›
							</button>
						</div>
					{:else}
						<!-- 单页模式：显示常规导航 -->
						<button 
							class="nav-button prev"
							on:click={previousPage}
							disabled={currentPageIndex === 0}
							title="上一页 (A/←)"
						>
							←
						</button>
						
						<button 
							class="nav-button next"
							on:click={nextPage}
							disabled={currentPageIndex === images.length - 1}
							title="下一页 (D/→/空格)"
						>
							→
						</button>
					{/if}
				</div>
			{/if}

			<!-- 页面缩略图（在所有模式下显示） -->
			<div class="page-thumbnails" class:webtoon-thumbnails={viewMode === 'webtoon'}>
				{#each images as image, index}
					<button 
						class="thumbnail"
						class:active={viewMode === 'webtoon' 
							? false 
							: viewMode === 'double' 
								? index >= currentPageIndex && index < currentPageIndex + 2
								: index === currentPageIndex}
						on:click={() => goToPage(index)}
						title="第 {index + 1} 页"
					>
						{index + 1}
					</button>
				{/each}
			</div>
		{:else}
			<div class="loading">
				<p>加载中...</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.reader {
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #000;
		color: #fff;
	}

	.reader-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: rgba(42, 42, 42, 0.95);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid #444;
		position: relative;
		z-index: 10;
	}

	.close-button {
		background: #666;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.close-button:hover {
		background: #777;
	}

	.comic-title {
		text-align: center;
		flex: 1;
	}

	.comic-title h2 {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 600;
	}

	.page-counter {
		font-size: 0.9rem;
		color: #ccc;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.view-mode-selector {
		display: flex;
		gap: 0.25rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 0.25rem;
	}

	.mode-button {
		background: transparent;
		color: #ccc;
		border: none;
		padding: 0.5rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.2s;
		min-width: 40px;
	}

	.mode-button:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	.mode-button.active {
		background: #4a9eff;
		color: white;
	}

	.help-text {
		font-size: 0.8rem;
		color: #999;
		white-space: nowrap;
	}

	.help-text span {
		cursor: help;
	}

	.control-button {
		background: #666;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.control-button:hover {
		background: #777;
	}

	.reader-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}

	.reader-content.webtoon-mode {
		overflow-y: auto;
		overflow-x: hidden;
	}

	/* Webtoon模式样式 */
	.webtoon-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0;
		gap: 0;
		max-width: 800px;
		margin: 0 auto;
	}

	.webtoon-page {
		width: 100%;
		display: flex;
		justify-content: center;
		line-height: 0;
	}

	.webtoon-page img {
		max-width: 100%;
		height: auto;
		display: block;
		margin: 0;
		padding: 0;
		vertical-align: top;
	}

	.loading-page {
		min-height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #2a2a2a;
		border-radius: 8px;
		color: #888;
	}

	/* 单页/双页模式样式 */
	.page-container {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 0;
	}

	.page-container.double-page {
		gap: 0;
	}

	.page-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		max-width: 100%;
		max-height: 100%;
		margin: 0;
		padding: 0;
	}

	.page-image {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		transition: transform 0.1s ease;
		transform-origin: center;
		display: block;
		margin: 0;
		padding: 0;
		vertical-align: top;
	}

	.double-page .page-wrapper {
		flex: 1;
		max-width: 50%;
		margin: 0;
		padding: 0;
	}

	.double-page .page-image {
		width: 100%;
		margin: 0;
		padding: 0;
	}

	.loading-wrapper {
		min-width: 200px;
		min-height: 300px;
		background: #2a2a2a;
		border-radius: 8px;
	}

	.navigation {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		width: 100%;
		display: flex;
		justify-content: space-between;
		padding: 0 2rem;
		pointer-events: none;
		z-index: 5;
	}

	/* 双页模式的导航组 */
	.nav-group {
		display: flex;
		gap: 0.5rem;
		pointer-events: auto;
	}

	.nav-button {
		background: rgba(0, 0, 0, 0.7);
		color: white;
		border: none;
		width: 60px;
		height: 60px;
		border-radius: 50%;
		font-size: 1.5rem;
		cursor: pointer;
		pointer-events: auto;
		transition: all 0.2s;
		backdrop-filter: blur(5px);
	}

	.nav-button.single-step {
		width: 50px;
		height: 50px;
		font-size: 1.2rem;
		background: rgba(74, 158, 255, 0.7);
	}

	.nav-button:hover:not(:disabled) {
		background: rgba(0, 0, 0, 0.9);
		transform: scale(1.1);
	}

	.nav-button.single-step:hover:not(:disabled) {
		background: rgba(74, 158, 255, 0.9);
		transform: scale(1.1);
	}

	.nav-button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.page-thumbnails {
		position: absolute;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 0.25rem;
		max-width: 80%;
		overflow-x: auto;
		padding: 0.5rem;
		background: rgba(0, 0, 0, 0.7);
		border-radius: 25px;
		backdrop-filter: blur(10px);
	}

	.thumbnail {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: none;
		width: 32px;
		height: 32px;
		border-radius: 16px;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.thumbnail:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.thumbnail.active {
		background: #4a9eff;
	}

	.page-thumbnails.webtoon-thumbnails {
		position: fixed;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		flex-direction: column;
		max-height: 60vh;
		width: auto;
		background: rgba(0, 0, 0, 0.8);
		border-radius: 25px;
		overflow-y: auto;
		max-width: none;
	}

	.webtoon-thumbnails .thumbnail {
		margin: 0.125rem 0;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		font-size: 1.2rem;
		color: #888;
	}

	/* Hide scrollbars in thumbnails */
	.page-thumbnails::-webkit-scrollbar {
		height: 4px;
	}

	.page-thumbnails::-webkit-scrollbar-track {
		background: transparent;
	}

	.page-thumbnails::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.3);
		border-radius: 2px;
	}

	.page-thumbnails::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.5);
	}
</style>