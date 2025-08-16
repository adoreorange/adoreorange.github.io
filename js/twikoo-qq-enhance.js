// Twikoo QQ头像增强配置 - 优化版本
(function() {
    'use strict';
    
    // 配置常量
    const QQ_AVATAR_URL = 'https://q1.qlogo.cn/g?b=qq&nk={qq}&s=100';
    const QQ_EMAIL_REGEX = /^[1-9][0-9]{4,}@qq\.com$/i;
    
    // 等待Twikoo加载完成
    function initTwikooEnhancement() {
        // 检查Twikoo是否已加载
        if (typeof twikoo !== 'undefined') {
            enhanceTwikooConfig();
            enhanceTwikooUI();
        } else {
            // 等待Twikoo加载
            const observer = new MutationObserver(() => {
                if (typeof twikoo !== 'undefined') {
                    enhanceTwikooConfig();
                    enhanceTwikooUI();
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            
            // 超时处理
            setTimeout(() => {
                observer.disconnect();
                if (typeof twikoo !== 'undefined') {
                    enhanceTwikooConfig();
                    enhanceTwikooUI();
                }
            }, 3000);
        }
    }
    
    // 增强Twikoo配置
    function enhanceTwikooConfig() {
        // 保存原始方法
        const originalGetAvatar = window.twikoo?.getAvatar;
        
        // 重写头像获取方法
        if (window.twikoo && window.twikoo.getAvatar) {
            window.twikoo.getAvatar = function(mail, config = {}) {
                if (!mail) return config.default || '';
                
                // 检查是否为QQ邮箱
                if (QQ_EMAIL_REGEX.test(mail)) {
                    const qqNumber = mail.split('@')[0];
                    return QQ_AVATAR_URL.replace('{qq}', qqNumber);
                }
                
                // 使用原始方法处理其他邮箱
                return originalGetAvatar.call(this, mail, config);
            };
        }
    }
    
    // 增强用户界面
    function enhanceTwikooUI() {
        // 监听评论表单加载
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            enhanceEmailInput(node);
                            enhanceAvatarDisplay(node);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // 立即执行一次
        enhanceEmailInput(document);
        enhanceAvatarDisplay(document);
    }
    
    // 增强邮箱输入框
    function enhanceEmailInput(container) {
        const emailInputs = container.querySelectorAll('.tk-input[data-name="mail"] input, input[name="mail"]');
        
        emailInputs.forEach(input => {
            if (input.dataset.enhanced) return;
            input.dataset.enhanced = 'true';
            
            // 创建提示元素
            const hint = createQQHint();
            const formGroup = input.closest('.tk-input-group') || input.parentNode;
            
            if (formGroup) {
                formGroup.appendChild(hint);
            }
            
            // 监听邮箱变化
            input.addEventListener('input', handleEmailChange);
            input.addEventListener('blur', handleEmailChange);
        });
    }
    
    // 创建QQ提示
    function createQQHint() {
        const hint = document.createElement('div');
        hint.className = 'twikoo-qq-hint';
        hint.innerHTML = '<small style="color: #666; margin-top: 5px; display: block; font-size: 12px;">💡 输入QQ邮箱(如123456@qq.com)将显示QQ头像</small>';
        hint.style.opacity = '0';
        hint.style.transition = 'opacity 0.3s ease';
        return hint;
    }
    
    // 处理邮箱变化
    function handleEmailChange(event) {
        const email = event.target.value.trim();
        const hint = event.target.parentNode.querySelector('.twikoo-qq-hint');
        
        if (QQ_EMAIL_REGEX.test(email)) {
            hint.style.opacity = '1';
            updateAvatarPreview(email);
        } else {
            hint.style.opacity = '0.6';
        }
    }
    
    // 更新头像预览
    function updateAvatarPreview(email) {
        if (!QQ_EMAIL_REGEX.test(email)) return;
        
        const qqNumber = email.split('@')[0];
        const previewAvatar = document.querySelector('.tk-preview .tk-avatar img');
        
        if (previewAvatar) {
            previewAvatar.src = QQ_AVATAR_URL.replace('{qq}', qqNumber);
            previewAvatar.style.borderRadius = '50%';
        }
    }
    
    // 增强头像显示
    function enhanceAvatarDisplay(container) {
        const avatars = container.querySelectorAll('.tk-avatar img, .tk-avatar .tk-avatar-img');
        
        avatars.forEach(avatar => {
            if (avatar.dataset.processed) return;
            avatar.dataset.processed = 'true';
            
            // 确保头像为圆形
            avatar.style.borderRadius = '50%';
            
            // 处理QQ头像
            const email = avatar.dataset.mail || avatar.alt;
            if (email && QQ_EMAIL_REGEX.test(email)) {
                const qqNumber = email.split('@')[0];
                avatar.src = QQ_AVATAR_URL.replace('{qq}', qqNumber);
            }
        });
    }
    
    // 添加CSS样式
    function addCustomStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .twikoo-qq-hint {
                margin-top: 5px !important;
                font-size: 12px !important;
                color: #666 !important;
            }
            .tk-avatar img {
                border-radius: 50% !important;
                transition: all 0.3s ease !important;
            }
            .tk-avatar img:hover {
                transform: scale(1.1) !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 初始化
    function init() {
        addCustomStyles();
        initTwikooEnhancement();
        
        // 兼容pjax和路由变化
        ['pjax:complete', 'DOMContentLoaded', 'load'].forEach(event => {
            document.addEventListener(event, initTwikooEnhancement);
        });
    }
    
    // 启动
    init();
})();