/**
 * AI 摘要功能 - 高速版
 * 优化：点进文章立刻开始生成
 */

(function() {
    'use strict';

    // 打字机效果 - 加速版
    function typeTextFast(text, el, speed) {
        speed = speed || 15; // 默认15ms每字符
        let i = 0;
        el.textContent = '';

        function type() {
            if (i < text.length) {
                el.textContent += text.charAt(i++);
                requestAnimationFrame(type);
            }
        }
        requestAnimationFrame(type);
    }

    // 缓存摘要结果
    function getCachedSummary(url) {
        try {
            const cache = sessionStorage.getItem('ai_summary_' + url);
            if (cache) {
                const data = JSON.parse(cache);
                if (Date.now() - data.time < 3600000) { // 1小时缓存
                    return data.content;
                }
            }
        } catch (e) {}
        return null;
    }

    function setCachedSummary(url, content) {
        try {
            sessionStorage.setItem('ai_summary_' + url, JSON.stringify({
                content: content,
                time: Date.now()
            }));
        } catch (e) {}
    }

    // 快速提取文章内容
    function extractContent() {
        const article = document.getElementById('article-container');
        if (!article) return null;

        // 使用 textContent 比 innerText 更快
        let text = article.textContent || '';

        // 快速清洗（使用更简洁的正则）
        text = text
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`[^`]+`/g, '')
            .replace(/{%[^%]+%}/g, '')
            .replace(/^\|.*$/gm, '')
            .replace(/!\[.*?\]/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return text.length > 100 ? text.substring(0, 1500) : null;
    }

    // 快速调用AI
    async function fetchSummary(config, content) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30秒超时

        try {
            const response = await fetch(config.api_url, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + config.api_key
                },
                body: JSON.stringify({
                    model: config.modelName,
                    messages: [
                        { 
                            role: 'system', 
                            content: '你是博客AI助手，根据文章内容生成150-200字的中文摘要。要求：1)简洁专业，突出核心内容；2)纯文本输出，不要分段；3)开头固定为"这里是慕橙AI，这篇文章"。示例：这里是慕橙AI，这篇文章介绍了XXX技术的核心概念和实践方法，通过具体案例展示了其在实际应用中的优势和效果。'
                        },
                        { role: 'user', content: '请为以下文章生成摘要：\n\n' + content.substring(0, 1200) }
                    ],
                    max_tokens: 350,
                    temperature: 0.3
                })
            });

            clearTimeout(timeout);

            if (!response.ok) throw new Error('API错误');

            const data = await response.json();
            if (data.choices?.[0]?.message?.content) {
                return data.choices[0].message.content.trim();
            }
            return null;
        } catch (e) {
            clearTimeout(timeout);
            throw e;
        }
    }

    // 主函数 - 立即执行
    function init() {
        const summaryEl = document.querySelector('.ai-summary .ai-explanation');
        if (!summaryEl) return;

        const config = window.themeConfig?.ai_summary || {};
        if (!config.api_url || !config.api_key) {
            summaryEl.textContent = 'AI摘要配置未完成';
            return;
        }

        // 检查缓存
        const cached = getCachedSummary(window.location.pathname);
        if (cached) {
            typeTextFast(cached, summaryEl, 10);
            return;
        }

        // 立即提取内容
        const content = extractContent();
        if (!content) {
            summaryEl.textContent = '无法提取文章内容';
            return;
        }

        // 显示加载状态
        summaryEl.textContent = config.loadingText || '正在生成AI摘要...';

        // 异步获取摘要
        fetchSummary(config, content)
            .then(summary => {
                if (summary) {
                    setCachedSummary(window.location.pathname, summary);
                    typeTextFast(summary, summaryEl, 10);
                } else {
                    summaryEl.textContent = '摘要生成失败';
                }
            })
            .catch(err => {
                console.error('AI摘要错误:', err);
                summaryEl.textContent = '摘要生成失败，请重试';
            });
    }

    // 立即执行（不等待DOMContentLoaded）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // PJAX支持
    document.addEventListener('pjax:complete', init);
})();
