/**
 * 网站统计脚本 - 优化版
 * 基于test.js的优秀特性重构，提供更好的错误处理和动画效果
 */
(function() {
    'use strict';

    // 工具函数 - 借鉴test.js的结构
    const utils = {
        formatDateTime: (date) => {
            const d = new Date(date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
        },
        
        // 更安全的数字格式化
        formatNumber: (num) => {
            return new Intl.NumberFormat('zh-CN').format(num);
        }
    };

    // Umami配置 - 保持原有配置
    const UMAMI_CONFIG = {
        baseUrl: 'https://um.adoreorg.cn/api',
        websiteId: '71460ec6-a625-4f87-ad62-bb662791e99b',
        token: 'kJYoJ6JmAvNtX2vHbpqFYW+DY4/7nmcbfszqeDmzKDztiKWvxNGTpFK2WP7XkT9r2Smv3o4kN5mnlJ8+0RVrrJGRMWrbKFC4lI7fqVBbEFSRZ4b1K6zJEe72aeLt2fY74O/CHSi5ZbdJPuhtRbh6ZnI0ICjkj2RRUz5LDbn9cLZMh5FYk7qSvNwh48RmPB1IcSvM0/nIgvr9ghQsdAPNo+wXtmF13hbuL2kT0Jl5ZaN+EwHIQiKpV5L2uodg+mCMN6JQwyUoW2B+zkravUpI6uQU8eRcZkmO3omK5bXvG26c43UqWLEIZ8rXvFRJuCovDzO791o1AL3YPdNq4f9TahRftahsPLpyUXYSWcV6RZQFiuw2X+YUaZjpsZ2R"'
    };

    // 统计配置 - 借鉴test.js的命名方式
    const STATS_CONFIG = {
        labels: ["今日人数", "昨日人数", "今日访问", "昨日访问", "本月访问"],
        ids: ["today_uv", "yesterday_uv", "today_pv", "yesterday_pv", "last_month_pv"]
    };

    /**
     * 获取Umami统计数据 - 增强错误处理
     */
    async function fetchUmamiStats(startDate, endDate) {
        try {
            if (!startDate || !endDate) {
                throw new Error("参数 startAt、endAt 不完整");
            }

            const url = new URL(`${UMAMI_CONFIG.baseUrl}/websites/${UMAMI_CONFIG.websiteId}/stats`);
            url.searchParams.append('startAt', startDate.getTime());
            url.searchParams.append('endAt', endDate.getTime());

            const response = await fetch(url.toString(), {
                method: 'GET',
                cache: 'default',
                headers: {
                    'Authorization': `Bearer ${UMAMI_CONFIG.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`请求失败，状态码：${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return {
                pageviews: data.pageviews?.value || 0,
                visitors: data.visitors?.value || 0
            };
        } catch (error) {
            console.error('获取Umami数据失败：', error.message);
            throw error; // 向上传递错误
        }
    }

    /**
     * 获取所有统计数据 - 使用Promise.all优化
     */
    async function getAllStats() {
        const now = new Date();
        
        // 优化时间计算
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const yesterdayEnd = new Date(yesterdayStart);
        yesterdayEnd.setHours(23, 59, 59, 999);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        try {
            const [yesterday, today, month] = await Promise.all([
                fetchUmamiStats(yesterdayStart, yesterdayEnd),
                fetchUmamiStats(todayStart, new Date()),
                fetchUmamiStats(monthStart, new Date())
            ]);

            return {
                today: { pv: today.pageviews, uv: today.visitors },
                yesterday: { pv: yesterday.pageviews, uv: yesterday.visitors },
                month: { pv: month.pageviews, uv: month.visitors }
            };
        } catch (error) {
            console.error('获取统计数据失败:', error);
            throw error;
        }
    }

    /**
     * 创建统计项HTML - 立即显示统计框架
     */
    function createStatsHTML() {
        const container = document.querySelector('#statisticW .content');
        if (!container) {
            console.error('统计容器 #statisticW .content 未找到');
            return null;
        }

        // 立即创建统计框架，不等待数据
        const items = [
            { label: "今日人数", id: "today_uv" },
            { label: "昨日人数", id: "yesterday_uv" },
            { label: "今日访问", id: "today_pv" },
            { label: "昨日访问", id: "yesterday_pv" },
            { label: "本月访问", id: "last_month_pv" }
        ];

        container.innerHTML = items.map(item => 
            `<div><span>${item.label}</span><span class="num" id="${item.id}">-</span></div>`
        ).join('');

        return container;
    }

    /**
     * 更新页面显示 - 立即显示统计结果
     */
    async function updateStatsDisplay() {
        try {
            const stats = await getAllStats();
            if (!stats) return;

            // 数据映射 - 与标签顺序对应
            const data = [
                stats.today.uv,      // 今日人数
                stats.yesterday.uv,  // 昨日人数
                stats.today.pv,      // 今日访问
                stats.yesterday.pv,  // 昨日访问
                stats.month.pv       // 本月访问
            ];

            // 立即显示数据，不等待滚动
            STATS_CONFIG.ids.forEach((id, index) => {
                const element = document.getElementById(id);
                if (element) {
                    const formattedValue = utils.formatNumber(data[index]);
                    
                    if (window.CountUp) {
                        const currentValue = parseFloat(element.textContent.replace(/,/g, "")) || 0;
                        const countUp = new CountUp(element, currentValue, data[index], 0, 1.5, {
                            useEasing: true,
                            useGrouping: true,
                            separator: ",",
                            decimal: "."
                        });
                        if (!countUp.error) {
                            countUp.start();
                        } else {
                            element.textContent = formattedValue;
                        }
                    } else {
                        element.textContent = formattedValue;
                    }
                }
            });

        } catch (error) {
            console.warn('统计数据加载失败', error);
            
            // 显示友好的错误信息
            const elements = document.querySelectorAll('#statisticW .num');
            elements.forEach(el => {
                el.textContent = '数据加载失败';
                el.style.color = '#ff6b6b';
            });

            // 5秒后重试
            setTimeout(() => {
                elements.forEach(el => {
                    el.textContent = '重新加载中...';
                    el.style.color = '';
                });
                updateStatsDisplay();
            }, 5000);
        }
    }

    /**
     * 初始化 - 立即显示统计结果
     */
    function initStats() {
        const container = createStatsHTML();
        if (!container) return;

        // 页面一加载就立即获取并显示数据
        updateStatsDisplay();

        // 每30秒自动刷新
        setInterval(updateStatsDisplay, 30000);

        // 页面激活时刷新
        window.addEventListener('focus', updateStatsDisplay);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                updateStatsDisplay();
            }
        });
    }

    // 立即执行初始化，不等待DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStats);
    } else {
        // DOM已经加载完成，立即执行
        initStats();
    }
    
    // 兼容pjax
    if (window.btf) {
        btf.addGlobalFn('pjaxComplete', initStats);
    }

    // 暴露API
    window.CensusStats = {
        updateStatsDisplay,
        getAllStats,
        formatNumber: utils.formatNumber
    };
})();
