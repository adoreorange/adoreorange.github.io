// 头像CDN替换配置
(function() {
    'use strict';
    
    // 定义CDN映射
    const CDN_MAP = {
        'cravatar.cn': 'https://cravatar.cn/avatar/',
        'gravatar.com': 'https://gravatar.loli.net/avatar/',
        'cn.gravatar.com': 'https://gravatar.loli.net/avatar/',
        'secure.gravatar.com': 'https://gravatar.loli.net/avatar/',
        'www.gravatar.com': 'https://gravatar.loli.net/avatar/'
    };
    
    // 替换头像链接
    function replaceAvatarCDN() {
        const avatarImgs = document.querySelectorAll('img[src*="gravatar"], img[src*="cravatar"]');
        
        avatarImgs.forEach(img => {
            let src = img.src;
            
            // 替换失效的cn.cravatar.com
            if (src.includes('cn.cravatar.com')) {
                src = src.replace('cn.cravatar.com', 'cravatar.cn');
            }
            
            // 替换gravatar为国内镜像
            if (src.includes('gravatar.com')) {
                src = src.replace(/.*gravatar\.com/, 'https://gravatar.loli.net/avatar');
            }
            
            // 设置新的src
            if (src !== img.src) {
                img.src = src;
            }
        });
    }
    
    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', replaceAvatarCDN);
    } else {
        replaceAvatarCDN();
    }
    
    // 监听动态加载的内容
    const observer = new MutationObserver(replaceAvatarCDN);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
})();