const FcircleModule = (() => {
    const config = {
        API_URL: 'https://fcircle.adoreorg.cn/feed',
        CACHE_KEY: 'blog_feed_cache',
        CACHE_DURATION: 6 * 60 * 60 * 1000,
        ITEMS_PER_PAGE: 20,
        SCROLL_THRESHOLD: 300, // 滚动触发阈值
        PRELOAD_OFFSET: 5, // 预加载偏移量
        RETRY_ATTEMPTS: 3, // 重试次数
        RETRY_DELAY: 1000, // 重试延迟
        ERROR_IMGS: [
            'https://source.adoreorg.cn/webp/icon/error1.jpg',
            'https://source.adoreorg.cn/webp/icon/error2.jpg',
            'https://source.adoreorg.cn/webp/icon/error3.jpg',
            'https://source.adoreorg.cn/webp/icon/error4.jpg',
            'https://source.adoreorg.cn/webp/icon/error5.jpg',
            'https://source.adoreorg.cn/webp/icon/error6.jpg',
            'https://source.adoreorg.cn/webp/icon/error7.jpg',
            'https://source.adoreorg.cn/webp/icon/error8.jpg',
            'https://source.adoreorg.cn/webp/icon/error9.jpg',
            'https://source.adoreorg.cn/webp/icon/error10.jpg',
            'https://source.adoreorg.cn/webp/icon/error11.jpg'
        ]
    }

    // 随机获取错误图片
    const getRandomErrorImg = () => {
        const { ERROR_IMGS } = config;
        if (!Array.isArray(ERROR_IMGS) || ERROR_IMGS.length === 0) {
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjBGMEYwIi8+CjxwYXRoIGQ9Ik0yMCAyMkMxOC44OTU0IDIyIDE4IDIxLjEwNDYgMTggMjBDMTggMTguODk1NCAxOC44OTU0IDE4IDIwIDE4QzIxLjEwNDYgMTggMjIgMTguODk1NCAyMiAyMEMyMiAyMS4xMDQ2IDIxLjEwNDYgMjIgMjAgMjJaIiIgZmlsbD0iIzk5OSIvPgo8L3N2Zz4K'; // 默认SVG占位图
        }
        return ERROR_IMGS[Math.floor(Math.random() * ERROR_IMGS.length)];
    }

    const getCachedData = () => {
        const cached = localStorage.getItem(config.CACHE_KEY);
        if (!cached) return null;

        try {
            const data = JSON.parse(cached);
            const now = new Date().getTime();
            if (now - data.timestamp < config.CACHE_DURATION) {
                return data;
            }
        } catch (e) {
            console.error('缓存数据解析失败:', e);
            localStorage.removeItem(config.CACHE_KEY);
        }
        return null;
    }

    const cleanContent = (content) => {
        if (!content) return '';
        return content
            .replace(/<br\s*\/?>/gi, '\n')
            .trim();
    }

    const decodeShortcodes = (rawContent) => {
        if (!/\[scode|\[collapse|\[hplayer|\[Music/.test(rawContent)) {
            return renderMarkdown(cleanContent(rawContent));
        }

        let content = rawContent;

        content = content.replace(/\[scode\s+type="([^"]+)"\](.*?)\[\/scode\]/g,
            (_, type, inner) => `<span class="scode scode-${type}">${inner}</span>`);

        content = content.replace(/\[collapse\s+status="([^"]+)"\s+title="([^"]+)"\]([\s\S]*?)\[\/collapse\]/g,
            (_, status, title, inner) => {
                const open = status === "true" ? "open" : "";
                return `<details ${open}><summary>${title}</summary><div class="collapse-content">${inner.trim()}</div></details>`;
            });

        content = content.replace(/<br\s*\/?>/gi, "<br>");

        if (content.includes('[hplayer]') || content.includes('[Music')) {
            content = extractMeting(content);
        }

        return renderMarkdown(cleanContent(content));
    }

    const renderMarkdown = (content) => {
        if (typeof marked === 'undefined') {
            console.warn('marked库未加载，使用纯文本显示');
            return content;
        }
        return marked.parse(content);
    }

    const extractMeting = (content) => {
        return content.replace(
            /\[hplayer\][\s\S]*?\[Music\s+server="([^"]+)"\s+id="([^"]+)"\s+type="([^"]+)"\s*\/\][\s\S]*?\[\/hplayer\]/gi,
            (_, server, id, type) => {
                return `<meting-js id="${id}" server="${server}" type="${type}" mutex="true" preload="auto"></meting-js>`;
            }
        );
    }

    const normalizeLink = (url, link) => {
        if (/^https?:\/\//i.test(link)) {
            return link;
        }
        if (!url) return link;

        url = url.replace(/\/+$/, '');
        if (!link.startsWith('/')) {
            link = '/' + link;
        }
        return url + link;
    }

    const runIdle = (callback, timeout = 0) => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(callback, { timeout });
        } else {
            setTimeout(callback, timeout);
        }
    }

    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    const throttle = (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    return {
        init: () => {
            const masonryContainer = document.getElementById('masonry-container');
            const loadingElement = document.getElementById('loading');
            const noMoreElement = document.getElementById('no-more');
            const refreshBtn = document.getElementById('refresh-btn');
            const clearCacheBtn = document.getElementById('clear-cache-btn');
            const cacheTimeElement = document.getElementById('cache-time');
            const errorContainer = document.getElementById('error-container');
            const errorMessage = document.getElementById('error-message');
            
            let allArticles = [];
            let displayedCount = 0;
            let masonry = null;
            let loadingState = {
                isLoading: false,
                isRendering: false,
                retryCount: 0,
                lastScrollTop: 0,
                isScrollingDown: false,
                isInitialized: false // 初始化状态标记
            };
            
            // 防止重复初始化
            if (loadingState.isInitialized) {
                console.log('FcircleModule 已经初始化，跳过重复初始化');
                return;
            }

            if (!masonryContainer) {
                console.error('未找到masonry-container元素，fcircle模块初始化失败');
                return;
            }

            const updateStats = (data) => {
                if (!data) return;
                const friendCountEl = document.getElementById('friend-count');
                const fetchTimeEl = document.getElementById('fetch-time');
                const successCountEl = document.getElementById('success-count');
                const failCountEl = document.getElementById('fail-count');
                const articleCountEl = document.getElementById('article-count');

                if (friendCountEl) friendCountEl.textContent = data.friendCount || 0;
                if (successCountEl) successCountEl.textContent = data.successCount || 0;
                if (fetchTimeEl) fetchTimeEl.textContent = data.fetchTime || '--:--:--';
                if (failCountEl) failCountEl.textContent = data.failCount || 0;
                if (articleCountEl) articleCountEl.textContent = allArticles.length || 0;
            }

            const showLoading = (show) => {
                if (loadingElement) loadingElement.style.display = show ? 'block' : 'none';
            }

            const updateCacheTimeDisplay = (timestamp) => {
                if (!cacheTimeElement) return;
                
                if (!timestamp) {
                    cacheTimeElement.textContent = '--:--:--';
                    return;
                }

                const expireDate = new Date(timestamp + config.CACHE_DURATION);
                const formattedTime = expireDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                cacheTimeElement.textContent = `${formattedTime}`;
            }

            const initMasonry = () => {
                if (typeof Masonry === 'undefined') {
                    console.warn('Masonry库未加载，使用普通布局');
                    return null;
                }
                
                return new Masonry(masonryContainer, {
                    itemSelector: '.fc-card',
                    columnWidth: '.fc-card',
                    percentPosition: true,
                    gutter: 20,
                });
            }

            const createArticleCard = (article) => {
                const card = document.createElement('div');
                card.className = 'fc-card';
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';

                const date = article.published ? new Date(article.published) : new Date();
                const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

                const fixedIcon = '📝';
                const authorName = article.author || '匿名作者';
                const title = article.title || '无标题';
                const avatar = article.avatar || getRandomErrorImg();

                // 内容长度优化
                const maxContentLength = 200;
                let content = decodeShortcodes(article.content) || '暂无内容';
                if (content.length > maxContentLength) {
                    content = content.substring(0, maxContentLength) + '...';
                }

                card.innerHTML = `
                    <div class="card-header">
                        <h3 class="card-title">
                            <a href="${normalizeLink(article.url, article.link)}" target="_blank" rel="noopener noreferrer">
                                ${fixedIcon} ${title}
                            </a>
                        </h3>
                        <div class="card-author">
                            <img src="${avatar}" alt="${authorName}" class="avatar" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${getRandomErrorImg()}';">
                            <div>
                                <div class="author-name">${authorName}</div>
                                <div class="card-date">${formattedDate}</div>
                            </div>
                        </div>
                    </div>
                    <div class="fc-card-content">
                        ${content}
                    </div>
                `;
                return card;
            }

            const renderArticles = (callback = () => {}) => {
                if (allArticles.length === 0) {
                    masonryContainer.innerHTML = '<div class="no-more" style="display:block;">没有找到文章数据</div>';
                    if (noMoreElement) noMoreElement.style.display = 'none';
                    callback();
                    return;
                }

                if (loadingState.isRendering) return;
                loadingState.isRendering = true;

                const startIndex = displayedCount;
                const endIndex = Math.min(startIndex + config.ITEMS_PER_PAGE, allArticles.length);
                let currentIndex = startIndex;

                // 批量渲染优化
                const batchSize = 3;
                let batchQueue = [];

                const processBatch = () => {
                    if (currentIndex >= endIndex) {
                        // 处理剩余的批量队列
                        if (batchQueue.length > 0) {
                            renderBatch(batchQueue, () => {
                                displayedCount = endIndex;
                                if (noMoreElement) {
                                    noMoreElement.style.display = (displayedCount >= allArticles.length) ? 'block' : 'none';
                                }
                                loadingState.isRendering = false;
                                callback();
                            });
                        } else {
                            displayedCount = endIndex;
                            if (noMoreElement) {
                                noMoreElement.style.display = (displayedCount >= allArticles.length) ? 'block' : 'none';
                            }
                            loadingState.isRendering = false;
                            callback();
                        }
                        return;
                    }

                    const article = allArticles[currentIndex];
                    if (!article) {
                        currentIndex++;
                        processBatch();
                        return;
                    }

                    const card = createArticleCard(article);
                    batchQueue.push({ card, index: currentIndex });
                    currentIndex++;

                    if (batchQueue.length >= batchSize) {
                        renderBatch(batchQueue, () => {
                            batchQueue = [];
                            runIdle(processBatch, 10);
                        });
                    } else {
                        runIdle(processBatch, 10);
                    }
                };

                const renderBatch = (batch, batchCallback) => {
                    let finishedCount = 0;
                    const totalCards = batch.length;

                    batch.forEach(({ card }) => {
                        let finished = false;

                        const finishRender = () => {
                            if (finished) return;
                            finished = true;
                            finishedCount++;

                            if (finishedCount >= totalCards) {
                                if (!masonry && typeof Masonry !== 'undefined') {
                                    masonry = initMasonry();
                                }

                                batch.forEach(({ card }) => {
                                    masonryContainer.appendChild(card);
                                    if (masonry) {
                                        masonry.appended(card);
                                    }
                                });

                                if (masonry) {
                                    masonry.layout();
                                }

                                // 批量动画效果
                                requestAnimationFrame(() => {
                                    batch.forEach(({ card }) => {
                                        card.style.opacity = '1';
                                        card.style.transform = 'translateY(0)';
                                        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                                    });
                                });

                                batchCallback();
                            }
                        };

                        // 图片加载检测优化
                        const images = card.querySelectorAll('img');
                        if (images.length === 0) {
                            setTimeout(finishRender, 50);
                        } else {
                            let imgLoadedCount = 0;
                            images.forEach(img => {
                                if (img.complete) {
                                    imgLoadedCount++;
                                } else {
                                    img.onload = img.onerror = () => {
                                        imgLoadedCount++;
                                        if (imgLoadedCount >= images.length) {
                                            finishRender();
                                        }
                                    };
                                }
                            });
                            
                            if (imgLoadedCount >= images.length) {
                                setTimeout(finishRender, 50);
                            }
                            
                            setTimeout(finishRender, 1000); // 超时保护
                        }
                    });
                };

                processBatch();
            }

            const loadMoreArticles = () => {
                if (loadingState.isRendering || loadingState.isLoading || displayedCount >= allArticles.length) return;
                
                // 预加载检测：当剩余文章数量少于预加载偏移量时，提前加载
                const remainingCount = allArticles.length - displayedCount;
                if (remainingCount <= config.PRELOAD_OFFSET) {
                    console.log(`预加载触发，剩余文章数: ${remainingCount}`);
                }
                
                renderArticles();
            }

            const fetchData = async (forceRefresh = false) => {
                if (loadingState.isLoading) return;
                loadingState.isLoading = true;
                loadingState.retryCount = 0;

                const showError = (message, retryCallback) => {
                    if (errorContainer) {
                        errorContainer.style.display = 'block';
                        if (errorMessage) {
                            errorMessage.innerHTML = `${message}`;
                            if (loadingState.retryCount < config.RETRY_ATTEMPTS && retryCallback) {
                                errorMessage.innerHTML += ` <button id="retry-btn" style="margin-left: 10px; padding: 5px 10px; background: var(--theme-color); color: white; border: none; border-radius: 4px; cursor: pointer;">重试</button>`;
                                setTimeout(() => {
                                    const retryBtn = document.getElementById('retry-btn');
                                    if (retryBtn) {
                                        retryBtn.addEventListener('click', () => {
                                            loadingState.retryCount++;
                                            errorContainer.style.display = 'none';
                                            retryCallback();
                                        });
                                    }
                                }, 100);
                            }
                        }
                    }
                };

                try {
                    showLoading(true);
                    if (refreshBtn) refreshBtn.disabled = true;
                    if (clearCacheBtn) clearCacheBtn.disabled = true;
                    if (errorContainer) errorContainer.style.display = 'none';

                    if (!forceRefresh) {
                        const cachedData = getCachedData();
                        if (cachedData) {
                            allArticles = cachedData.items;
                            updateStats(cachedData.meta);
                            renderArticles(() => {
                                updateCacheTimeDisplay(cachedData.timestamp);
                                showLoading(false);
                                if (refreshBtn) refreshBtn.disabled = false;
                                if (clearCacheBtn) clearCacheBtn.disabled = false;
                            });
                            loadingState.isLoading = false;
                            return;
                        }
                    }

                    const fetchWithRetry = async () => {
                        const response = await fetch(config.API_URL, {
                            method: 'GET',
                            headers: {
                                'Accept': 'application/json',
                                'Cache-Control': 'no-cache'
                            },
                            signal: AbortSignal.timeout(10000) // 10秒超时
                        });
                        
                        if (!response.ok) {
                            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                        }
                        
                        return response;
                    };

                    const response = await fetchWithRetry();
                    const data = await response.json();
                    
                    if (!data || !Array.isArray(data.items)) {
                        throw new Error('无效的API响应数据');
                    }

                    allArticles = data.items;
                    const cacheData = {
                        items: allArticles,
                        meta: {
                            friendCount: data.meta?.friend_count || 0,
                            successCount: data.meta?.success_count || 0,
                            failCount: data.meta?.fail_count || 0,
                            fetchTime: data.meta.fetch_time || "暂无时间"
                        },
                        timestamp: new Date().getTime()
                    };

                    localStorage.setItem(config.CACHE_KEY, JSON.stringify(cacheData));

                    // 平滑滚动到顶部
                    if (typeof btf !== 'undefined' && btf.scrollToDest) {
                        btf.scrollToDest(0, 500);
                    } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }

                    displayedCount = 0;
                    masonryContainer.innerHTML = '';

                    if (masonry) {
                        masonry.destroy();
                        masonry = null;
                    }

                    updateStats(cacheData.meta);
                    renderArticles(() => {
                        updateCacheTimeDisplay(cacheData.timestamp);
                        showLoading(false);
                        if (refreshBtn) refreshBtn.disabled = false;
                        if (clearCacheBtn) clearCacheBtn.disabled = false;
                    });

                } catch (error) {
                    console.error('数据加载失败:', error);
                    
                    if (loadingState.retryCount < config.RETRY_ATTEMPTS) {
                        // 延迟重试
                        setTimeout(() => {
                            loadingState.retryCount++;
                            fetchData(forceRefresh);
                        }, config.RETRY_DELAY * loadingState.retryCount);
                        return;
                    }

                    // 显示错误信息
                    showError(error.message, () => fetchData(forceRefresh));

                    // 尝试使用缓存数据
                    const cachedData = getCachedData();
                    if (cachedData) {
                        allArticles = cachedData.items;
                        updateStats(cachedData.meta);
                        renderArticles(() => {
                            updateCacheTimeDisplay(cachedData.timestamp);
                        });
                    } else {
                        masonryContainer.innerHTML = '<div class="error-message">加载失败，请稍后重试</div>';
                    }
                } finally {
                    loadingState.isLoading = false;
                    showLoading(false);
                    if (refreshBtn) refreshBtn.disabled = false;
                    if (clearCacheBtn) clearCacheBtn.disabled = false;
                }
            }

            const loadData = async () => {
                await fetchData();
            }

            const handleScroll = throttle(() => {
                if (loadingState.isRendering || loadingState.isLoading) return;

                const container = document.querySelector('#masonry-container');
                if (!container) return;

                const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                loadingState.isScrollingDown = scrollTop > loadingState.lastScrollTop;
                loadingState.lastScrollTop = scrollTop;

                if (!loadingState.isScrollingDown) return;

                const rect = container.getBoundingClientRect();
                const distanceToBottom = rect.bottom - window.innerHeight;

                // 智能加载：提前预加载，避免用户等待
                if (distanceToBottom <= config.SCROLL_THRESHOLD) {
                    // 预加载检测：当剩余文章数量少于预加载偏移量时，提前加载
                    const remainingCount = allArticles.length - displayedCount;
                    if (remainingCount <= config.PRELOAD_OFFSET) {
                        console.log(`预加载触发，剩余文章数: ${remainingCount}`);
                    }
                    
                    loadMoreArticles();
                }

                // 预加载检测：当接近底部时提前加载下一批
                const remainingCount = allArticles.length - displayedCount;
                if (distanceToBottom <= config.SCROLL_THRESHOLD * 2 && remainingCount > 0 && remainingCount <= config.PRELOAD_OFFSET * 2) {
                    console.log(`智能预加载触发，距离底部: ${distanceToBottom}px，剩余文章: ${remainingCount}`);
                    setTimeout(() => loadMoreArticles(), 200);
                }
                
                // 滚动方向检测，用于优化加载策略
                loadingState.isScrollingDown = scrollTop > loadingState.lastScrollTop;
                loadingState.lastScrollTop = scrollTop;
            }, 150);

            loadData();

            window.addEventListener('scroll', handleScroll, { passive: true });

            if (refreshBtn) {
                refreshBtn.addEventListener('click', debounce(() => {
                    fetchData(true);
                }, 300));
            }

            if (clearCacheBtn) {
                clearCacheBtn.addEventListener('click', debounce(() => {
                    localStorage.removeItem(config.CACHE_KEY);
                    fetchData(true);
                }, 300));
            }

            document.addEventListener('pjax:send', () => {
                if (masonry) {
                    masonry.destroy();
                    masonry = null;
                }
            });

            document.addEventListener('pjax:complete', () => {
                loadData();
            });
            
            // 标记初始化完成
            loadingState.isInitialized = true;
            console.log('FcircleModule 初始化完成');
        },
        reset: () => {
            // 重置模块状态，用于页面切换时重新初始化
            console.log('FcircleModule 重置状态');
            // 重置状态将在下次init时进行
        }
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('masonry-container')) {
        FcircleModule.init();
    }
});

document.addEventListener('pjax:complete', () => {
    if (document.getElementById('masonry-container')) {
        // 重置初始化状态，允许重新初始化
        if (FcircleModule.reset) {
            FcircleModule.reset();
        }
        FcircleModule.init();
    }
});
