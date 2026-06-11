/**
 * ECharts 懒加载模块
 * 只有在需要使用图表时才加载 ECharts 库
 */
(function() {
    'use strict';

    // 缓存已加载的图表实例
    const chartInstances = {};
    let echartsLoaded = false;
    let loadPromise = null;

    /**
     * 动态加载 ECharts
     */
    function loadECharts() {
        if (loadPromise) {
            return loadPromise;
        }

        loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
            script.onload = () => {
                echartsLoaded = true;
                resolve(window.echarts);
            };
            script.onerror = () => {
                reject(new Error('ECharts 加载失败'));
            };
            document.head.appendChild(script);
        });

        return loadPromise;
    }

    /**
     * 初始化单个图表
     */
    async function initChart(containerId, option) {
        try {
            // 等待 ECharts 加载
            const echarts = await loadECharts();

            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`容器 #${containerId} 未找到`);
            }

            // 创建图表实例
            const chart = echarts.init(container);
            chartInstances[containerId] = chart;

            // 设置图表配置
            if (option) {
                chart.setOption(option);
            }

            // 添加响应式
            const resizeObserver = new ResizeObserver(() => {
                chart.resize();
            });
            resizeObserver.observe(container);

            return chart;
        } catch (error) {
            console.error('图表初始化失败:', error);
            throw error;
        }
    }

    /**
     * 批量初始化图表
     */
    async function initCharts(chartsConfig) {
        const results = [];
        for (const config of chartsConfig) {
            try {
                const chart = await initChart(config.id, config.option);
                results.push({ id: config.id, chart, success: true });
            } catch (error) {
                results.push({ id: config.id, error: error.message, success: false });
            }
        }
        return results;
    }

    /**
     * 检测元素是否进入视口
     */
    function observeElement(selector, callback) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '100px', // 在元素进入视口前100px触发
            threshold: 0.1
        });

        const elements = document.querySelectorAll(selector);
        elements.forEach(el => observer.observe(el));
    }

    /**
     * 自动检测并初始化视口中的图表
     */
    function autoInitCharts() {
        // 检测 tag-echarts
        observeElement('#tag-echarts', async (el) => {
            const chartId = el.id;
            try {
                await initChart(chartId);
                // 触发自定义事件通知图表已加载
                const event = new CustomEvent('echartsLoaded', { detail: { chartId } });
                document.dispatchEvent(event);
            } catch (error) {
                console.error(`自动初始化图表 ${chartId} 失败:`, error);
            }
        });

        // 检测 posts-echart
        observeElement('#posts-echart', async (el) => {
            const chartId = el.id;
            try {
                await initChart(chartId);
                const event = new CustomEvent('echartsLoaded', { detail: { chartId } });
                document.dispatchEvent(event);
            } catch (error) {
                console.error(`自动初始化图表 ${chartId} 失败:`, error);
            }
        });

        // 检测 categories-echarts
        observeElement('#categories-echarts', async (el) => {
            const chartId = el.id;
            try {
                await initChart(chartId);
                const event = new CustomEvent('echartsLoaded', { detail: { chartId } });
                document.dispatchEvent(event);
            } catch (error) {
                console.error(`自动初始化图表 ${chartId} 失败:`, error);
            }
        });
    }

    // 暴露全局 API
    window.EChartsLazy = {
        initChart,
        initCharts,
        getChart: (id) => chartInstances[id],
        isLoaded: () => echartsLoaded,
        loadECharts,
        autoInitCharts
    };

    // DOM 加载完成后自动检测图表
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInitCharts);
    } else {
        autoInitCharts();
    }

    // 兼容 PJAX
    if (window.btf) {
        btf.addGlobalFn('pjaxComplete', autoInitCharts);
    }
})();