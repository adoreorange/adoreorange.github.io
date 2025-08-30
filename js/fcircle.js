const FcircleModule = (() => {
    const config = {
        API_URL: 'https://api.allorigins.win/raw?url=http://xiyoucloud.pro:10326/feed',
        CACHE_KEY: 'blog_feed_cache',
        CACHE_DURATION: 6 * 60 * 60 * 1000,
        ITEMS_PER_PAGE: 20,
        ERROR_IMG: 'https://source.adoreorg.cn/webp/icon/error.png'
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
            let allArticles = [];
            let displayedCount = 0;
            let isLoading = false;
            let masonry = null;
            let isRendering = false;

            const masonryContainer = document.getElementById('masonry-container');
            const loadingElement = document.getElementById('loading');
            const noMoreElement = document.getElementById('no-more');
            const refreshBtn = document.getElementById('refresh-btn');
            const clearCacheBtn = document.getElementById('clear-cache-btn');
            const cacheTimeElement = document.getElementById('cache-time');
            const errorContainer = document.getElementById('error-container');
            const errorMessage = document.getElementById('error-message');

            if (!masonryContainer) {
                console.error('未找到masonry-container元素，fcircle模块初始化失败');
                return;
            }

            const updateStats = (data) => {
                if (!data) return;
                const friendCountEl = document.getElementById('friend-count');
                const successCountEl = document.getElementById('success-count');
                const failCountEl = document.getElementById('fail-count');
                const articleCountEl = document.getElementById('article-count');

                if (friendCountEl) friendCountEl.textContent = data.friendCount || 0;
                if (successCountEl) successCountEl.textContent = data.successCount || 0;
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
                const avatar = article.avatar || config.ERROR_IMG;

                card.innerHTML = `
                    <div class="card-header">
                        <h3 class="card-title">
                            <a href="${normalizeLink(article.url, article.link)}" target="_blank" rel="noopener noreferrer">
                                ${fixedIcon} ${title}
                            </a>
                        </h3>
                        <div class="card-author">
                            <img src="${avatar}" alt="${authorName}" class="avatar" loading="lazy" onerror="this.onerror=null;this.src='${config.ERROR_IMG}';">
                            <div>
                                <div class="author-name">${authorName}</div>
                                <div class="card-date">${formattedDate}</div>
                            </div>
                        </div>
                    </div>
                    <div class="fc-card-content">
                        ${decodeShortcodes(article.content) || '暂无内容'}…
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

                if (isRendering) return;
                isRendering = true;

                const startIndex = displayedCount;
                const endIndex = Math.min(startIndex + config.ITEMS_PER_PAGE, allArticles.length);
                let currentIndex = startIndex;

                const processNext = () => {
                    if (currentIndex >= endIndex) {
                        displayedCount = endIndex;
                        if (noMoreElement) {
                            noMoreElement.style.display = (displayedCount >= allArticles.length) ? 'block' : 'none';
                        }
                        isRendering = false;
                        callback();
                        return;
                    }

                    const article = allArticles[currentIndex];
                    if (!article) {
                        currentIndex++;
                        processNext();
                        return;
                    }

                    const card = createArticleCard(article);
                    let finished = false;

                    const finishRender = () => {
                        if (finished) return;
                        finished = true;
                        
                        if (!masonry && typeof Masonry !== 'undefined') {
                            masonry = initMasonry();
                        }

                        clearTimeout(timeout);
                        masonryContainer.appendChild(card);

                        if (masonry) {
                            masonry.appended(card);
                            masonry.layout();
                        }

                        requestAnimationFrame(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        });

                        currentIndex++;
                        runIdle(processNext, 50);
                    };

                    const timeout = setTimeout(finishRender, 1000);

                    if (typeof imagesLoaded !== 'undefined') {
                        imagesLoaded(card, finishRender);
                    } else {
                        card.querySelectorAll('img').forEach(img => {
                            img.onload = img.onerror = finishRender;
                        });
                        setTimeout(finishRender, 100);
                    }
                };
                processNext();
            }

            const loadMoreArticles = () => {
                if (isRendering || isLoading || displayedCount >= allArticles.length) return;
                renderArticles();
            }

            const fetchData = async (forceRefresh = false) => {
                if (isLoading) return;
                isLoading = true;

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
                            isLoading = false;
                            return;
                        }
                    }

                    const response = await fetch(config.API_URL);
                    if (!response.ok) {
                        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                    }

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
                            failCount: data.meta?.fail_count || 0
                        },
                        timestamp: new Date().getTime()
                    };

                    localStorage.setItem(config.CACHE_KEY, JSON.stringify(cacheData));

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
                    
                    if (errorContainer) {
                        errorContainer.style.display = 'block';
                        if (errorMessage) errorMessage.textContent = error.message;
                    }

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
                    isLoading = false;
                    showLoading(false);
                    if (refreshBtn) refreshBtn.disabled = false;
                    if (clearCacheBtn) clearCacheBtn.disabled = false;
                }
            }

            const loadData = async () => {
                await fetchData();
            }

            const handleScroll = throttle(() => {
                if (isRendering || isLoading) return;

                const container = document.querySelector('#masonry-container');
                if (!container) return;

                const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                const isScrollingDown = scrollTop > (container._lastScrollTop || 0);
                container._lastScrollTop = scrollTop;

                if (!isScrollingDown) return;

                const rect = container.getBoundingClientRect();
                const distanceToBottom = rect.bottom - window.innerHeight;

                if (distanceToBottom <= 200) {
                    loadMoreArticles();
                }
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
        FcircleModule.init();
    }
});
